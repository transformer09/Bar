-- ======================================================================
-- INVENTORY_VALUATIONS - Track inventory value using different methods
-- Compares FIFO, LIFO, and Average Cost valuation methods
-- Used for financial reporting and cost analysis
-- ======================================================================

-- Table: inventory_valuations
CREATE TABLE IF NOT EXISTS inventory_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    valuation_date DATE NOT NULL,
    total_quantity DECIMAL NOT NULL CHECK (total_quantity >= 0),
    fifo_value DECIMAL NOT NULL CHECK (fifo_value >= 0),
    lifo_value DECIMAL NOT NULL CHECK (lifo_value >= 0),
    average_cost DECIMAL NOT NULL CHECK (average_cost >= 0),
    average_value DECIMAL NOT NULL CHECK (average_value >= 0),
    current_unit_cost DECIMAL NOT NULL CHECK (current_unit_cost > 0),
    fifo_unit_cost DECIMAL NOT NULL CHECK (fifo_unit_cost > 0),
    lifo_unit_cost DECIMAL NOT NULL CHECK (lifo_unit_cost > 0),
    lifo_minus_fifo_diff DECIMAL, -- Financial impact of using LIFO vs FIFO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_item_id, valuation_date)
);

-- Create indexes for efficient querying
CREATE INDEX idx_inventory_valuations_date ON inventory_valuations(valuation_date DESC);
CREATE INDEX idx_inventory_valuations_item ON inventory_valuations(inventory_item_id, valuation_date DESC);
CREATE INDEX idx_inventory_valuations_fifo ON inventory_valuations(fifo_value DESC);
CREATE INDEX idx_inventory_valuations_lifo ON inventory_valuations(lifo_value DESC);
CREATE INDEX idx_inventory_valuations_diff ON inventory_valuations(lifo_minus_fifo_diff DESC) WHERE lifo_minus_fifo_diff IS NOT NULL;

-- Add comments
COMMENT ON TABLE inventory_valuations 'Compares inventory value using FIFO, LIFO, and Average Cost methods';
COMMENT ON COLUMN inventory_valuations.lifo_minus_fifo_diff 'Positive = LIFO higher value, Negative = FIFO higher value';

-- Full table example:
-- id, inventory_item_id, valuation_date, total_quantity, fifo_value, lifo_value, average_cost, average_value, current_unit_cost, fifo_unit_cost, lifo_unit_cost, lifo_minus_fifo_diff, created_at, updated_at
-- UUID-12345, UUID-456, "2024-10-25", 95.0, 1572.50, 1592.00, 16.55, 1572.25, 16.75, 16.55, 16.76, 19.50, "2024-10-25 15:30:00", "2024-10-25 15:30:00"