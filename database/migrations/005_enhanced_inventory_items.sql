-- ======================================================================
-- ENHANCED INVENTORY_ITEMS - Add FIFO/LIFO support to existing inventory_items
-- Adds valuation method preference and additional tracking fields
-- Modifies existing table to support advanced inventory features
-- ======================================================================

-- Add new columns to existing inventory_items table
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS valuation_method VARCHAR(20) DEFAULT 'fifo'
CHECK (valuation_method IN ('fifo', 'lifo', 'average_cost'));

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS reorder_point DECIMAL CHECK (reorder_point >= 0);

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS max_stock_level DECIMAL CHECK (max_stock_level >= 0);

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER CHECK (lead_time_days >= 0);

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS current_fifo_value DECIMAL CHECK (current_fifo_value >= 0);

ALTER TABLE IF EXISTS inventory_items ALTER COLUMN current_fifo_value SET DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS current_lifo_value DECIMAL CHECK (current_lifo_value >= 0);

ALTER TABLE IF EXISTS inventory_items ALTER COLUMN current_lifo_value SET DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS current_average_cost DECIMAL CHECK (current_average_cost > 0);

ALTER TABLE IF EXISTS inventory_items ALTER COLUMN current_average_cost SET DEFAULT 0;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS last_valuation_date DATE;

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS total_batches_count INTEGER DEFAULT 0 CHECK (total_batches_count >= 0);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_inventory_items_valuation_method ON inventory_items(valuation_method);
CREATE INDEX IF NOT EXISTS idx_inventory_items_reorder_point ON inventory_items(reorder_point) WHERE reorder_point IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_last_valuation ON inventory_items(last_valuation_date) WHERE last_valuation_date IS NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN inventory_items.valuation_method 'Preferred valuation method: FIFO, LIFO, or Average Cost';
COMMENT ON COLUMN inventory_items.reorder_point 'Stock level that triggers reorder alert';
COMMENT ON COLUMN inventory_items.max_stock_level 'Maximum stock level to prevent overstocking';
COMMENT ON COLUMN inventory_items.lead_time_days 'Days between ordering and receiving stock';
COMMENT ON COLUMN inventory_items.current_fifo_value 'Current inventory value using FIFO method';
COMMENT ON COLUMN inventory_items.current_lifo_value 'Current inventory value using LIFO method';
COMMENT ON COLUMN inventory_items.current_average_cost 'Current average cost per unit';
COMMENT ON COLUMN inventory_items.last_valuation_date 'Date when inventory was last valued';
COMMENT ON COLUMN inventory_items.total_batches_count 'Number of active batches for this item';

-- Update existing items to have default values
UPDATE inventory_items
SET
    valuation_method = 'fifo',
    current_fifo_value = 0,
    current_lifo_value = 0,
    current_average_cost = COALESCE(current_stock / NULLIF(current_stock, 0), 0),
    total_batches_count = 0
WHERE valuation_method IS NULL;