import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/reports/sales - Sales reports
router.get('/sales', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { period = 'day', category } = req.query;
    let startDate: string;
    const endDate = new Date().toISOString();

    if (period === 'day') {
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

    const { data: sales, error } = await supabase
      .from('bar_sales')
      .select('*, bar_recipes(name, category)')
      .gte('sale_timestamp', startDate)
      .lte('sale_timestamp', endDate);

    if (error) throw error;

    const totalSales = sales?.reduce((sum, s) => sum + s.total_price, 0) || 0;

    res.json({
      period,
      total_sales: parseFloat(totalSales.toFixed(2)),
      transaction_count: sales?.length || 0,
      average_transaction_value: sales && sales.length > 0 ? parseFloat((totalSales / sales.length).toFixed(2)) : 0,
      data: sales || [],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/inventory-usage - Inventory usage by item
router.get('/inventory-usage', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { period = 'month' } = req.query;
    let startDate: string;
    const endDate = new Date().toISOString();

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      startDate = monthAgo.toISOString().split('T')[0];
    } else {
      startDate = new Date().toISOString().split('T')[0];
    }

    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('*, inventory_items(name, unit)')
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .in('transaction_type', ['sale', 'usage', 'waste']);

    res.json({
      period,
      usage_data: transactions || [],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/staff-performance - Staff metrics
router.get('/staff-performance', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { period = 'month' } = req.query;
    let startDate: string;
    const endDate = new Date().toISOString();

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      startDate = monthAgo.toISOString().split('T')[0];
    } else {
      startDate = new Date().toISOString().split('T')[0];
    }

    // Get all staff
    const { data: staff } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    // Get attendance data
    const { data: attendance } = await supabase
      .from('staff_attendance')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate);

    // Get bartender sales
    const { data: sales } = await supabase
      .from('bar_sales')
      .select('*')
      .gte('sale_timestamp', startDate)
      .lte('sale_timestamp', endDate);

    // Get tips
    const { data: tips } = await supabase
      .from('tips')
      .select('*')
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate);

    const staffPerformance = staff?.map((s) => {
      const staffAttendance = attendance?.filter((a) => a.user_id === s.id) || [];
      const hoursWorked = staffAttendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
      const presentDays = staffAttendance.filter((a) => a.status === 'present').length;

      const staffSales = sales?.filter((sa) => sa.bartender_id === s.id) || [];
      const totalSalesAmount = staffSales.reduce((sum, sa) => sum + sa.total_price, 0);

      const staffTips = tips?.filter((t) => t.bartender_id === s.id) || [];
      const totalTips = staffTips.reduce((sum, t) => sum + t.amount, 0);

      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        role: s.role,
        hours_worked: parseFloat(hoursWorked.toFixed(2)),
        present_days: presentDays,
        total_sales_amount: parseFloat(totalSalesAmount.toFixed(2)),
        sales_count: staffSales.length,
        total_tips: parseFloat(totalTips.toFixed(2)),
      };
    }) || [];

    res.json({
      period,
      staff_performance: staffPerformance,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/profit-analysis - Revenue vs costs
router.get('/profit-analysis', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { period = 'month' } = req.query;
    let startDate: string;
    const endDate = new Date().toISOString();

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000);
      startDate = monthAgo.toISOString().split('T')[0];
    } else {
      startDate = new Date().toISOString().split('T')[0];
    }

    // Get sales revenue
    const { data: sales } = await supabase
      .from('bar_sales')
      .select('*')
      .gte('sale_timestamp', startDate)
      .lte('sale_timestamp', endDate);

    // Get inventory costs (usage transactions)
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('*, inventory_items(unit_cost)')
      .in('transaction_type', ['sale', 'usage'])
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate);

    const totalRevenue = sales?.reduce((sum, s) => sum + s.total_price, 0) || 0;

    let totalCosts = 0;
    transactions?.forEach((t) => {
      const cost = Math.abs(t.quantity_change) * (t.inventory_items?.unit_cost || 0);
      totalCosts += cost;
    });

    const grossProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    res.json({
      period,
      revenue: parseFloat(totalRevenue.toFixed(2)),
      costs: parseFloat(totalCosts.toFixed(2)),
      gross_profit: parseFloat(grossProfit.toFixed(2)),
      profit_margin_percentage: parseFloat(profitMargin.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
