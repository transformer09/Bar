-- ======================================================================
-- INVENTORY_STOCK_MOVEMENTS - Complete audit trail of all stock movements
-- Tracks every batch movement with detailed source/destination information
-- Used for FIFO/LIFO calculations and complete audit trail
-- ======================================================================

-- Table: inventory_stock_movements
CREATE TABLE IF NOT EXISTS inventory_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('restock', 'usage', 'adjustment', 'transfer', 'waste', 'return', 'expiration')),
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity DECIMAL NOT NULL CHECK (quantity != 0), -- Positive for stock in, negative for stock out
    unit_cost DECIMAL, -- Cost per unit at time of movement (for valuation)
    total_cost DECIMAL, -- Total cost of movement (quantity * unit_cost)
    reference_type VARCHAR(20), -- 'purchase_order', 'sale', 'manual_adjustment', 'kitchen_usage', 'waste_disposal'
    reference_id UUID, -- ID of related record (PO, sale, etc.)
    source_location VARCHAR(50), -- 'storage', 'bar', 'kitchen', 'supplier'
    destination_location VARCHAR(50), -- 'storage', 'bar', 'kitchen', 'customer', 'disposal'
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_stock_movements_item_date ON inventory_stock_movements(inventory_item_id, movement_date DESC);
CREATE INDEX idx_stock_movements_batch_date ON inventory_stock_movements(batch_id, movement_date DESC);
CREATE INDEX idx_stock_movements_type ON inventory_stock_movements(movement_type, movement_date DESC);
CREATE INDEX idx_stock_movements_reference ON inventory_stock_movements(reference_type, reference_id) WHERE reference_type IS NOT NULL;
CREATE INDEX idx_stock_movements_location ON inventory_stock_movements(source_location, destination_location);

-- Add comments
COMMENT ON TABLE inventory_stock_movEMENTS 'Complete audit trail of all stock movements with batch tracking';
COMMENT ON COLUMN inventory_stock_movements.quantity 'Positive for stock in, negative for stock out';
COMMENT ON COLUMN inventory_stock_movements.unit_cost 'Cost per unit at time of movement for valuation calculations';

-- Full table example:
-- id, inventory_item_id, batch_id, movement_type, movement_date, quantity, unit_cost, total_cost, reference_type, reference_id, source_location, destination_location, staff_id, notes, created_at, updated_at
-- UUID-12345, UUID-456, UUID-789, "restock", "2024-10-25 14:30:00", 50.0, 15.50, 775.00, "purchase_order", PO-123, "supplier", "storage", staff-456, "New stock delivery", "2024-10-25 14:30:00", "2024-10-25 14:30:00"