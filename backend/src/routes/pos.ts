import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { activityService } from '../services/activityService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to generate order number
const generateOrderNumber = () => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${date}-${random}`;
};

// ============ POS LAYOUTS ============

// GET /api/pos/layouts - Get all POS layouts
router.get('/layouts', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('pos_layouts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/pos/layouts/default - Get default layout
router.get('/layouts/default', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('pos_layouts')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .single();
    if (error) throw error;
    res.json(data || {});
  } catch (error) {
    next(error);
  }
});

// POST /api/pos/layouts - Create POS layout (manager)
router.post('/layouts', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('pos_layouts')
      .insert([{ ...req.body, created_by: req.user.id }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/pos/layouts/:id - Update layout
router.put('/layouts/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('pos_layouts')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ POS CATEGORIES ============

// GET /api/pos/categories - Get all categories
router.get('/categories', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('pos_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ QUICK ACCESS ITEMS ============

// GET /api/pos/quick-access/:layoutId - Get quick access items for layout
router.get('/quick-access/:layoutId', async (req: AuthRequest, res, next) => {
  try {
    const { layoutId } = req.params;
    const { data, error } = await supabase
      .from('pos_quick_access_items')
      .select('*, bar_recipes(name, category), inventory_items(name)')
      .eq('pos_layout_id', layoutId)
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ ORDERS ============

// GET /api/pos/orders - List orders for current session
router.get('/orders', async (req: AuthRequest, res, next) => {
  try {
    const { status = 'pending', limit = 20 } = req.query;

    let query = supabase.from('orders').select('*');

    if (status && status !== 'all') {
      query = query.eq('order_status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/pos/orders/:id - Get order details with items
router.get('/orders/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, bar_recipes(name, category)')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    res.json({ ...order, items });
  } catch (error) {
    next(error);
  }
});

// POST /api/pos/orders - Create new order (waiter)
router.post('/orders', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      table_number,
      guest_number,
      order_type,
      items,
      special_notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.unit_price * item.quantity;
    });

    const tax_amount = subtotal * 0.1; // 10% tax
    const total_amount = subtotal + tax_amount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: generateOrderNumber(),
          table_number,
          guest_number,
          waiter_id: req.user.id,
          order_type: order_type || 'dine_in',
          subtotal,
          tax_amount,
          total_amount,
          special_notes,
          order_status: 'pending',
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      recipe_id: item.recipe_id || null,
      custom_item_name: item.custom_item_name || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.unit_price * item.quantity,
      item_notes: item.item_notes || null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    // Log order creation activity
    await activityService.logOrderActivity(
      order.id,
      req.user.id,
      'order_created',
      {
        table_number,
        item_count: items.length,
        total_amount: total_amount.toFixed(2),
        order_number: order.order_number,
      }
    );

    res.status(201).json({ ...order, items: createdItems });
  } catch (error) {
    next(error);
  }
});

// POST /api/pos/orders/:id/items - Add items to order
router.post('/orders/:id/items', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Must provide items' });
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    // Create new items
    const orderItems = items.map((item: any) => ({
      order_id: id,
      recipe_id: item.recipe_id || null,
      custom_item_name: item.custom_item_name || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.unit_price * item.quantity,
      item_notes: item.item_notes || null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    // Recalculate totals
    const { data: allItems } = await supabase
      .from('order_items')
      .select('line_total')
      .eq('order_id', id);

    const subtotal = allItems?.reduce((sum, item) => sum + item.line_total, 0) || 0;
    const tax_amount = subtotal * 0.1;
    const total_amount = subtotal + tax_amount;

    // Update order totals
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ subtotal, tax_amount, total_amount })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log item addition activity
    await activityService.logOrderActivity(
      id,
      req.user.id,
      'order_created',
      {
        action: 'items_added',
        item_count: createdItems.length,
      }
    );

    res.status(201).json({ ...updatedOrder, items: createdItems });
  } catch (error) {
    next(error);
  }
});

// PUT /api/pos/orders/:id - Update order (modify table, notes)
router.put('/orders/:id', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pos/orders/:id/items/:itemId - Remove item from order
router.delete('/orders/:id/items/:itemId', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id, itemId } = req.params;

    // Delete item
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;

    // Recalculate totals
    const { data: allItems } = await supabase
      .from('order_items')
      .select('line_total')
      .eq('order_id', id);

    const subtotal = allItems?.reduce((sum, item) => sum + item.line_total, 0) || 0;
    const tax_amount = subtotal * 0.1;
    const total_amount = subtotal + tax_amount;

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ subtotal, tax_amount, total_amount })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log item removal activity
    await activityService.logOrderActivity(
      id,
      req.user.id,
      'order_created',
      { action: 'item_removed' }
    );

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// POST /api/pos/orders/:id/confirm - Confirm order (send to kitchen)
router.post('/orders/:id/confirm', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({
        order_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log order confirmation activity
    await activityService.logOrderActivity(
      id,
      req.user.id,
      'order_confirmed',
      { action: 'confirmed_and_sent_to_kitchen' }
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
