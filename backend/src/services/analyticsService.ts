import { supabase } from './supabase';

export const analyticsService = {
  // Get real-time dashboard metrics
  async getRealTimeDashboard(ownerId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's sales
      const { data: todaysSales } = await supabase
        .from('orders')
        .select('total_amount, payment_status')
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      const totalRevenue = todaysSales?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalTransactions = todaysSales?.length || 0;
      const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Get occupied tables
      const { data: occupiedTables } = await supabase
        .from('table_occupancy')
        .select('*')
        .eq('is_occupied', true);

      // Get active staff
      const { data: activeStaff } = await supabase
        .from('staff_attendance')
        .select('*, users(first_name, last_name, role)')
        .eq('scheduled_date', today)
        .not('clock_in_time', 'is', null)
        .is('clock_out_time', null);

      // Get pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*, order_items(count)')
        .eq('order_status', 'pending')
        .gte('created_at', `${today}T00:00:00Z`);

      // Get recent activities
      const { data: recentActivities } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      // Get notifications
      const { data: unreadNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      // Get unusual activities
      const { data: unusualActivities } = await supabase
        .from('unusual_activity_flags')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        financial: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalTransactions,
          avgTransactionValue: parseFloat(avgTransactionValue.toFixed(2)),
          paymentsPending: todaysSales?.filter((o) => o.payment_status === 'pending').length || 0,
        },
        operations: {
          occupiedTablesCount: occupiedTables?.length || 0,
          totalTables: occupiedTables?.length || 0,
          activeStaffCount: activeStaff?.length || 0,
          pendingOrdersCount: pendingOrders?.length || 0,
        },
        staff: activeStaff || [],
        recentActivities: recentActivities || [],
        notifications: unreadNotifications || [],
        alerts: unusualActivities || [],
      };
    } catch (error) {
      console.error('Error getting real-time dashboard:', error);
      throw error;
    }
  },

  // Get staff performance metrics
  async getStaffPerformance(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('staff_activity_summary')
        .select('*, users(first_name, last_name, role)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('revenue_generated', { ascending: false });

      if (error) throw error;

      return data?.map((staff) => ({
        id: staff.user_id,
        name: `${staff.users?.first_name} ${staff.users?.last_name}`,
        role: staff.users?.role,
        ordersCount: staff.orders_count,
        itemsSold: staff.items_sold,
        revenueGenerated: staff.revenue_generated,
        avgOrderValue: staff.avg_order_value,
        hoursWorked: staff.hours_worked,
        tasksCompleted: staff.tasks_completed,
        unusualActivities: staff.unusual_activities,
        performance: 'good', // TODO: Calculate based on metrics
      })) || [];
    } catch (error) {
      console.error('Error getting staff performance:', error);
      throw error;
    }
  },

  // Get inventory movement summary
  async getInventoryMovement(days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 86400000).toISOString();

      const { data, error } = await supabase
        .from('stock_movement_log')
        .select('*, inventory_items(name, category, current_stock)')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by item
      const aggregated: Record<string, any> = {};
      data?.forEach((movement) => {
        const itemId = movement.inventory_item_id;
        if (!aggregated[itemId]) {
          aggregated[itemId] = {
            itemId,
            name: movement.inventory_items?.name,
            category: movement.inventory_items?.category,
            currentStock: movement.inventory_items?.current_stock,
            sales: 0,
            waste: 0,
            restock: 0,
            adjustments: 0,
            movements: [],
          };
        }
        aggregated[itemId].movements.push(movement);
        if (movement.movement_type === 'sale') aggregated[itemId].sales += Math.abs(movement.quantity_change);
        if (movement.movement_type === 'waste') aggregated[itemId].waste += Math.abs(movement.quantity_change);
        if (movement.movement_type === 'restock') aggregated[itemId].restock += movement.quantity_change;
        if (movement.movement_type === 'adjustment') aggregated[itemId].adjustments += Math.abs(movement.quantity_change);
      });

      return Object.values(aggregated);
    } catch (error) {
      console.error('Error getting inventory movement:', error);
      throw error;
    }
  },

  // Get table occupancy analytics
  async getTableOccupancyAnalytics(date: string) {
    try {
      const { data, error } = await supabase
        .from('table_occupancy')
        .select('*')
        .eq('date_part(scheduled_date)', date);

      if (error) throw error;

      // Calculate metrics
      const metrics = {
        totalSessions: data?.length || 0,
        averageDuration: data && data.length > 0
          ? data.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / data.length
          : 0,
        totalGuestCover: data?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0,
        peakHour: calculatePeakHour(data || []),
        occupancyRate: calculateOccupancyRate(data || []),
      };

      return metrics;
    } catch (error) {
      console.error('Error getting table occupancy analytics:', error);
      throw error;
    }
  },

  // Get profit and loss statement
  async getProfitLossStatement(date: string, periodType: 'daily' | 'weekly' | 'monthly' = 'daily') {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('profit_loss_statement')
        .select('*')
        .eq('statement_date', date)
        .eq('period_type', periodType)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        return existing;
      }

      // Calculate P&L
      const startDate = periodType === 'daily' ? date : calculatePeriodStart(date, periodType);
      const endDate = date;

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, payment_status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('payment_status', 'paid');

      const { data: transactions } = await supabase
        .from('inventory_transactions')
        .select('quantity_change')
        .eq('transaction_type', 'sale')
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate);

      const { data: payroll } = await supabase
        .from('staff_attendance')
        .select('hours_worked')
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate);

      const totalSales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const inventoryCost = await calculateInventoryCost(transactions || []);
      const laborCost = (payroll?.reduce((sum, p) => sum + ((p.hours_worked || 0) * 15), 0) || 0); // $15/hour average
      const operationalCost = totalSales * 0.1; // 10% of sales

      const totalCost = inventoryCost + laborCost + operationalCost;
      const grossProfit = totalSales - totalCost;
      const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

      const pnlStatement = {
        statement_date: date,
        period_type: periodType,
        total_sales: totalSales,
        total_discounts: 0,
        total_refunds: 0,
        net_revenue: totalSales,
        inventory_cost: inventoryCost,
        labor_cost: laborCost,
        operational_cost: operationalCost,
        total_cost: totalCost,
        gross_profit: grossProfit,
        profit_margin_percent: profitMargin,
        transaction_count: orders?.length || 0,
        avg_transaction_value: orders && orders.length > 0 ? totalSales / orders.length : 0,
      };

      // Store in DB
      await supabase.from('profit_loss_statement').insert([pnlStatement]);

      return pnlStatement;
    } catch (error) {
      console.error('Error getting profit/loss statement:', error);
      throw error;
    }
  },

  // Get unusual activity summary
  async getUnusualActivitySummary(days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 86400000).toISOString();

      const { data, error } = await supabase
        .from('unusual_activity_flags')
        .select('*, activity_log(user_id, activity_type, description)')
        .gte('created_at', startDate)
        .order('risk_level', { ascending: false });

      if (error) throw error;

      const summary = {
        totalFlags: data?.length || 0,
        critical: data?.filter((f) => f.risk_level === 'critical').length || 0,
        high: data?.filter((f) => f.risk_level === 'high').length || 0,
        medium: data?.filter((f) => f.risk_level === 'medium').length || 0,
        low: data?.filter((f) => f.risk_level === 'low').length || 0,
        resolved: data?.filter((f) => f.resolved).length || 0,
        pending: data?.filter((f) => !f.resolved).length || 0,
        flags: data || [],
      };

      return summary;
    } catch (error) {
      console.error('Error getting unusual activity summary:', error);
      throw error;
    }
  },

  // Get waiter/staff movement tracking
  async getStaffMovementTracking(staffId: string, date: string) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', staffId)
        .gte('timestamp', `${date}T00:00:00Z`)
        .lte('timestamp', `${date}T23:59:59Z`)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Create timeline
      const timeline = data?.map((activity) => ({
        time: activity.timestamp,
        type: activity.activity_type,
        description: activity.description,
        location: activity.location,
        metadata: activity.metadata,
      })) || [];

      return {
        staffId,
        date,
        totalActivities: timeline.length,
        timeline,
        orderCount: timeline.filter((t) => t.type.includes('order')).length,
        salesCount: timeline.filter((t) => t.type === 'payment_received').length,
      };
    } catch (error) {
      console.error('Error getting staff movement tracking:', error);
      throw error;
    }
  },
};

// Helper functions
function calculatePeakHour(data: any[]): string {
  const hours: Record<number, number> = {};
  data.forEach((session) => {
    if (session.occupied_at) {
      const hour = new Date(session.occupied_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
  });

  const peakHour = Object.entries(hours).reduce((max, [hour, count]) =>
    count > (max[1] || 0) ? [hour, count] : max,
    ['0', 0]
  )[0];

  return `${peakHour}:00`;
}

function calculateOccupancyRate(data: any[]): number {
  if (data.length === 0) return 0;
  const occupied = data.filter((t) => t.is_occupied).length;
  return (occupied / data.length) * 100;
}

function calculatePeriodStart(date: string, periodType: string): string {
  const d = new Date(date);
  if (periodType === 'weekly') {
    d.setDate(d.getDate() - d.getDay());
  } else if (periodType === 'monthly') {
    d.setDate(1);
  }
  return d.toISOString().split('T')[0];
}

async function calculateInventoryCost(transactions: any[]): Promise<number> {
  let total = 0;
  // Implementation depends on inventory item prices
  return total;
}
