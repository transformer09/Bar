import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { activityService } from '../services/activityService';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// ============ REAL-TIME DASHBOARD ============

// GET /api/owner/dashboard - Main owner dashboard with real-time data
router.get('/dashboard', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const dashboard = await analyticsService.getRealTimeDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// ============ ANALYTICS ============

// GET /api/owner/analytics/profit-loss - Profit and Loss statement
router.get('/analytics/profit-loss', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { date, period } = req.query;
    const today = date || new Date().toISOString().split('T')[0];
    const periodType = (period as any) || 'daily';

    const pnl = await analyticsService.getProfitLossStatement(today, periodType);
    res.json(pnl);
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/analytics/staff-performance - Staff performance metrics
router.get('/analytics/staff-performance', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = (start_date as string) || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = (end_date as string) || new Date().toISOString().split('T')[0];

    const performance = await analyticsService.getStaffPerformance(startDate, endDate);
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/analytics/inventory-movement - Inventory movement report
router.get('/analytics/inventory-movement', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { days } = req.query;
    const daysBack = parseInt((days as string) || '7');

    const movement = await analyticsService.getInventoryMovement(daysBack);
    res.json(movement);
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/analytics/table-occupancy - Table occupancy analytics
router.get('/analytics/table-occupancy', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { date } = req.query;
    const today = (date as string) || new Date().toISOString().split('T')[0];

    const occupancy = await analyticsService.getTableOccupancyAnalytics(today);
    res.json(occupancy);
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/analytics/unusual-activity - Unusual activity report
router.get('/analytics/unusual-activity', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { days } = req.query;
    const daysBack = parseInt((days as string) || '7');

    const summary = await analyticsService.getUnusualActivitySummary(daysBack);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// ============ ACTIVITY TRACKING ============

// GET /api/owner/activity/log - Activity log
router.get('/activity/log', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from('activity_log')
      .select('*, users(first_name, last_name, role)')
      .order('timestamp', { ascending: false })
      .limit(parseInt((limit as string) || '100'));

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/activity/staff/:staffId - Staff movement tracking
router.get('/activity/staff/:staffId', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;
    const today = (date as string) || new Date().toISOString().split('T')[0];

    const tracking = await analyticsService.getStaffMovementTracking(staffId, today);
    res.json(tracking);
  } catch (error) {
    next(error);
  }
});

// POST /api/owner/activity/detect-unusual - Manually trigger unusual activity detection
router.post('/activity/detect-unusual', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const flags = await activityService.detectUnusualActivities(req.user.id);
    res.json({ detected: flags.length, flags });
  } catch (error) {
    next(error);
  }
});

// ============ TABLE OCCUPANCY ============

// GET /api/owner/tables/occupancy - Current table occupancy status
router.get('/tables/occupancy', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('table_occupancy')
      .select('*, users(first_name, last_name)')
      .eq('is_occupied', true)
      .order('occupied_at', { ascending: true });

    if (error) throw error;

    res.json({
      occupied_count: data?.length || 0,
      tables: data || [],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/tables/heatmap - Table heatmap for visualization
router.get('/tables/heatmap', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('table_occupancy')
      .select('table_number, is_occupied, guest_count, duration_minutes')
      .eq('is_occupied', true);

    if (error) throw error;

    // Create heatmap data
    const heatmap = (data || []).map((table) => ({
      table: table.table_number,
      occupied: table.is_occupied,
      guests: table.guest_count || 0,
      duration: table.duration_minutes || 0,
      intensity: Math.min((table.guest_count || 0) / 10, 1), // 0-1 scale
    }));

    res.json(heatmap);
  } catch (error) {
    next(error);
  }
});

// ============ NOTIFICATIONS ============

// GET /api/owner/notifications - Get notifications
router.get('/notifications', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await activityService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// PUT /api/owner/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await activityService.markNotificationAsRead(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/owner/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ unread_count: count || 0 });
  } catch (error) {
    next(error);
  }
});

// ============ PERFORMANCE BENCHMARKS ============

// GET /api/owner/benchmarks - Get performance benchmarks
router.get('/benchmarks', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('performance_benchmarks')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/owner/benchmarks - Create performance benchmark
router.post('/benchmarks', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { metric_name, target_value, unit, benchmark_type, alert_threshold } = req.body;

    const { data, error } = await supabase
      .from('performance_benchmarks')
      .insert([
        {
          metric_name,
          target_value,
          unit: unit || 'amount',
          benchmark_type,
          alert_threshold: alert_threshold || 10,
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

// ============ STAFF COMPARISON ============

// GET /api/owner/staff-comparison - Compare staff performance
router.get('/staff-comparison', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = (start_date as string) || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = (end_date as string) || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('staff_performance_comparison')
      .select('*')
      .gte('comparison_date', startDate)
      .lte('comparison_date', endDate)
      .order('comparison_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ EXPORT REPORTS ============

// GET /api/owner/reports/export - Export analytics report
router.get('/reports/export', requireRole('owner', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { report_type, start_date, end_date, format } = req.query;

    let data: any = {};

    if (report_type === 'profit-loss') {
      data = await analyticsService.getProfitLossStatement(
        (start_date as string) || new Date().toISOString().split('T')[0],
        'monthly'
      );
    } else if (report_type === 'staff-performance') {
      data = await analyticsService.getStaffPerformance(
        (start_date as string) || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        (end_date as string) || new Date().toISOString().split('T')[0]
      );
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.csv"`);
      res.send(convertToCSV(data));
    } else {
      res.json(data);
    }
  } catch (error) {
    next(error);
  }
});

function convertToCSV(data: any): string {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map((obj: any) => headers.map((h) => obj[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
  return JSON.stringify(data);
}

export default router;
