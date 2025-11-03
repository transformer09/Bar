import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { activityService } from '../services/activityService';
import { KitchenOrderSchema } from '../utils/validators';

const router = Router();

// Helper to generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `KO-${dateStr}-${random}`;
};

// GET /api/kitchen/orders - List orders (queue view)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, priority } = req.query;

    let query = supabase
      .from('kitchen_orders')
      .select('*, users(first_name, last_name)');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['queued', 'in_progress', 'ready']);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query.order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/kitchen/orders/:id - Order details + items
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('kitchen_orders')
      .select('*, users(first_name, last_name)')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('kitchen_order_items')
      .select('*, inventory_items(name, unit, current_stock)')
      .eq('kitchen_order_id', id);

    if (itemsError) throw itemsError;

    res.json({
      ...order,
      items,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/kitchen/orders - Create order (manual, waiter/bartender)
router.post('/', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = KitchenOrderSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: order, error: orderError } = await supabase
      .from('kitchen_orders')
      .insert([
        {
          order_number: generateOrderNumber(),
          status: 'queued',
          priority: input.priority,
          special_requests: input.special_requests || null,
          allergy_notes: input.allergy_notes || null,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const { data: items, error: itemsError } = await supabase
      .from('kitchen_order_items')
      .insert(
        input.items.map((item) => ({
          kitchen_order_id: order.id,
          inventory_item_id: item.inventory_item_id || null,
          custom_item_name: item.custom_item_name || null,
          quantity: item.quantity,
          unit: item.unit,
          preparation_notes: item.preparation_notes || null,
        }))
      )
      .select();

    if (itemsError) throw itemsError;

    // Log kitchen order creation activity
    await activityService.logActivity({
      user_id: req.user.id,
      activity_type: 'kitchen_order_created',
      description: `Kitchen order ${order.order_number} created with ${items?.length || 0} items`,
      timestamp: new Date().toISOString(),
      metadata: {
        order_id: order.id,
        item_count: items?.length || 0,
      },
    });

    res.status(201).json({
      ...order,
      items,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/kitchen/orders/:id/status - Update order status
router.put('/:id/status', requireRole('chef', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['queued', 'in_progress', 'ready', 'served', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates: any = { status, updated_at: new Date().toISOString() };

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'ready') {
      updates.completed_at = new Date().toISOString();
    } else if (status === 'served') {
      updates.served_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('kitchen_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log status change activity
    await activityService.logActivity({
      user_id: req.user?.id || 'system',
      activity_type: 'kitchen_order_status_changed',
      description: `Order status changed to ${status}`,
      timestamp: new Date().toISOString(),
      metadata: {
        order_id: id,
        new_status: status,
      },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/kitchen/orders/:id/assign - Assign order to chef
router.put('/:id/assign', requireRole('manager', 'chef'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { chef_id } = req.body;

    if (!chef_id) {
      return res.status(400).json({ error: 'Chef ID is required' });
    }

    // Verify chef role
    const { data: chef, error: chefError } = await supabase
      .from('users')
      .select('*')
      .eq('id', chef_id)
      .eq('role', 'chef')
      .single();

    if (chefError || !chef) {
      return res.status(400).json({ error: 'Invalid chef ID' });
    }

    const { data, error } = await supabase
      .from('kitchen_orders')
      .update({ assigned_to: chef_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log chef assignment activity
    await activityService.logActivity({
      user_id: req.user?.id || 'system',
      activity_type: 'order_assigned_to_chef',
      description: `Order assigned to chef ${chef.first_name || chef_id}`,
      timestamp: new Date().toISOString(),
      metadata: {
        order_id: id,
        chef_id: chef_id,
        chef_name: chef.first_name,
      },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/kitchen/orders/:id/ingredients - Required ingredients for order
router.get('/:id/ingredients', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: items, error: itemsError } = await supabase
      .from('kitchen_order_items')
      .select('*, inventory_items(name, unit, current_stock, category)')
      .eq('kitchen_order_id', id);

    if (itemsError) throw itemsError;

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// POST /api/kitchen/orders/:id/start - Mark order as in progress
router.post('/:id/start', requireRole('chef', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('kitchen_orders')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log order start activity
    await activityService.logActivity({
      user_id: req.user?.id || 'system',
      activity_type: 'kitchen_order_started',
      description: 'Order cooking started',
      timestamp: new Date().toISOString(),
      metadata: {
        order_id: id,
      },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/kitchen/orders/:id/complete - Mark order as ready and deduct inventory
router.post('/:id/complete', requireRole('chef', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('kitchen_order_items')
      .select('*')
      .eq('kitchen_order_id', id);

    if (itemsError) throw itemsError;

    // Deduct inventory for each item
    for (const item of items || []) {
      if (!item.inventory_item_id) continue;

      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', item.inventory_item_id)
        .single();

      if (!invItem || invItem.current_stock < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient inventory for order completion',
        });
      }

      const newStock = invItem.current_stock - item.quantity;

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', item.inventory_item_id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert([
          {
            inventory_item_id: item.inventory_item_id,
            transaction_type: 'usage',
            quantity_change: -item.quantity,
            reference_type: 'kitchen_order',
            reference_id: id,
            recorded_by: req.user.id,
          },
        ]);

      if (txError) throw txError;
    }

    // Update order status
    const { data, error } = await supabase
      .from('kitchen_orders')
      .update({
        status: 'ready',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log order completion activity
    await activityService.logActivity({
      user_id: req.user.id,
      activity_type: 'kitchen_order_completed',
      description: `Order completed and ready for serving. ${items?.length || 0} items prepared`,
      timestamp: new Date().toISOString(),
      metadata: {
        order_id: id,
        items_prepared: items?.length || 0,
      },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
