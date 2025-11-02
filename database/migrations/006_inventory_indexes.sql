-- ======================================================================
-- INVENTORY_INDEXES - Additional performance indexes for inventory system
-- Optimizes queries for FIFO/LIFO calculations and reporting
-- Ensures efficient performance for high-volume inventory operations
-- ======================================================================

-- Composite indexes for batch queries (FIFO/LIFO)
CREATE INDEX IF NOT EXISTS idx_batches_item_received_status
ON inventory_batches(inventory_item_id, received_date, batch_status)
WHERE batch_status = 'active';

CREATE INDEX IF NOT EXISTS idx_batches_item_expiration_status
ON inventory_batches(inventory_item_id, expiration_date, batch_status)
WHERE expiration_date IS NOT NULL AND batch_status = 'active';

CREATE INDEX IF NOT EXISTS idx_batches_supplier_date
ON inventory_batches(supplier_id, received_date DESC)
WHERE supplier_id IS NOT NULL;

-- Movement tracking indexes for audit trails
CREATE INDEX IF NOT EXISTS idx_movements_item_type_date
ON inventory_stock_movements(inventory_item_id, movement_type, movement_date DESC);

CREATE INDEX IF NOT EXISTS idx_movements_batch_date_type
ON inventory_stock_movements(batch_id, movement_date DESC, movement_type);

CREATE INDEX IF NOT EXISTS idx_movements_staff_date
ON inventory_stock_movements(staff_id, movement_date DESC)
WHERE staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movements_location_date
ON inventory_stock_movements(source_location, destination_location, movement_date DESC);

-- Expiration monitoring indexes
CREATE INDEX IF NOT EXISTS idx_alerts_active_warnings
ON inventory_expiration_alerts(alert_date, days_until_expiry)
WHERE status = 'active' AND alert_type IN ('warning', 'critical');

CREATE INDEX IF NOT EXISTS idx_alerts_expiring_soon
ON inventory_expiration_alerts(days_until_expiry, alert_date)
WHERE status = 'active' AND days_until_expiry <= 30 AND days_until_expiry > 0;

CREATE INDEX IF NOT EXISTS idx_alerts_expired
ON inventory_expiration_alerts(alert_date DESC, quantity_affected)
WHERE alert_type = 'expired' AND status = 'active';

-- Valuation comparison indexes
CREATE INDEX IF NOT EXISTS idx_valuations_item_date_value
ON inventory_valuations(inventory_item_id, valuation_date DESC, fifo_value, lifo_value);

CREATE INDEX IF NOT EXISTS idx_valuations_date_fifo_lifo
ON inventory_valuations(valuation_date DESC, fifo_value, lifo_value);

CREATE INDEX IF NOT EXISTS idx_valuations_impact_analysis
ON inventory_valuations(lifo_minus_fifo_diff DESC, valuation_date DESC)
WHERE lifo_minus_fifo_diff IS NOT NULL;

-- Inventory items performance indexes
CREATE INDEX IF NOT EXISTS idx_items_active_category
ON inventory_items(is_active, category, name)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_items_low_stock
ON inventory_items(current_stock, reorder_point)
WHERE current_stock < reorder_point AND reorder_point IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_valuation_method
ON inventory_items(valuation_method, current_stock DESC)
WHERE valuation_method IS NOT NULL;

-- Reporting and analytics indexes
CREATE INDEX IF NOT EXISTS idx_movements_daily_summary
ON inventory_stock_movements(DATE(movement_date), movement_type, inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_batches_monthly_summary
ON inventory_batches(DATE_TRUNC('month', received_date), inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_alerts_monthly_summary
ON inventory_expiration_alerts(DATE_TRUNC('month', created_at), alert_type);

-- Full-text search indexes (if supported)
-- Note: These require pg_trgm extension
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON inventory_items USING gin(name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_items_notes_trgm ON inventory_items USING gin(notes gin_trgm_ops);

-- Add comments explaining index purposes
COMMENT ON INDEX idx_batches_item_received_status IS 'Optimizes FIFO batch selection queries';
COMMENT ON INDEX idx_batches_item_expiration_status IS 'Optimizes expiration-based batch queries';
COMMENT ON INDEX idx_movements_item_type_date IS 'Optimizes audit trail queries by item and type';
COMMENT ON INDEX idx_alerts_active_warnings IS 'Optimizes expiration alert queries';
COMMENT ON INDEX idx_valuations_impact_analysis IS 'Optimizes valuation comparison reports';
COMMENT ON INDEX idx_items_low_stock IS 'Optimizes low stock alert queries';