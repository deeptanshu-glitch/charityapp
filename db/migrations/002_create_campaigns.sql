-- 002_create_campaigns.sql
-- Creates campaigns table with positive funding checks

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount >= 0),
    current_funding NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (current_funding >= 0),
    category VARCHAR(100) NOT NULL DEFAULT 'General Relief',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
