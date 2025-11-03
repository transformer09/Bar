import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { supabase } from '../services/supabase';
import { activityService } from '../services/activityService';

const router = express.Router();

router.use(authMiddleware);

// Helper: Generate unique batch number
function generateBatchNumber(itemId: string, receivedDate: Date): string {
  const date = receivedDate.toISOString().split('T')[0].replace(/-/g, '');
  const timestamp = receivedDate.getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BTH-${itemId}-${date}-${timestamp}-${random}`;
}

// Helper: Calculate FIFO usage
function calculateFIFOUsage(batches: any[], quantityNeeded: number): any[] {
  const usage = [];
  let remainingNeeded = quantityNeeded;

  // Sort batches by received date (oldest first for FIFO)
  const sortedBatches = [...batches].sort((a, b) =>
    new Date(a.received_date).getTime() - new Date(b.received_date).getTime()
  );

  for (const batch of sortedBatches) {
    if (remainingNeeded <= 0) break;

    const availableQuantity = batch.quantity_available;
    const quantityFromBatch = Math.min(availableQuantity, remainingNeeded);

    usage.push({
      batch_id: batch.id,
      quantity_used: quantityFromBatch,
      unit_cost: batch.unit_cost,
      total_cost: quantityFromBatch * batch.unit_cost,
      batch_number: batch.batch_number,
      expiration_date: batch.expiration_date,
      received_date: batch.received_date
    });

    remainingNeeded -= quantityFromBatch;
  }

  return usage;
}

// Helper: Calculate LIFO usage
function calculateLIFOUsage(batches: any[], quantityNeeded: number): any[] {
  const usage = [];
  let remainingNeeded = quantityNeeded;

  // Sort batches by received date (newest first for LIFO)
  const sortedBatches = [...batches].sort((a, b) =>
    new Date(b.received_date).getTime() - new Date(a.received_date).getTime()
  );

  for (const batch of sortedBatches) {
    if (remainingNeeded <= 0) break;

    const availableQuantity = batch.quantity_available;
    const quantityFromBatch = Math.min(availableQuantity, remainingNeeded);

    usage.push({
      batch_id: batch.id,
      quantity_used: quantityFromBatch,
      unit_cost: batch.unit_cost,
      total_cost: quantityFromBatch * batch.unit_cost,
      batch_number: batch.batch_number,
      expiration_date: batch.expiration_date,
      received_date: batch.received_date
    });

    remainingNeeded -= quantityFromBatch;
  }

  return usage;
}

// Helper: Calculate weighted average cost
function calculateWeightedAverageCost(batches: any[]): number {
  let totalCost = 0;
  let totalUnits = 0;

  for (const batch of batches) {
    totalCost += batch.quantity_available * batch.unit_cost;
    totalUnits += batch.quantity_available;
  }

  return totalUnits > 0 ? totalCost / totalUnits : 0;
}

// ============================================================================
// STOCK RECEIVING (STOCK IN) - BATCH TRACKING
// ============================================================================

// Receive new stock - Creates new batch with LIFO/FIFO logic
router.post('/receive', requirePermission('inventory:create'), async (req: AuthRequest, res) => {
  try {
    const {
      item_id,
      quantity_received,
      unit_cost,
      supplier_id,
      expiration_date,
      purchase_order_id,
      notes,
      batch_number
    } = req.body;

    if (!item_id || !quantity_received || !unit_cost) {
      return res.status(400).json({ error: 'Item ID, quantity, and unit cost are required' });
    }

    if (quantity_received <= 0 || unit_cost <= 0) {
      return res.status(400).json({ error: 'Quantity and unit cost must be greater than 0' });
    }

    const receivedDate = new Date();
    const finalBatchNumber = batch_number || generateBatchNumber(item_id, receivedDate);
    const batchId = uuidv4();

    // Get current item to update current_stock
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock, name, valuation_method')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Create new batch
    const { data: batch, error: batchError } = await supabase
      .from('inventory_batches')
      .insert({
        id: batchId,
        inventory_item_id: item_id,
        batch_number: finalBatchNumber,
        received_date: receivedDate.toISOString(),
        unit_cost,
        quantity_received,
        quantity_available: quantity_received,
        quantity_used: 0,
        expiration_date: expiration_date || null,
        supplier_id: supplier_id || null,
        purchase_order_id: purchase_order_id || null,
        notes: notes || null,
        batch_status: 'active',
        created_at: receivedDate.toISOString(),
        updated_at: receivedDate.toISOString(),
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Update item current_stock
    const newStock = item.current_stock + quantity_received;
    await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id);

    // Create stock movement record
    const movementId = uuidv4();
    await supabase
      .from('inventory_stock_movements')
      .insert({
        id: movementId,
        inventory_item_id: item_id,
        batch_id: batchId,
        movement_type: 'in',
        quantity_change: quantity_received,
        unit_price: unit_cost,
        reference_type: purchase_order_id ? 'purchase_order' : 'receipt',
        reference_id: purchase_order_id || null,
        notes: `Received ${quantity_received} units at $${unit_cost.toFixed(2)} per unit (Batch: ${finalBatchNumber})`,
        recorded_by: req.user?.id,
        recorded_at: new Date().toISOString()
      });

    // Create detailed movement record
    await supabase
      .from('inventory_movements_details')
      .insert({
        id: uuidv4(),
        stock_movement_id: movementId,
        batch_id: batchId,
        quantity_from_batch: quantity_received,
        unit_cost_batch: unit_cost,
        line_total: quantity_received * unit_cost,
        movement_order: 0,
        recorded_at: new Date().toISOString()
      });

    // Update valuations
    await updateInventoryValuation(item_id);

    await activityService.logActivity(
      req.user?.id,
      'CREATE',
      'Batch',
      batchId,
      `Received ${quantity_received} units of ${item.name} (Batch: ${finalBatchNumber})`
    );

    res.status(201).json({
      success: true,
      batch,
      item_name: item.name,
      new_stock,
      valuation_method: item.valuation_method || 'FIFO'
    });
  } catch (error) {
    console.error('Error receiving stock:', error);
    res.status(500).json({ error: 'Failed to receive stock' });
  }
});

// Get all batches for an item
router.get('/batches/:itemId', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, sku, category, unit, valuation_method)
      `)
      .eq('inventory_item_id', itemId);

    if (status) {
      query = query.eq('batch_status', status);
    }

    const { data: batches, error } = await query.order('received_date', { ascending: true });

    if (error) throw error;

    res.json({ success: true, batches: batches || [] });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Update batch information
