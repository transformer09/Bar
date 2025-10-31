-- 004_enhanced_settings.sql
-- Enhanced settings and user management with fingerprint and role customization

-- ============ AUTHENTICATION METHODS ============
CREATE TABLE IF NOT EXISTS authentication_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default auth methods
INSERT INTO authentication_methods (method_name, enabled, description) VALUES
  ('password', true, 'Username/Password authentication'),
  ('fingerprint', false, 'Biometric fingerprint authentication'),
  ('face_recognition', false, 'Facial recognition authentication'),
  ('qrcode', false, 'QR Code based authentication')
ON CONFLICT (method_name) DO NOTHING;

-- ============ CUSTOM ROLES TABLE ============
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  color VARCHAR(7),
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles as system roles
INSERT INTO custom_roles (role_name, description, icon, color, is_system_role, is_active) VALUES
  ('manager', 'System Administrator', '👔', '#8B4513', true, true),
  ('bartender', 'Bar Staff', '🍹', '#D2691E', true, true),
  ('chef', 'Kitchen Staff', '👨‍🍳', '#FF8C00', true, true),
  ('waiter', 'Service Staff', '🧑‍🍳', '#FF6347', true, true),
  ('support', 'Support Staff', '🤝', '#4169E1', true, true),
  ('cashier', 'Cashier', '💰', '#228B22', true, true),
  ('owner', 'Owner/Boss', '👑', '#FFD700', true, true)
ON CONFLICT (role_name) DO NOTHING;

-- ============ PERMISSIONS MATRIX ============
CREATE TABLE IF NOT EXISTS permissions_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES custom_roles(id),
  permission_key VARCHAR(100) NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- ============ ENHANCED USERS TABLE UPDATES ============
-- Add fingerprint and auth methods to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS fingerprint_data BYTEA,
ADD COLUMN IF NOT EXISTS fingerprint_template VARCHAR(500),
ADD COLUMN IF NOT EXISTS face_data BYTEA,
ADD COLUMN IF NOT EXISTS auth_methods TEXT[] DEFAULT ARRAY['password'],
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- ============ USER ASSIGNMENTS TABLE ============
-- Track which users are assigned to which roles
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES custom_roles(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Migrate existing user roles to role assignments
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
SELECT u.id, cr.id, NOW(), true
FROM users u
JOIN custom_roles cr ON u.role = cr.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============ SYSTEM CONFIGURATION TABLE ============
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB,
  description TEXT,
  category VARCHAR(50),
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default system configurations
INSERT INTO system_config (config_key, config_value, description, category, is_editable) VALUES
  ('app_name', '"Bar Management System"', 'Application name', 'general', true),
  ('app_logo_url', '""', 'Application logo URL', 'general', true),
  ('currency_symbol', '"$"', 'Currency symbol', 'financial', true),
  ('tax_rate', '0.10', 'Default tax rate', 'financial', true),
  ('timezone', '"UTC"', 'System timezone', 'general', true),
  ('password_min_length', '8', 'Minimum password length', 'security', true),
  ('session_timeout_minutes', '30', 'Session timeout in minutes', 'security', true),
  ('enable_fingerprint', 'false', 'Enable fingerprint authentication', 'security', true),
  ('enable_face_recognition', 'false', 'Enable face recognition', 'security', true),
  ('require_password_change_days', '90', 'Force password change after days', 'security', true),
  ('max_login_attempts', '5', 'Max failed login attempts', 'security', true),
  ('lockout_duration_minutes', '30', 'Account lockout duration', 'security', true),
  ('enable_two_factor', 'false', 'Enable two-factor authentication', 'security', true)
ON CONFLICT (config_key) DO NOTHING;

-- ============ AUDIT LOG FOR SETTINGS CHANGES ============
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by UUID NOT NULL REFERENCES users(id),
  setting_type VARCHAR(50),
  setting_id UUID,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- ============ ROLE BASED MODULE ACCESS ============
CREATE TABLE IF NOT EXISTS role_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES custom_roles(id),
  module_id UUID NOT NULL REFERENCES system_modules(id),
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, module_id)
);

-- ============ INDEXES FOR PERFORMANCE ============
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint_template);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_matrix_role ON permissions_matrix(role_id);
CREATE INDEX IF NOT EXISTS idx_role_module_access_role ON role_module_access(role_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_changed_by ON settings_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
