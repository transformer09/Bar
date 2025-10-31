import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// ============ THEME MANAGEMENT ============

// GET /api/admin/themes - List all themes
router.get('/themes', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('system_theme').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/themes/active - Get active theme
router.get('/themes/active', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_theme')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/themes - Create theme (manager only)
router.post('/themes', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_theme')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/themes/:id - Update theme
router.put('/themes/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('system_theme')
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

// PUT /api/admin/themes/:id/activate - Set theme as active
router.put('/themes/:id/activate', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Deactivate all themes
    await supabase.from('system_theme').update({ is_active: false }).neq('id', id);

    // Activate selected theme
    const { data, error } = await supabase
      .from('system_theme')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ FONT MANAGEMENT ============

// GET /api/admin/fonts - List all fonts
router.get('/fonts', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase.from('system_fonts').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/fonts/active - Get active font
router.get('/fonts/active', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_fonts')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/fonts - Create font (manager only)
router.post('/fonts', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_fonts')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/fonts/:id - Update font
router.put('/fonts/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('system_fonts')
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

// ============ MODULE MANAGEMENT ============

// GET /api/admin/modules - List all modules
router.get('/modules', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_modules')
      .select('*')
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/modules - Create module (manager only)
router.post('/modules', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_modules')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/modules/:id - Update module (manager only)
router.put('/modules/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('system_modules')
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

// DELETE /api/admin/modules/:id - Delete module (manager only)
router.delete('/modules/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Delete related permissions
    await supabase.from('module_role_permissions').delete().eq('module_id', id);

    // Delete module
    const { data, error } = await supabase
      .from('system_modules')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ============ MODULE PERMISSIONS ============

// GET /api/admin/module-permissions/:moduleId - Get permissions for module
router.get('/module-permissions/:moduleId', async (req: AuthRequest, res, next) => {
  try {
    const { moduleId } = req.params;
    const { data, error } = await supabase
      .from('module_role_permissions')
      .select('*')
      .eq('module_id', moduleId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/module-permissions - Update role permissions (manager only)
router.put('/module-permissions', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { module_id, role, permissions } = req.body;

    // Check if permission exists
    const { data: existing } = await supabase
      .from('module_role_permissions')
      .select('id')
      .eq('module_id', module_id)
      .eq('role', role)
      .single();

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('module_role_permissions')
        .update(permissions)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } else {
      // Create
      const { data, error } = await supabase
        .from('module_role_permissions')
        .insert([{ module_id, role, ...permissions }])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
