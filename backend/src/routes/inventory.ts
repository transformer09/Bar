import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';
import { InventoryItemSchema, ManualAdjustmentSchema } from '../utils/validators';

const router = Router();

// GET /api/inventory/items - List all items
router.get('/items', async (req: AuthRequest, res, next) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/low-stock - Items below minimum threshold
router.get('/low-stock', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .lt('current_stock', supabase.rpc('minimum_threshold'));

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/items/:id - Single item details + transaction history
router.get('/items/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (itemError) throw itemError;

    const { data: transactions, error: txError } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('inventory_item_id', id)
      .order('recorded_at', { ascending: false });

    if (txError) throw txError;

    res.json({
      item,
      transactions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/items - Create new item (manager only)
router.post('/items', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = InventoryItemSchema.parse(req.body);

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([
        {
          ...input,
          supplier_id: input.supplier_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/inventory/items/:id - Update item details (manager only)
router.put('/items/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const input = InventoryItemSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('inventory_items')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/inventory/items/:id - Soft delete item (manager only)
router.delete('/items/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/transactions - Manual adjustment (manager, chef)
router.post('/transactions', requireRole('manager', 'chef'), async (req: AuthRequest, res, next) => {
  try {
    const input = ManualAdjustmentSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: transaction, error: txError } = await supabase
      .from('inventory_transactions')
      .insert([
        {
          inventory_item_id: input.inventory_item_id,
          transaction_type: input.quantity_change > 0 ? 'restock' : 'adjustment',
          quantity_change: input.quantity_change,
          reference_type: input.reference_type,
          notes: input.notes || null,
          recorded_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (txError) throw txError;

    // Update inventory current_stock
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', input.inventory_item_id)
      .single();

    if (itemError) throw itemError;

    const newStock = (item?.current_stock || 0) + input.quantity_change;

    if (newStock < 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        details: { current_stock: item?.current_stock, attempted_adjustment: input.quantity_change },
      });
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', input.inventory_item_id);

    if (updateError) throw updateError;

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/items/:id/transactions - Transaction history for item
router.get('/items/:id/transactions', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('inventory_item_id', id)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
