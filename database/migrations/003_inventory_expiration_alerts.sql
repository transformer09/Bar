-- ======================================================================
-- INVENTORY_EXPIRATION_ALERTS - Track and manage expiring inventory
-- Automates expiration monitoring and alerting system
-- Used for FIFO calculations and waste reduction
-- ======================================================================

-- Table: inventory_expiration_alerts
CREATE TABLE IF NOT EXISTS inventory_expiration_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'critical', 'expired', 'disposed')),
    alert_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    days_until_expiry INTEGER NOT NULL, -- May be negative for expired items
    quantity_affected DECIMAL NOT NULL CHECK (quantity_affected > 0),
    estimated_waste_value DECIMAL, -- quantity_affected * current_unit_cost
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_date TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_expiration_alerts_date ON inventory_expiration_alerts(alert_date, status);
CREATE INDEX idx_expiration_alerts_item ON inventory_expiration_alerts(inventory_item_id, alert_date);
CREATE INDEX idx_expiration_alerts_batch ON inventory_expiration_alerts(batch_id, alert_date);
CREATE INDEX idx_expiration_alerts_type ON inventory_expiration_alerts(alert_type, status);
CREATE INDEX idx_expiration_alerts_status ON inventory_expiration_alerts(status, created_at DESC);

-- Add comments
COMMENT ON TABLE inventory_expiration_alerts 'Tracks and manages expiring inventory with automated alerting';
COMMENT ON COLUMN inventory_expiration_alerts.days_until_expiry 'Positive = future expiration, Negative = already expired';
COMMENT ON COLUMN inventory_expiration_alerts.estimated_waste_value 'Financial impact of potential waste';

-- Full table example:
-- id, inventory_item_id, batch_id, alert_type, alert_date, expiration_date, days_until_expiry, quantity_affected, estimated_waste_value, status, notification_sent, notification_date, acknowledged_by, acknowledged_at, resolution_notes, created_at, updated_at
-- UUID-12345, UUID-456, UUID-789, "warning", "2024-10-20", "2024-10-25", 5, 45.0, 697.50, "active", FALSE, NULL, NULL, NULL, NULL, "2024-10-20 09:00:00", "2024-10-20 09:00:00"