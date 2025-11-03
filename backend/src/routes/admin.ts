import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

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

// ============ USER MANAGEMENT ============

// GET /api/admin/users - List all users (manager only)
router.get('/users', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        last_login,
        created_at,
        user_role_assignments(role_id, custom_roles(role_name, description, icon))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        phone,
        is_active,
        auth_methods,
        last_login,
        user_role_assignments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users - Create new user (manager only)
router.post('/users', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { email, first_name, last_name, password, phone, role, auth_methods } = req.body;

    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          first_name,
          last_name,
          password_hash,
          phone: phone || null,
          role,
          is_active: true,
          auth_methods: auth_methods || ['password'],
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    // Assign role
    const { data: roleData } = await supabase
      .from('custom_roles')
      .select('id')
      .eq('role_name', role)
      .single();

    if (roleData) {
      await supabase.from('user_role_assignments').insert([
        {
          user_id: user.id,
          role_id: roleData.id,
          assigned_by: req.user.id,
          is_active: true,
        },
      ]);
    }

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'user_created',
        setting_id: user.id,
        new_value: { email, first_name, last_name, role },
        change_reason: 'User created via admin panel',
      },
    ]);

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id - Update user (manager only)
router.put('/users/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { first_name, last_name, phone, is_active, role } = req.body;

    const updates: any = {
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      phone: phone || undefined,
      is_active: is_active !== undefined ? is_active : undefined,
      role: role || undefined,
    };

    // Remove undefined values
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If role changed, update role assignments
    if (role) {
      const { data: roleData } = await supabase
        .from('custom_roles')
        .select('id')
        .eq('role_name', role)
        .single();

      if (roleData) {
        // Deactivate old assignments
        await supabase
          .from('user_role_assignments')
          .update({ is_active: false })
          .eq('user_id', id);

        // Create new assignment
        await supabase.from('user_role_assignments').insert([
          {
            user_id: id,
            role_id: roleData.id,
            assigned_by: req.user.id,
            is_active: true,
          },
        ]);
      }
    }

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'user_updated',
        setting_id: id,
        new_value: updates,
        change_reason: 'User updated via admin panel',
      },
    ]);

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/password - Update user password (manager only)
router.put('/users/:id/password', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    const { data: user, error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'password_changed',
        setting_id: id,
        change_reason: 'Password reset via admin panel',
      },
    ]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ============ ROLE MANAGEMENT ============

// GET /api/admin/roles - List all roles
router.get('/roles', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select(`
        *,
        permissions_matrix(*),
        role_module_access(*)
      `)
      .order('role_name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/roles - Create custom role (manager only)
router.post('/roles', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { role_name, description, icon, color } = req.body;

    if (!role_name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const { data: role, error } = await supabase
      .from('custom_roles')
      .insert([
        {
          role_name,
          description: description || null,
          icon: icon || '👤',
          color: color || '#000000',
          is_system_role: false,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'role_created',
        setting_id: role.id,
        new_value: { role_name, description, icon, color },
        change_reason: 'Custom role created via admin panel',
      },
    ]);

    res.status(201).json({ success: true, role });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/roles/:id - Update role (manager only)
router.put('/roles/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { description, icon, color, is_active } = req.body;

    const updates: any = {};
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: role, error } = await supabase
      .from('custom_roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'role_updated',
        setting_id: id,
        new_value: updates,
        change_reason: 'Role updated via admin panel',
      },
    ]);

    res.json({ success: true, role });
  } catch (error) {
    next(error);
  }
});

// ============ AUTHENTICATION SETTINGS ============

// GET /api/admin/auth-methods - List authentication methods
router.get('/auth-methods', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('authentication_methods')
      .select('*')
      .order('method_name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/auth-methods/:method - Enable/disable auth method
router.put('/auth-methods/:method', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { method } = req.params;
    const { enabled } = req.body;

    const { data, error } = await supabase
      .from('authentication_methods')
      .update({ enabled })
      .eq('method_name', method)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'auth_method_updated',
        new_value: { method, enabled },
        change_reason: `${method} authentication ${enabled ? 'enabled' : 'disabled'}`,
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ============ SYSTEM CONFIGURATION ============

// GET /api/admin/config - Get all system configuration
router.get('/config', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .eq('is_editable', true)
      .order('category', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/config/:key - Update configuration value
router.put('/config/:key', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { key } = req.params;
    const { config_value } = req.body;

    const { data: oldConfig } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', key)
      .single();

    const { data, error } = await supabase
      .from('system_config')
      .update({ config_value })
      .eq('config_key', key)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('settings_audit_log').insert([
      {
        changed_by: req.user.id,
        setting_type: 'config_updated',
        old_value: { [key]: oldConfig?.config_value },
        new_value: { [key]: config_value },
        change_reason: `System config '${key}' updated`,
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
