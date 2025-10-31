-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'bartender', 'chef', 'waiter', 'support')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    payment_terms VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Items table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('liquor', 'ingredient', 'snack', 'equipment')),
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
    minimum_threshold DECIMAL(12, 2) NOT NULL DEFAULT 0,
    maximum_capacity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    reorder_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'partially_received', 'cancelled')),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Order Items table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_ordered DECIMAL(12, 2) NOT NULL,
    quantity_received DECIMAL(12, 2) DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL
);

-- Bar Recipes table
CREATE TABLE bar_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cocktail', 'beer', 'wine', 'shot', 'non_alcoholic')),
    is_signature BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bar Recipe Ingredients table
CREATE TABLE bar_recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES bar_recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE
);

-- Bar Sales table
CREATE TABLE bar_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sale_type VARCHAR(50) NOT NULL CHECK (sale_type IN ('manual', 'pos_api')),
    bartender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipe_id UUID REFERENCES bar_recipes(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(255),
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'tab', 'other')),
    pos_transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotions table
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('happy_hour', 'discount', 'combo', 'special_event')),
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL,
    applicable_items UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen Orders table
CREATE TABLE kitchen_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'ready', 'served', 'cancelled')),
    priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    special_requests TEXT,
    allergy_notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen Order Items table
CREATE TABLE kitchen_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kitchen_order_id UUID NOT NULL REFERENCES kitchen_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(255),
    quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    preparation_notes TEXT
);

-- Staff Schedules table
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    role_for_shift VARCHAR(50),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Attendance table
CREATE TABLE staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Transactions table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'usage', 'restock', 'adjustment', 'waste')),
    quantity_change DECIMAL(12, 2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('bar_sale', 'kitchen_order', 'purchase_order', 'manual')),
    reference_id UUID,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tips table
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bar_sale_id UUID REFERENCES bar_sales(id) ON DELETE SET NULL,
    kitchen_order_id UUID REFERENCES kitchen_orders(id) ON DELETE SET NULL,
    bartender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_supplier ON inventory_items(supplier_id);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_current_stock ON inventory_items(current_stock);

CREATE INDEX idx_bar_recipes_category ON bar_recipes(category);
CREATE INDEX idx_bar_recipes_created_by ON bar_recipes(created_by);

CREATE INDEX idx_bar_sales_bartender ON bar_sales(bartender_id);
CREATE INDEX idx_bar_sales_sale_timestamp ON bar_sales(sale_timestamp);
CREATE INDEX idx_bar_sales_recipe ON bar_sales(recipe_id);
CREATE INDEX idx_bar_sales_pos_transaction ON bar_sales(pos_transaction_id);

CREATE INDEX idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX idx_kitchen_orders_created_at ON kitchen_orders(created_at);
CREATE INDEX idx_kitchen_orders_assigned_to ON kitchen_orders(assigned_to);
CREATE INDEX idx_kitchen_orders_priority ON kitchen_orders(priority);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_by ON purchase_orders(created_by);

CREATE INDEX idx_staff_schedules_user ON staff_schedules(user_id);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(scheduled_date);

CREATE INDEX idx_staff_attendance_user ON staff_attendance(user_id);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(scheduled_date);

CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_timestamp ON inventory_transactions(recorded_at);

CREATE INDEX idx_promotions_is_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_datetime, end_datetime);

CREATE INDEX idx_tips_bartender ON tips(bartender_id);
CREATE INDEX idx_tips_recorded_at ON tips(recorded_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Create notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_kitchen_orders()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('kitchen_orders_change', json_build_object('action', TG_OP, 'data', row_to_json(NEW))::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_bar_sales()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('bar_sales_change', json_build_object('action', TG_OP, 'data', row_to_json(NEW))::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_inventory_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('inventory_change', json_build_object('action', TG_OP, 'data', row_to_json(NEW))::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time notifications
CREATE TRIGGER kitchen_orders_notify AFTER INSERT OR UPDATE ON kitchen_orders
FOR EACH ROW EXECUTE FUNCTION notify_kitchen_orders();

CREATE TRIGGER bar_sales_notify AFTER INSERT ON bar_sales
FOR EACH ROW EXECUTE FUNCTION notify_bar_sales();

CREATE TRIGGER inventory_items_notify AFTER UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION notify_inventory_changes();
