-- 004_create_ledger.sql
-- Creates immutable donation ledger and triggers for immutability and campaign funding synchronization

CREATE TABLE IF NOT EXISTS donation_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to make donation_ledger strictly immutable (No UPDATE or DELETE)
CREATE OR REPLACE FUNCTION prevent_donation_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'donation_ledger is strictly immutable. UPDATE and DELETE operations are prohibited. Corrections must be made via reversing credit/debit entries.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_donation_ledger_mod ON donation_ledger;
CREATE TRIGGER trg_prevent_donation_ledger_mod
BEFORE UPDATE OR DELETE ON donation_ledger
FOR EACH ROW
EXECUTE FUNCTION prevent_donation_ledger_modification();

-- Trigger function to automatically keep campaigns.current_funding in sync upon INSERT
CREATE OR REPLACE FUNCTION sync_campaign_funding_from_ledger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'credit' THEN
        UPDATE campaigns
        SET current_funding = current_funding + NEW.amount
        WHERE id = NEW.campaign_id;
    ELSIF NEW.type = 'debit' THEN
        UPDATE campaigns
        SET current_funding = current_funding - NEW.amount
        WHERE id = NEW.campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_campaign_funding ON donation_ledger;
CREATE TRIGGER trg_sync_campaign_funding
AFTER INSERT ON donation_ledger
FOR EACH ROW
EXECUTE FUNCTION sync_campaign_funding_from_ledger();
