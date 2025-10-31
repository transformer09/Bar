-- Owner/Boss Tracking and Analytics Tables

-- Activity Types and Tracking
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'order_created', 'order_confirmed', 'order_served', 'order_completed',
        'payment_received', 'inventory_adjustment', 'table_occupied', 'table_cleared',
        'staff_clock_in', 'staff_clock_out', 'recipe_prepared', 'refund_issued',
        'discount_applied', 'unusual_activity'
    )),
    description TEXT NOT NULL,
    metadata JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    location VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Occupancy Tracking
CREATE TABLE table_occupancy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(50) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    guest_count INTEGER,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    occupied_at TIMESTAMP WITH TIME ZONE,
    cleared_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (cached calculations)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_key VARCHAR(100),
    metric_value DECIMAL(15, 2),
    additional_data JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_type, metric_key)
);

-- Staff Activity Summary
CREATE TABLE staff_activity_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    role VARCHAR(50),
    orders_count INTEGER DEFAULT 0,
    items_sold INTEGER DEFAULT 0,
    revenue_generated DECIMAL(12, 2) DEFAULT 0,
    avg_order_value DECIMAL(10, 2) DEFAULT 0,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5, 2) DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    unusual_activities INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Notifications for Owner
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'alert', 'warning', 'critical', 'info', 'suggestion'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Unusual Activity Detection
CREATE TABLE unusual_activity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_log_id UUID NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
    flag_reason VARCHAR(255) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    action_taken VARCHAR(50),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Stock Movement
CREATE TABLE stock_movement_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'waste', 'restock', 'adjustment')),
    quantity_change DECIMAL(12, 2) NOT NULL,
    stock_before DECIMAL(12, 2) NOT NULL,
    stock_after DECIMAL(12, 2) NOT NULL,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profit & Loss Statement
CREATE TABLE profit_loss_statement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),

    -- Revenue
    total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_discounts DECIMAL(12, 2) DEFAULT 0,
    total_refunds DECIMAL(12, 2) DEFAULT 0,
    net_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Costs
    inventory_cost DECIMAL(12, 2) DEFAULT 0,
    labor_cost DECIMAL(12, 2) DEFAULT 0,
    operational_cost DECIMAL(12, 2) DEFAULT 0,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Profit
    gross_profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit_margin_percent DECIMAL(5, 2) DEFAULT 0,

    -- Additional metrics
    transaction_count INTEGER DEFAULT 0,
    avg_transaction_value DECIMAL(10, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(statement_date, period_type)
);

-- Performance Benchmarks
CREATE TABLE performance_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2),
    unit VARCHAR(50),
    benchmark_type VARCHAR(50) NOT NULL CHECK (benchmark_type IN ('daily', 'weekly', 'monthly')),
    alert_threshold DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Performance Comparison
CREATE TABLE staff_performance_comparison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_date DATE NOT NULL,

    staff_member_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_member_1_orders INTEGER DEFAULT 0,
    staff_member_1_revenue DECIMAL(12, 2) DEFAULT 0,
    staff_member_1_avg_order DECIMAL(10, 2) DEFAULT 0,

    staff_member_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_member_2_orders INTEGER DEFAULT 0,
    staff_member_2_revenue DECIMAL(12, 2) DEFAULT 0,
    staff_member_2_avg_order DECIMAL(10, 2) DEFAULT 0,

    comparison_metric VARCHAR(100),
    winner_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comparison_date, staff_member_1_id, staff_member_2_id)
);

-- Indexes for Performance
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_activity_log_severity ON activity_log(severity);

CREATE INDEX idx_table_occupancy_table ON table_occupancy(table_number);
CREATE INDEX idx_table_occupancy_is_occupied ON table_occupancy(is_occupied);
CREATE INDEX idx_table_occupancy_waiter ON table_occupancy(waiter_id);
CREATE INDEX idx_table_occupancy_created ON table_occupancy(created_at DESC);

CREATE INDEX idx_performance_metrics_date ON performance_metrics(date DESC);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);

CREATE INDEX idx_staff_activity_date ON staff_activity_summary(date DESC);
CREATE INDEX idx_staff_activity_user ON staff_activity_summary(user_id);

CREATE INDEX idx_notifications_owner ON notifications(owner_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_unusual_activity_risk ON unusual_activity_flags(risk_level);
CREATE INDEX idx_unusual_activity_resolved ON unusual_activity_flags(resolved);

CREATE INDEX idx_stock_movement_item ON stock_movement_log(inventory_item_id);
CREATE INDEX idx_stock_movement_type ON stock_movement_log(movement_type);
CREATE INDEX idx_stock_movement_created ON stock_movement_log(created_at DESC);

CREATE INDEX idx_profit_loss_date ON profit_loss_statement(statement_date DESC);
CREATE INDEX idx_profit_loss_type ON profit_loss_statement(period_type);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE unusual_activity_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_loss_statement ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create notification function
CREATE OR REPLACE FUNCTION notify_unusual_activity()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('unusual_activity', json_build_object(
        'id', NEW.id,
        'flag_reason', NEW.flag_reason,
        'risk_level', NEW.risk_level
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unusual_activity_notify AFTER INSERT ON unusual_activity_flags
FOR EACH ROW EXECUTE FUNCTION notify_unusual_activity();

-- Create activity log notification
CREATE OR REPLACE FUNCTION notify_activity_log()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('activity_change', json_build_object(
        'id', NEW.id,
        'activity_type', NEW.activity_type,
        'user_id', NEW.user_id,
        'severity', NEW.severity
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_log_notify AFTER INSERT ON activity_log
FOR EACH ROW EXECUTE FUNCTION notify_activity_log();
