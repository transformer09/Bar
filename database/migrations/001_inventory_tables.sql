-- ======================================================================
-- INVENTORY_BATCHES - Track individual stock purchases with different prices and expirations
-- Each batch represents a single stock receipt
-- Used for LIFO/FIFO calculations and expiration tracking
-- ======================================================================

-- Table: inventory_batches
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., BTH-VOD-20241025-123456-ABCDEF
    received_date TIMESTAMP WITH TIME ZONE NOT NULL,
    unit_cost DECIMAL NOT NULL CHECK (unit_cost > 0), -- Cost per unit
    quantity_received DECIMAL NOT NULL CHECK (quantity_received > 0), -- Units received
    quantity_available DECIMAL NOT NULL CHECK (quantity_available >= 0), // Available units remaining
    quantity_used DECIMAL NOT NULL DEFAULT 0, // Units already used
    expiration_date DATE, -- NULL for items without expiration
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    notes TEXT,
    batch_status VARCHAR(20) DEFAULT 'active', // active, depleted, expired, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for FIFO/LIFO calculations
CREATE INDEX idx_inventory_batches_received_date_active ON inventory_batches(inventory_item_id, received_date) WHERE batch_status = 'active';
CREATE INDEX idx_inventory_batches_expiration_date ON inventory_batches(inventory_item_id, expiration_date) WHERE expiration_date IS NOT NULL;

-- Create index for stock tracking
CREATE INDEX idx_inventory_batches_quantity ON inventory_batches(inventory_item_id, quantity_available);

-- Add comments
COMMENT ON TABLE inventory_batches 'Each individual stock receipt with different pricing and expiration';

-- Add constraints
ALTER TABLE inventory_batches ADD CONSTRAINT chk_inventory_batches_cost CHECK (unit_cost > 0);
ALTER TABLE inventory_batches ADD CONSTRAINT chk_inventory_batches_quantity CHECK (quantity_received > 0);
ALTER TABLE inventory_batches ADD CONSTRAINT chk_inventory_batches_available CHECK (quantity_available >= 0);

-- Full table example:
-- id, inventory_item_id, batch_number, received_date, unit_cost, quantity_received, quantity_available, quantity_used, expiration_date, supplier_id, purchase_order_id, notes, batch_status, created_at, updated_at
-- UUID-12345, UUID-456, "VOD-750ML", "2024-10-25", 15.50, 50, 45, 5, "2024-10-25", supplier-123, "PO-456", "Initial premium batch", "active", "2024-10-25 14:30:00", "2024-10-25 14:30:00")