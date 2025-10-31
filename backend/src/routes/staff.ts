import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { activityService } from '../services/activityService';
import { StaffScheduleSchema, ClockInSchema, ClockOutSchema } from '../utils/validators';

const router = Router();

// GET /api/staff - List all staff (manager only)
router.get('/', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/staff/:id - Staff profile
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/staff - Add new staff (manager only)
router.post('/', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { email, first_name, last_name, phone, role } = req.body;

    if (!email || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          first_name,
          last_name,
          phone: phone || null,
          role,
          is_active: true,
          password_hash: 'temp_hash', // Should be set by auth
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

// PUT /api/staff/:id - Update staff info (manager or self)
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== 'manager' && req.user?.id !== id) {
      return res.status(403).json({ error: 'Cannot update other staff' });
    }

    const { data, error } = await supabase
      .from('users')
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

// DELETE /api/staff/:id - Remove staff (soft delete)
router.delete('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
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

// ============ SCHEDULES ============

// GET /api/staff/:id/schedule - Staff schedule
router.get('/:id/schedule', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('staff_schedules')
      .select('*')
      .eq('user_id', id);

    if (start_date) {
      query = query.gte('scheduled_date', start_date);
    }

    if (end_date) {
      query = query.lte('scheduled_date', end_date);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/staff/schedules - Create schedule entry (manager only)
router.post('/schedules', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = StaffScheduleSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('staff_schedules')
      .insert([
        {
          ...input,
          created_by: req.user.id,
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

// ============ ATTENDANCE ============

// POST /api/staff/:id/clock-in - Clock in
router.post('/:id/clock-in', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { scheduled_date } = req.body;

    if (!scheduled_date) {
      return res.status(400).json({ error: 'scheduled_date is required' });
    }

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert([
        {
          user_id: id,
          scheduled_date,
          clock_in_time: new Date().toISOString(),
          status: 'present',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log clock-in activity
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', id)
      .single();

    await activityService.logActivity({
      user_id: id,
      activity_type: 'staff_clock_in',
      description: `${user?.first_name || ''} ${user?.last_name || ''} clocked in`,
      timestamp: new Date().toISOString(),
      metadata: {
        staff_id: id,
      },
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/staff/:id/clock-out - Clock out
router.post('/:id/clock-out', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { scheduled_date } = req.body;

    if (!scheduled_date) {
      return res.status(400).json({ error: 'scheduled_date is required' });
    }

    // Find the clock-in record
    const { data: attendance, error: findError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', id)
      .eq('scheduled_date', scheduled_date)
      .single();

    if (findError) throw findError;

    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clock_in_time);
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const { data, error } = await supabase
      .from('staff_attendance')
      .update({
        clock_out_time: clockOutTime.toISOString(),
        hours_worked: parseFloat(hoursWorked.toFixed(2)),
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/staff/attendance - Attendance records (manager only)
router.get('/attendance', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    let query = supabase
      .from('staff_attendance')
      .select('*, users(first_name, last_name)');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (start_date) {
      query = query.gte('scheduled_date', start_date);
    }

    if (end_date) {
      query = query.lte('scheduled_date', end_date);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