router.put('/batches/:batchId', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const { batchId } = req.params;
    const {
      quantity_received,
      unit_cost,
      expiration_date,
      notes,
      batch_status
    } = req.body;

    const { data: batch, error } = await supabase
      .from('inventory_batches')
      .update({
        quantity_received: quantity_received || undefined,
        unit_cost: unit_cost || undefined,
        expiration_date: expiration_date || undefined,
        notes: notes || undefined,
        batch_status: batch_status || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error || !batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    await activityService.logActivity(
      req.user?.id,
      'UPDATE',
      'Batch',
      batchId,
      `Updated batch ${batch.batch_number}`
    );

    res.json({ success: true, batch });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// ============================================================================
// STOCK USAGE (STOCK OUT) - LIFO/FIFO SELECTION
// ============================================================================

// Use stock - LIFO/FIFO calculation with batch selection
router.post('/use', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const {
      item_id,
      quantity,
      valuation_method = 'FIFO', // FIFO or LIFO or AVERAGE
      reference_type,
      reference_id,
      notes
    } = req.body;

    if (!item_id || !quantity || !valuation_method) {
      return res.status(400).json({ error: 'Item ID, quantity, and valuation method are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (!['FIFO', 'LIFO', 'AVERAGE'].includes(valuation_method)) {
      return res.status(400).json({ error: 'Valuation method must be FIFO, LIFO, or AVERAGE' });
    }

    // Get item info
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock, name, valuation_method')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.current_stock < quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${item.current_stock}, Requested: ${quantity}`
      });
    }

    // Get active batches
    const { data: batches, error: batchError } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('inventory_item_id', item_id)
      .eq('batch_status', 'active')
      .gt('quantity_available', 0);

    if (batchError || !batches || batches.length === 0) {
      return res.status(400).json({ error: 'No active batches available' });
    }

    let usage: any[] = [];
    let totalCost = 0;

    // Calculate usage based on valuation method
    if (valuation_method === 'FIFO') {
      usage = calculateFIFOUsage(batches, quantity);
    } else if (valuation_method === 'LIFO') {
      usage = calculateLIFOUsage(batches, quantity);
    } else if (valuation_method === 'AVERAGE') {
      // For average cost, take from oldest first but use average cost
      usage = calculateFIFOUsage(batches, quantity);
      const avgCost = calculateWeightedAverageCost(batches);
      totalCost = quantity * avgCost;
    }

    // Calculate total cost
    totalCost = usage.reduce((sum, item) => sum + item.total_cost, 0);

    // Create stock movement record
    const movementId = uuidv4();
    const { data: movement, error: movementError } = await supabase
      .from('inventory_stock_movements')
      .insert({
        id: movementId,
        inventory_item_id: item_id,
        batch_id: null, // Will be set in details table
        movement_type: 'out',
        quantity_change: -quantity,
        unit_price: totalCost / quantity,
        reference_type: reference_type || 'manual',
        reference_id: reference_id || null,
        valuation_method_used: valuation_method,
        notes: notes || `Used ${quantity} units of ${item.name} using ${valuation_method}`,
        recorded_by: req.user?.id,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (movementError) throw movementError;

    // Create detailed movement records for each batch
    const movementDetails = [];
    for (const item of usage) {
      const detailId = uuidv4();

      movementDetails.push({
        id: detailId,
        stock_movement_id: movementId,
        batch_id: item.batch_id,
        quantity_from_batch: item.quantity_used,
        unit_cost_batch: item.unit_cost,
        line_total: item.total_cost,
        movement_order: 0,
        recorded_at: new Date().toISOString()
      });

      // Update batch quantities
      await supabase
        .from('inventory_batches')
        .update({
          quantity_available: {
            decrement: item.quantity_used
          },
          quantity_used: {
            increment: item.quantity_used
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', item.batch_id);
    }

    await supabase
      .from('inventory_movements_details')
      .insert(movementDetails);

    // Update item current_stock
    const newStock = item.current_stock - quantity;
    await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id);

    // Check if any batches are now depleted
    for (const item of usage) {
      const { data: batchStatus } = await supabase
        .from('inventory_batches')
        .select('quantity_available')
        .eq('id', item.batch_id)
        .single();

      if (batchStatus && batchStatus.quantity_available <= 0) {
        await supabase
          .from('inventory_batches')
          .update({
            batch_status: 'depleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.batch_id);
      }
    }

    // Update valuations
    await updateInventoryValuation(item_id);

    await activityService.logActivity(
      req.user?.id,
      'USE',
      'Stock',
      movementId,
      `Used ${quantity} units of ${item.name} (${valuation_method}, total cost: $${totalCost.toFixed(2)})`
    );

    res.status(201).json({
      success: true,
      movement,
      usage_details: usage,
      total_cost,
      average_cost_per_unit: totalCost / quantity,
      new_stock,
      item_name: item.name
    });
  } catch (error) {
    console.error('Error using stock:', error);
    res.status(500).json({ error: 'Failed to use stock' });
  }
});

// Manual stock adjustment
router.post('/adjust', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const {
      item_id,
      quantity_change,
      reason,
      notes
    } = req.body;

    if (!item_id || quantity_change === undefined || !reason) {
      return res.status(400).json({ error: 'Item ID, quantity change, and reason are required' });
    }

    // Get current item
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock, name')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newStock = item.current_stock + quantity_change;

    if (newStock < 0) {
      return res.status(400).json({
        error: `Cannot adjust below 0. Current: ${item.current_stock}, Change: ${quantity_change}, Result: ${newStock}`
      });
    }

    // Update item stock
    await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id);

    // Create adjustment record
    const adjustmentId = uuidv4();
    await supabase
      .from('inventory_stock_movements')
      .insert({
        id: adjustmentId,
        inventory_item_id: item_id,
        batch_id: null,
        movement_type: 'adjustment',
        quantity_change,
        unit_price: 0,
        reference_type: 'adjustment',
        reference_id: null,
        notes: `Adjustment: ${reason}. ${notes || ''}`,
        recorded_by: req.user?.id,
        recorded_at: new Date().toISOString()
      });

    await activityService.logActivity(
      req.user?.id,
      'ADJUST',
      'Stock',
      adjustmentId,
      `Adjusted ${item.name} stock by ${quantity_change} units. Reason: ${reason}`
    );

    res.json({
      success: true,
      previous_stock: item.current_stock,
      new_stock,
      adjustment: quantity_change,
      reason
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Write off expired/damaged stock
router.post('/write-off', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const {
      batch_id,
      quantity,
      reason,
      notes
    } = req.body;

    if (!batch_id || !quantity || !reason) {
      return res.status(400).json({ error: 'Batch ID, quantity, and reason are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, current_stock)
      `)
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    if (batch.quantity_available < quantity) {
      return res.status(400).json({
        error: `Insufficient quantity in batch. Available: ${batch.quantity_available}, Requested: ${quantity}`
      });
    }

    // Update batch quantities
    await supabase
      .from('inventory_batches')
      .update({
        quantity_available: {
          decrement: quantity
        },
        quantity_used: {
          increment: quantity
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', batch_id);

    // Check if batch is now depleted
    const { data: updatedBatch } = await supabase
      .from('inventory_batches')
      .select('quantity_available')
      .eq('id', batch_id)
      .single();

    if (updatedBatch && updatedBatch.quantity_available <= 0) {
      await supabase
        .from('inventory_batches')
        .update({
          batch_status: 'depleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', batch_id);
    }

    // Update item stock
    const newStock = batch.inventory_items.current_stock - quantity;
    await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', batch.inventory_items.id);

    // Create write-off record
    const writeOffId = uuidv4();
    await supabase
      .from('inventory_stock_movements')
      .insert({
        id: writeOffId,
        inventory_item_id: batch.inventory_items.id,
        batch_id: batch_id,
        movement_type: 'out',
        quantity_change: -quantity,
        unit_price: batch.unit_cost,
        reference_type: 'write-off',
        reference_id: null,
        notes: `Write-off: ${reason}. ${notes || ''}`,
        recorded_by: req.user?.id,
        recorded_at: new Date().toISOString()
      });

    await activityService.logActivity(
      req.user?.id,
      'WRITE_OFF',
      'Batch',
      batchId,
      `Wrote off ${quantity} units from batch ${batch.batch_number} (${batch.inventory_items.name}). Reason: ${reason}`
    );

    res.json({
      success: true,
      batch,
      quantity_written_off: quantity,
      write_off_cost: quantity * batch.unit_cost,
      new_stock
    });
  } catch (error) {
    console.error('Error writing off stock:', error);
    res.status(500).json({ error: 'Failed to write off stock' });
  }
});

// ============================================================================
// MOVEMENT HISTORY & AUDIT TRAIL
// ============================================================================

// Get all movements with details
router.get('/movements', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const {
      item_id,
      movement_type,
      start_date,
      end_date,
      limit = 100
    } = req.query;

    let query = supabase
      .from('inventory_stock_movements')
      .select(`
        *,
        inventory_items(name, sku, category, unit),
        inventory_batches(batch_number, unit_cost, expiration_date)
      `)
      .order('recorded_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (item_id) query = query.eq('inventory_item_id', item_id);
    if (movement_type) query = query.eq('movement_type', movement_type);
    if (start_date) query = query.gte('recorded_at', start_date as string);
    if (end_date) query = query.lte('recorded_at', end_date as string);

    const { data: movements, error } = await query;

    if (error) throw error;

    res.json({ success: true, movements: movements || [] });
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});

// Get detailed movement information with batch breakdown
router.get('/movements/:id', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get movement
    const { data: movement, error: movementError } = await supabase
      .from('inventory_stock_movements')
      .select(`
        *,
        inventory_items(name, sku, category, unit)
      `)
      .eq('id', id)
      .single();

    if (movementError || !movement) {
      return res.status(404).json({ error: 'Movement not found' });
    }

    // Get detailed batch movements
    const { data: details, error: detailsError } = await supabase
      .from('inventory_movements_details')
      .select(`
        *,
        inventory_batches(batch_number, unit_cost, expiration_date, received_date)
      `)
      .eq('stock_movement_id', id)
      .order('recorded_at', { ascending: true });

    if (detailsError) throw detailsError;

    res.json({
      success: true,
      movement,
      details: details || []
    });
  } catch (error) {
    console.error('Error fetching movement details:', error);
    res.status(500).json({ error: 'Failed to fetch movement details' });
  }
});

// ============================================================================
// BATCH MANAGEMENT
// ============================================================================

// Get all active batches with filtering
router.get('/batches', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const {
      status,
      expiring_days,
      item_category,
      item_id
    } = req.query;

    let query = supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, sku, category, unit, current_stock, valuation_method),
        suppliers(name as supplier_name)
      `)
      .order('received_date', { ascending: true });

    if (status) {
      query = query.eq('batch_status', status);
    }

    if (item_id) {
      query = query.eq('inventory_item_id', item_id);
    }

    const { data: batches, error } = await query;

    if (error) throw error;

    let filteredBatches = batches || [];

    // Filter by expiring days
    if (expiring_days) {
      const thresholdDays = parseInt(expiring_days as string);
      filteredBatches = filteredBatches.filter(batch => {
        if (!batch.expiration_date) return false;
        const today = new Date();
        const expirationDate = new Date(batch.expiration_date);
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= thresholdDays;
      });
    }

    // Filter by category
    if (item_category) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.inventory_items.category === item_category
      );
    }

    res.json({ success: true, batches: filteredBatches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get batch history and usage details
router.get('/batches/:batchId/history', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { batchId } = req.params;

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, sku, category, unit)
      `)
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get movement details for this batch
    const { data: details, error: detailsError } = await supabase
      .from('inventory_movements_details')
      .select(`
        *,
        inventory_stock_movements(movement_type, recorded_at, recorded_by),
        users(first_name, last_name)
      `)
      .eq('batch_id', batchId)
      .order('recorded_at', { ascending: false });

    if (detailsError) throw detailsError;

    res.json({
      success: true,
      batch,
      usage_history: details || []
    });
  } catch (error) {
    console.error('Error fetching batch history:', error);
    res.status(500).json({ error: 'Failed to fetch batch history' });
  }
});

// Mark batch as expired
router.post('/batches/:batchId/mark-expired', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const { batchId } = req.params;
    const { action_taken, notes } = req.body;

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Update batch status
    await supabase
      .from('inventory_batches')
      .update({
        batch_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

    // Remove expired quantity from available stock
    await supabase
      .from('inventory_items')
      .update({
        current_stock: {
          decrement: batch.quantity_available
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', batch.inventory_item_id);

    // Create alert
    await supabase
      .from('inventory_expiration_alerts')
      .insert({
        id: uuidv4(),
        batch_id: batchId,
        alert_type: 'expired',
        expiration_date: batch.expiration_date,
        days_until_expiry: 0,
        quantity_affected: batch.quantity_available,
        alert_status: 'resolved',
        action_taken: action_taken || 'Marked expired and removed from stock',
        resolved_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    await activityService.logActivity(
      req.user?.id,
      'EXPIRE',
      'Batch',
      batchId,
      `Marked batch ${batch.batch_number} as expired. ${batch.quantity_available} units removed. Action: ${action_taken || 'None'}`
    );

    res.json({
      success: true,
      message: 'Batch marked as expired and removed from available stock',
      quantity_removed: batch.quantity_available
    });
  } catch (error) {
    console.error('Error marking batch as expired:', error);
    res.status(500).json({ error: 'Failed to mark batch as expired' });
  }
});

// ============================================================================
// EXPIRATION MANAGEMENT
// ============================================================================

// Get items expiring soon
router.get('/expiring-soon', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { days_threshold = 7 } = req.query;
    const threshold = parseInt(days_threshold as string);

    // Get all active batches with expiration dates
    const { data: batches, error } = await supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, sku, category, unit, current_stock)
      `)
      .eq('batch_status', 'active')
      .not('expiration_date', 'is', null)
      .gt('quantity_available', 0);

    if (error) throw error;

    const today = new Date();
    const expiringItems = [];

    for (const batch of batches || []) {
      const expirationDate = new Date(batch.expiration_date);
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= threshold && daysUntilExpiry > 0) {
        expiringItems.push({
          ...batch,
          days_until_expiry: daysUntilExpiry
        });
      }
    }

    // Sort by days until expiry (earliest first)
    expiringItems.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    res.json({ success: true, expiring_items: expiringItems });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// Get expired items
router.get('/expired', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: expiredBatches, error } = await supabase
      .from('inventory_batches')
      .select(`
        *,
        inventory_items(name, sku, category, unit)
      `)
      .lt('expiration_date', today);

    if (error) throw error;

    res.json({ success: true, expired_items: expiredBatches || [] });
  } catch (error) {
    console.error('Error fetching expired items:', error);
    res.status(500).json({ error: 'Failed to fetch expired items' });
  }
});

// Create expiration alert
router.post('/expiration-alerts', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const {
      batch_id,
      alert_type,
      expiration_date,
      days_until_expiry,
      quantity_affected,
      notes
    } = req.body;

    if (!batch_id || !alert_type || !expiration_date) {
      return res.status(400).json({ error: 'Batch ID, alert type, and expiration date are required' });
    }

    const alertId = uuidv4();
    const { data: alert, error } = await supabase
      .from('inventory_expiration_alerts')
      .insert({
        id: alertId,
        batch_id,
        alert_type,
        expiration_date,
        days_until_expiry: parseInt(days_until_expiry),
        quantity_affected: parseFloat(quantity_affected),
        alert_status: 'active',
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, alert });
  } catch (error) {
    console.error('Error creating expiration alert:', error);
    res.status(500).json({ error: 'Failed to create expiration alert' });
  }
});

// Get expiration alerts
router.get('/expiration-alerts', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('inventory_expiration_alerts')
      .select(`
        *,
        inventory_batches(batch_number, quantity_available),
        inventory_items(name, sku, category)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('alert_status', status);
    }

    const { data: alerts, error } = await query;

    if (error) throw error;

    res.json({ success: true, alerts: alerts || [] });
  } catch (error) {
    console.error('Error fetching expiration alerts:', error);
    res.status(500).json({ error: 'Failed to fetch expiration alerts' });
  }
});

// ============================================================================
// VALUATION & REPORTING - LIFO/FIFO IMPACT
// ============================================================================

// Get inventory valuation with comparison
router.get('/valuation', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { method = 'FIFO' } = req.query;

    // Get all items with active batches
    const { data: items, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, name, sku, category, unit, current_stock, minimum_threshold, reorder_quantity, valuation_method')
      .eq('is_active', true);

    if (itemError) throw itemError;

    let totalValuation = 0;
    let totalValuationLIFO = 0;
    let itemValuations = [];

    for (const item of items || []) {
      // Get active batches for this item
      const { data: batches, error: batchError } = await supabase
        .from('inventory_batches')
        .select('*')
        .eq('inventory_item_id', item.id)
        .eq('batch_status', 'active')
        .gt('quantity_available', 0);

      if (batchError || !batches || batches.length === 0) {
        itemValuations.push({
          item_id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          unit: item.unit,
          current_stock: item.current_stock,
          valuation: 0,
          lifo_valuation: 0,
          batches_used: []
        });
        continue;
      }

      let itemValuation = 0;
      let itemLifoValuation = 0;
      let batchesUsed = [];

      // FIFO calculation
      const fifoUsage = calculateFIFOUsage(batches, item.current_stock);
      itemValuation = fifoUsage.reduce((sum, u) => sum + u.total_cost, 0);
      batchesUsed = fifoUsage;

      // LIFO calculation for comparison
      const lifoUsage = calculateLIFOUsage(batches, item.current_stock);
      itemLifoValuation = lifoUsage.reduce((sum, u) => sum + u.total_cost, 0);

      totalValuation += itemValuation;
      totalValuationLIFO += itemLifoValuation;

      const valuationDifference = Math.abs(itemValuation - itemLifoValuation);
      const percentageDifference = itemValuation > 0 ? (valuationDifference / itemValuation) * 100 : 0;

      itemValuations.push({
        item_id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        unit: item.unit,
        current_stock: item.current_stock,
        valuation: itemValuation,
        lifo_valuation: itemLifoValuation,
        valuation_difference: valuationDifference,
        percentage_difference: percentageDifference,
        batches_used: batchesUsed,
        method_used: item.valuation_method || 'FIFO',
        minimum_threshold: item.minimum_threshold,
        reorder_quantity: item.reorder_quantity
      });
    }

    const totalValuationDifference = totalValuationLIFO - totalValuation;
    const totalPercentageDifference = totalValuation > 0 ? (totalValuationDifference / totalValuation) * 100 : 0;

    res.json({
      success: true,
      total_valuation_fifo: totalValuation,
      total_valuation_lifo: totalValuationLIFO,
      valuation_difference: totalValuationDifference,
      percentage_difference: totalPercentageDifference,
      method,
      item_valuations: itemValuations,
      total_items: items?.length || 0
    });
  } catch (error) {
    console.error('Error calculating valuation:', error);
    res.status(500).json({ error: 'Failed to calculate valuation' });
  }
});

// Get valuation history
router.get('/valuation-history', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date, item_id } = req.query;

    let query = supabase
      .from('inventory_valuations')
      .select('*')
      .order('valuation_date', { ascending: false });

    if (start_date) query = query.gte('valuation_date', start_date as string);
    if (end_date) query = query.lte('valuation_date', end_date as string);
    if (item_id) query = query.eq('inventory_item_id', item_id);

    const { data: valuations, error } = await query;

    if (error) throw error;

    res.json({ success: true, valuations: valuations || [] });
  } catch (error) {
    console.error('Error fetching valuation history:', error);
    res.status(500).json({ error: 'Failed to fetch valuation history' });
  }
});

// Recalculate valuations
router.post('/valuation/recalculate', requirePermission('inventory:admin'), async (req: AuthRequest, res) => {
  try {
    const { item_id } = req.body;

    if (item_id) {
      // Recalculate for specific item
      await updateInventoryValuation(item_id);
    } else {
      // Recalculate for all items
      const { data: items } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('is_active', true);

      for (const item of items || []) {
        await updateInventoryValuation(item.id);
      }
    }

    res.json({
      success: true,
      message: item_id ? 'Valuation recalculated for specific item' : 'Valuations recalculated for all items'
    });
  } catch (error) {
    console.error('Error recalculating valuations:', error);
    res.status(500).json({ error: 'Failed to recalculate valuations' });
  }
});

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

// Get dashboard metrics
router.get('/dashboard-metrics', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    // Get total inventory value (FIFO)
    const today = new Date().toISOString().split('T')[0];
    const { data: valuationResult, error: valuationError } = await supabase
      .from('inventory_valuations')
      .select('valuation_amount')
      .eq('valuation_date', today);

    const totalValue = valuationResult?.[0]?.valuation_amount || 0;

    // Get item counts
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('current_stock, minimum_threshold, valuation_method');

    let totalStock = 0;
    let lowStockCount = 0;
    let fifoCount = 0;
    let lifoCount = 0;

    for (const item of items || []) {
      totalStock += item.current_stock || 0;
      if (item.current_stock <= (item.minimum_threshold || 0)) {
        lowStockCount++;
      }
      if (item.valuation_method === 'FIFO') fifoCount++;
      if (item.valuation_method === 'LIFO') lifoCount++;
    }

    // Get movements today
    const { data: movements, error: movementsError } = await supabase
      .from('inventory_stock_movements')
      .select('movement_type, quantity_change')
      .gte('recorded_at', today);

    let inMovements = 0;
    let outMovements = 0;

    for (const movement of movements || []) {
      if (movement.movement_type === 'in') {
        inMovements += movement.quantity_change;
      } else if (movement.movement_type === 'out') {
        outMovements += Math.abs(movement.quantity_change);
      }
    }

    // Get expiring soon count
    const { data: expiringSoon, error: expiringError } = await supabase
      .from('inventory_expiration_alerts')
      .select('id')
      .eq('alert_status', 'active')
      .eq('alert_type', 'expiring_soon');

    // Get expired count
    const { data: expired, error: expiredError } = await supabase
      .from('inventory_expiration_alerts')
      .select('id')
      .eq('alert_status', 'active')
      .eq('alert_type', 'expired');

    // Get batch counts
    const { data: batches, error: batchesError } = await supabase
      .from('inventory_batches')
      .select('batch_status');

    let activeBatches = 0;
    let depletedBatches = 0;
    let expiredBatches = 0;

    for (const batch of batches || []) {
      if (batch.batch_status === 'active') activeBatches++;
      else if (batch.batch_status === 'depleted') depletedBatches++;
      else if (batch.status === 'expired') expiredBatches++;
    }

    res.json({
      success: true,
      metrics: {
        total_value: totalValue,
        total_stock,
        low_stock_count: lowStockCount,
        movements_in_today: inMovements,
        movements_out_today: outMovements,
        expiring_soon_count: expiringSoon?.length || 0,
        expired_count: expired?.length || 0,
        total_items: items?.length || 0,
        valuation_methods: {
          fifo: fifoCount,
          lifo: lifoCount,
          average: (items?.length || 0) - fifoCount - lifoCount
        },
        batch_status: {
          active: activeBatches,
          depleted: depletedBatches,
          expired: expiredBatches
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// ============================================================================
// BASIC INVENTORY ITEMS (Enhanced for compatibility)
// ============================================================================

// Get all inventory items (enhanced)
router.get('/items', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { category, search, active_only = true } = req.query;

    let query = supabase
      .from('inventory_items')
      .select('*');

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    if (active_only) query = query.eq('is_active', true);

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    // Enhance with batch info for each item
    const itemsWithBatches = [];
    for (const item of data || []) {
      // Get batch count and oldest/newest dates
      const { data: batches } = await supabase
        .from('inventory_batches')
        .select('quantity_available, received_date, expiration_date')
        .eq('inventory_item_id', item.id)
        .eq('batch_status', 'active');

      const totalBatchStock = batches?.reduce((sum, b) => sum + b.quantity_available, 0) || 0;
      const oldestDate = batches?.length > 0 ?
        batches.reduce((oldest, b) => b.received_date < oldest ? b.received_date : oldest, '').received_date : null;
      const newestDate = batches?.length > 0 ?
        batches.reduce((newest, b) => b.received_date > newest ? b.received_date : newest, '').received_date : null;

      itemsWithBatches.push({
        ...item,
        batch_count: batches?.length || 0,
        batch_stock: totalBatchStock,
        oldest_batch_date: oldestDate,
        newest_batch_date: newestDate,
        stock_discrepancy: totalBatchStock - item.current_stock
      });
    }

    res.json(itemsWithBatches);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get low stock items
router.get('/low-stock', requirePermission('inventory:read'), async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_batches(
          SELECT COUNT(*) as batch_count,
          SUM(quantity_available) as batch_stock
          FROM inventory_batches
          WHERE inventory_item_id = inventory_items.id
          AND batch_status = 'active'
          GROUP BY inventory_item_id
        )
      `)
      .eq('is_active', true)
      .lt('current_stock', supabase.rpc('minimum_threshold'));

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Update inventory item to set valuation method
router.put('/items/:id/valuation-method', requirePermission('inventory:edit'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { valuation_method } = req.body;

    if (!['FIFO', 'LIFO', 'AVERAGE'].includes(valuation_method)) {
      return res.status(400).json({ error: 'Valuation method must be FIFO, LIFO, or AVERAGE' });
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        valuation_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Recalculate valuation for this item
    await updateInventoryValuation(id);

    await activityService.logActivity(
      req.user?.id,
      'UPDATE',
      'Item',
      id,
      `Updated valuation method to ${valuation_method} for ${data.name}`
    );

    res.json({ success: true, item: data });
  } catch (error) {
    console.error('Error updating valuation method:', error);
    res.status(500).json({ error: 'Failed to update valuation method' });
  }
});

// Update inventory valuations (helper function)
async function updateInventoryValuation(itemId: string) {
  try {
    // Get current batches
    const { data: batches } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('inventory_item_id', itemId)
      .eq('batch_status', 'active')
      .gt('quantity_available', 0);

    if (!batches || batches.length === 0) return;

    // Calculate valuations
    const fifoValuation = calculateFIFOUsage(batches, batches.reduce((sum, b) => sum + b.quantity_available, 0))
      .reduce((sum, u) => sum + u.total_cost, 0);

    const lifoValuation = calculateLIFOUsage(batches, batches.reduce((sum, b) => sum + b.quantity_available, 0))
      .reduce((sum, u) => sum + u.total_cost, 0);

    const avgCost = calculateWeightedAverageCost(batches);
    const avgValuation = batches.reduce((sum, b) => sum + b.quantity_available, 0) * avgCost;

    // Store valuations
    await supabase
      .from('inventory_valuations')
      .upsert({
        inventory_item_id: itemId,
        valuation_date: new Date().toISOString().split('T')[0],
        method_used: 'current',
        total_units: batches.reduce((sum, b) => sum + b.quantity_available, 0),
        valuation_amount: fifoValuation,
        weighted_average_cost: avgCost,
        fifo_valuation: fifoValuation,
        lifo_valuation: lifoValuation,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error updating inventory valuation:', error);
  }
}

export default router;