import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/overview - Sales total, inventory status, active staff
router.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Today's sales
    const { data: todaysSales } = await supabase
      .from('bar_sales')
      .select('total_price')
      .gte('sale_timestamp', `${today}T00:00:00`)
      .lt('sale_timestamp', `${today}T23:59:59`);

    // Yesterday's sales
    const { data: yesterdaysSales } = await supabase
      .from('bar_sales')
      .select('total_price')
      .gte('sale_timestamp', `${yesterday}T00:00:00`)
      .lt('sale_timestamp', `${yesterday}T23:59:59`);

    const totalToday = todaysSales?.reduce((sum, sale) => sum + sale.total_price, 0) || 0;
    const totalYesterday = yesterdaysSales?.reduce((sum, sale) => sum + sale.total_price, 0) || 0;

    // Low stock items
    const { data: lowStockItems } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .lt('current_stock', supabase.rpc('minimum_threshold'));

    // Active staff (those who clocked in today)
    const { data: activeStaff, count: activeStaffCount } = await supabase
      .from('staff_attendance')
      .select('*', { count: 'exact' })
      .eq('scheduled_date', today)
      .not('clock_in_time', 'is', null);

    const salesChangePercentage = totalYesterday > 0
      ? ((totalToday - totalYesterday) / totalYesterday) * 100
      : 0;

    res.json({
      total_sales_today: totalToday,
      total_sales_yesterday: totalYesterday,
      sales_change_percentage: parseFloat(salesChangePercentage.toFixed(2)),
      active_staff_count: activeStaffCount || 0,
      low_stock_items_count: lowStockItems?.length || 0,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/alerts - Low stock, pending orders, urgent tasks
router.get('/alerts', async (req: AuthRequest, res, next) => {
  try {
    const alerts: any[] = [];

    // Low stock alerts
    const { data: lowStockItems } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .lt('current_stock', supabase.rpc('minimum_threshold'));

    lowStockItems?.forEach((item) => {
      alerts.push({
        id: `low-stock-${item.id}`,
        type: 'low_stock',
        title: 'Low Stock Warning',
        message: `${item.name} is below minimum threshold (Current: ${item.current_stock}, Min: ${item.minimum_threshold})`,
        severity: 'high',
        reference_id: item.id,
      });
    });

    // Pending kitchen orders
    const { data: pendingOrders } = await supabase
      .from('kitchen_orders')
      .select('*')
      .in('status', ['queued', 'in_progress'])
      .order('priority', { ascending: false });

    pendingOrders?.forEach((order) => {
      alerts.push({
        id: `pending-order-${order.id}`,
        type: 'pending_order',
        title: 'Kitchen Order Pending',
        message: `Order ${order.order_number} (${order.priority} priority)`,
        severity: order.priority === 'urgent' ? 'high' : 'medium',
        reference_id: order.id,
      });
    });

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/metrics?period=today|week|month
router.get('/metrics', async (req: AuthRequest, res, next) => {
  try {
    const { period = 'today' } = req.query;
    let startDate: string;
    const endDate = new Date().toISOString();

    if (period === 'today') {
      startDate = new Date().toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      startDate = monthAgo.toISOString().split('T')[0];
    } else {
      startDate = new Date().toISOString().split('T')[0];
    }

    // Sales data
    const { data: sales } = await supabase
      .from('bar_sales')
      .select('*')
      .gte('sale_timestamp', startDate)
      .lte('sale_timestamp', endDate);

    const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_price, 0) || 0;
    const avgTransactionValue = sales && sales.length > 0 ? totalRevenue / sales.length : 0;

    // Inventory status
    const { data: items } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true);

    const inStock = items?.filter((i) => i.current_stock > i.minimum_threshold).length || 0;
    const lowStock = items?.filter((i) => i.current_stock <= i.minimum_threshold && i.current_stock > 0).length || 0;
    const outOfStock = items?.filter((i) => i.current_stock === 0).length || 0;

    // Active staff
    const today = new Date().toISOString().split('T')[0];
    const { count: activeStaff } = await supabase
      .from('staff_attendance')
      .select('*', { count: 'exact' })
      .eq('scheduled_date', today)
      .not('clock_in_time', 'is', null);

    res.json({
      period,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_transactions: sales?.length || 0,
      average_transaction_value: parseFloat(avgTransactionValue.toFixed(2)),
      inventory_status: {
        in_stock: inStock,
        low_stock: lowStock,
        out_of_stock: outOfStock,
      },
      active_staff: activeStaff || 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
