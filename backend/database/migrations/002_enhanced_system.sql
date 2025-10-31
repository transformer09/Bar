-- System Settings and Configuration Tables

-- System Theme and Color Settings
CREATE TABLE system_theme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#8B4513',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#D2691E',
    accent_color VARCHAR(7) NOT NULL DEFAULT '#FF8C00',
    background_color VARCHAR(7) NOT NULL DEFAULT '#F9F9F9',
    text_color VARCHAR(7) NOT NULL DEFAULT '#333333',
    border_color VARCHAR(7) NOT NULL DEFAULT '#E0E0E0',
    success_color VARCHAR(7) NOT NULL DEFAULT '#4CAF50',
    error_color VARCHAR(7) NOT NULL DEFAULT '#F44336',
    warning_color VARCHAR(7) NOT NULL DEFAULT '#FF9800',
    info_color VARCHAR(7) NOT NULL DEFAULT '#2196F3',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Font Settings
CREATE TABLE system_fonts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_font VARCHAR(255) NOT NULL DEFAULT 'Segoe UI',
    heading_font VARCHAR(255) NOT NULL DEFAULT 'Arial',
    base_font_size INTEGER NOT NULL DEFAULT 14,
    heading_font_size INTEGER NOT NULL DEFAULT 24,
    button_font_size INTEGER NOT NULL DEFAULT 12,
    primary_font_weight VARCHAR(50) NOT NULL DEFAULT '400',
    heading_font_weight VARCHAR(50) NOT NULL DEFAULT '700',
    button_font_weight VARCHAR(50) NOT NULL DEFAULT '500',
    letter_spacing DECIMAL(3,2) NOT NULL DEFAULT 0,
    line_height DECIMAL(2,1) NOT NULL DEFAULT 1.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Modules (dynamic module management)
CREATE TABLE system_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    path VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_core BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module Role Permissions (which roles can access which modules)
CREATE TABLE module_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'bartender', 'chef', 'waiter', 'support', 'cashier')),
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, role)
);

-- POS Layout and Configuration
CREATE TABLE pos_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_type VARCHAR(50) NOT NULL DEFAULT 'grid' CHECK (layout_type IN ('grid', 'list', 'compact')),
    columns_count INTEGER DEFAULT 5,
    button_size VARCHAR(50) DEFAULT 'medium' CHECK (button_size IN ('small', 'medium', 'large')),
    show_price BOOLEAN DEFAULT TRUE,
    show_category_icons BOOLEAN DEFAULT TRUE,
    show_item_image BOOLEAN DEFAULT FALSE,
    button_font_size INTEGER DEFAULT 12,
    button_font_weight VARCHAR(50) DEFAULT '500',
    button_border_radius INTEGER DEFAULT 8,
    button_padding INTEGER DEFAULT 12,
    category_display VARCHAR(50) DEFAULT 'tabs' CHECK (category_display IN ('tabs', 'sidebar', 'dropdown')),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS Item Categories (for layout display)
CREATE TABLE pos_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    icon_code VARCHAR(50),
    color_hex VARCHAR(7),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Access Items (frequently used items on POS)
