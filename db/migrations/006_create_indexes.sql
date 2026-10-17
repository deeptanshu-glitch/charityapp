-- 006_create_indexes.sql
-- Creates performance and foreign key indexes, including the composite index for ledger window function queries

-- Donation ledger composite index for campaign timeline and rolling balance window queries
CREATE INDEX IF NOT EXISTS idx_donation_ledger_campaign_created ON donation_ledger(campaign_id, created_at, id);
CREATE INDEX IF NOT EXISTS idx_donation_ledger_donor_id ON donation_ledger(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_ledger_created_at ON donation_ledger(created_at DESC);

-- Allocations foreign key indexes
CREATE INDEX IF NOT EXISTS idx_allocations_campaign_id ON allocations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_allocations_item_id ON allocations(item_id);
CREATE INDEX IF NOT EXISTS idx_allocations_warehouse_id ON allocations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_allocations_created_by ON allocations(created_by);

-- Stock levels item index (composite PK already has warehouse_id first)
CREATE INDEX IF NOT EXISTS idx_stock_levels_item_id ON stock_levels(item_id);

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item_warehouse ON inventory_transactions(item_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_campaign_id ON inventory_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created_at ON inventory_transactions(created_at DESC);

-- Disbursement requests indexes
CREATE INDEX IF NOT EXISTS idx_disbursements_campaign_id ON disbursement_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_requested_by ON disbursement_requests(requested_by);
