import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PurchaseOrderSchema } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to generate order number
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PO-${date}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

// GET /api/purchase-orders - List all POs
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase.from('purchase_orders').select('*, suppliers(name)');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/purchase-orders/:id - PO details + items
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .eq('id', id)
      .single();

    if (poError) throw poError;

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('*, inventory_items(name, unit)')
      .eq('purchase_order_id', id);

    if (itemsError) throw itemsError;

    res.json({
      ...po,
      items,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/purchase-orders - Create new PO (manager only)
router.post('/', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = PurchaseOrderSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create purchase order
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert([
        {
          order_number: generateOrderNumber(),
          supplier_id: input.supplier_id,
          status: 'pending',
          expected_delivery_date: input.expected_delivery_date,
          notes: input.notes || null,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (poError) throw poError;

    // Calculate total cost and create line items
    let totalCost = 0;
    const lineItems = input.items.map((item) => {
      const lineTotal = item.quantity_ordered * item.unit_price;
      totalCost += lineTotal;

      return {
        purchase_order_id: po.id,
        inventory_item_id: item.inventory_item_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_price: item.unit_price,
        line_total: lineTotal,
      };
    });

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(lineItems)
      .select();

    if (itemsError) throw itemsError;

    // Update PO total cost
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ total_cost: totalCost })
      .eq('id', po.id);

    if (updateError) throw updateError;

    res.status(201).json({
      ...po,
      total_cost: totalCost,
      items,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/purchase-orders/:id - Update PO (manager only)
router.put('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/purchase-orders/:id/receive - Mark items as received (manager only)
router.post('/:id/receive', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { item_id, quantity_received } = req.body;

    if (!item_id || quantity_received === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: item_id, quantity_received',
      });
    }

    // Update quantity received on line item
    const { data: lineItem, error: lineError } = await supabase
      .from('purchase_order_items')
      .update({ quantity_received })
      .eq('id', item_id)
      .select()
      .single();

    if (lineError) throw lineError;

    // Update inventory stock
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', lineItem.inventory_item_id)
      .single();

    if (itemError) throw itemError;

    const newStock = (item?.current_stock || 0) + quantity_received;

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: newStock,
        last_restocked_at: new Date().toISOString(),
      })
      .eq('id', lineItem.inventory_item_id);

    if (updateError) throw updateError;

    // Create transaction record
    const { error: txError } = await supabase
      .from('inventory_transactions')
      .insert([
        {
          inventory_item_id: lineItem.inventory_item_id,
          transaction_type: 'restock',
          quantity_change: quantity_received,
          reference_type: 'purchase_order',
          reference_id: id,
          recorded_by: req.user?.id,
        },
      ]);

    if (txError) throw txError;

    // Check if all items received - update PO status
    const { data: allItems } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', id);

    const allReceived = allItems?.every(
      (i) => i.quantity_received === i.quantity_ordered
    );
    const partiallyReceived = allItems?.some(
      (i) => i.quantity_received > 0 && i.quantity_received < i.quantity_ordered
    );

    const newStatus = allReceived ? 'received' : partiallyReceived ? 'partially_received' : 'pending';

    const { error: statusError } = await supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        actual_delivery_date: allReceived ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', id);

    if (statusError) throw statusError;

    res.json({ success: true, lineItem, newStock });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/purchase-orders/:id - Cancel PO (manager only)
router.delete('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