CREATE TABLE pos_quick_access_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pos_layout_id UUID NOT NULL REFERENCES pos_layouts(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES bar_recipes(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    display_name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color_override VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods Configuration
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'card', 'tab', 'digital_wallet', 'check', 'other')),
    is_active BOOLEAN DEFAULT TRUE,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (Enhanced)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    table_number VARCHAR(50),
    guest_number INTEGER,
    waiter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'ready', 'served', 'cancelled', 'completed')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    order_type VARCHAR(50) NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    service_charge DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items (detailed items in an order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES bar_recipes(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    item_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments and Transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(255),
    notes TEXT,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts Template Configuration
CREATE TABLE receipt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('invoice', 'final_receipt', 'payment_receipt')),
    description TEXT,
    header_content TEXT,
    footer_content TEXT,
    show_waiter_name BOOLEAN DEFAULT TRUE,
    show_table_number BOOLEAN DEFAULT TRUE,
    show_guest_count BOOLEAN DEFAULT TRUE,
    show_order_time BOOLEAN DEFAULT TRUE,
    show_item_notes BOOLEAN DEFAULT FALSE,
    show_discount BOOLEAN DEFAULT TRUE,
    show_tax BOOLEAN DEFAULT TRUE,
    show_service_charge BOOLEAN DEFAULT FALSE,
    show_payment_method BOOLEAN DEFAULT TRUE,
    show_cashier_name BOOLEAN DEFAULT TRUE,
    show_qr_code BOOLEAN DEFAULT FALSE,
    font_family VARCHAR(255) DEFAULT 'monospace',
    header_font_size INTEGER DEFAULT 16,
    body_font_size INTEGER DEFAULT 12,
    footer_font_size INTEGER DEFAULT 10,
    paper_width INTEGER DEFAULT 80,
    margin_top INTEGER DEFAULT 10,
    margin_bottom INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Receipts (history)
CREATE TABLE generated_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    receipt_template_id UUID NOT NULL REFERENCES receipt_templates(id) ON DELETE RESTRICT,
    receipt_type VARCHAR(50) NOT NULL CHECK (receipt_type IN ('invoice', 'final_receipt', 'payment_receipt')),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_content TEXT NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    printed_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Cashier role to users (already exists in original schema, just confirming)
-- ALTER TABLE users ADD CONSTRAINT check_role_cashier CHECK (role IN ('manager', 'bartender', 'chef', 'waiter', 'support', 'cashier'));

-- System Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'export')),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO system_theme (name, primary_color, secondary_color, accent_color)
VALUES
    ('Dark Modern', '#1F2937', '#374151', '#3B82F6'),
    ('Warm Brown', '#8B4513', '#D2691E', '#FF8C00'),
    ('Ocean Blue', '#0E7490', '#06B6D4', '#0891B2'),
    ('Forest Green', '#15803D', '#16A34A', '#22C55E'),
    ('Sunset', '#DC2626', '#EA580C', '#F59E0B');

-- Insert default fonts
INSERT INTO system_fonts (name, primary_font, heading_font, base_font_size, heading_font_size, button_font_size)
VALUES
    ('Modern Clean', 'Segoe UI, sans-serif', 'Arial, sans-serif', 14, 24, 12),
    ('Professional', 'Helvetica, sans-serif', 'Georgia, serif', 13, 26, 11),
    ('Casual', 'Trebuchet MS, sans-serif', 'Comic Sans MS, cursive', 15, 22, 13);

-- Insert default POS Categories
INSERT INTO pos_categories (name, icon_code, color_hex, display_order)
VALUES
    ('Beer', '🍺', '#C17B3F', 1),
    ('Wine', '🍷', '#8B0000', 2),
    ('Cocktails', '🍹', '#FF1493', 3),
    ('Non-Alcoholic', '☕', '#A0522D', 4),
    ('Food', '🍽️', '#DC143C', 5),
    ('Appetizers', '🍤', '#FF6347', 6),
    ('Desserts', '🍰', '#FFB6C1', 7),
    ('Coffee', '☕', '#8B4513', 8);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, requires_confirmation, display_order)
VALUES
    ('Cash', 'cash', TRUE, 1),
    ('Card', 'card', FALSE, 2),
    ('Tab', 'tab', FALSE, 3),
    ('Mobile Pay', 'digital_wallet', FALSE, 4),
    ('Check', 'check', FALSE, 5);

-- Insert default system modules
INSERT INTO system_modules (name, display_name, icon, path, position, is_core)
VALUES
    ('dashboard', 'Dashboard', '📊', '/dashboard', 1, TRUE),
    ('pos', 'Point of Sale', '💳', '/pos', 2, TRUE),
    ('inventory', 'Inventory', '📦', '/inventory', 3, TRUE),
    ('kitchen', 'Kitchen', '👨‍🍳', '/kitchen', 4, TRUE),
    ('staff', 'Staff', '👥', '/staff', 5, TRUE),
    ('reports', 'Reports', '📈', '/reports', 6, TRUE),
    ('admin', 'Admin Settings', '⚙️', '/admin', 7, TRUE);

-- Create indexes for performance
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_generated_receipts_order ON generated_receipts(order_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
