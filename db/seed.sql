-- db/seed.sql
-- Seed realistic demo dataset for GiveTrack portfolio showcase

-- Clean existing data in reverse dependency order
TRUNCATE TABLE disbursement_requests, donation_ledger, inventory_transactions, allocations, stock_levels, inventory_items, warehouses, campaigns, users CASCADE;

-- 1. SEED USERS
-- Password for all demo accounts: Password123!
-- Bcrypt hash generated with cost 10: $2a$10$tvUPsCowkpYsUTzfAjaxQuPmx51P9il/P20nX.Zs3NO6A32UTGlVG
INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@givetrack.org', '$2a$10$tvUPsCowkpYsUTzfAjaxQuPmx51P9il/P20nX.Zs3NO6A32UTGlVG', 'Sarah Jenkins (Director of Ops)', 'admin', NOW() - INTERVAL '60 days'),
('22222222-2222-2222-2222-222222222222', 'volunteer@givetrack.org', '$2a$10$tvUPsCowkpYsUTzfAjaxQuPmx51P9il/P20nX.Zs3NO6A32UTGlVG', 'Marcus Vance (Field Logistics)', 'volunteer', NOW() - INTERVAL '45 days'),
('33333333-3333-3333-3333-333333333333', 'donor@givetrack.org', '$2a$10$tvUPsCowkpYsUTzfAjaxQuPmx51P9il/P20nX.Zs3NO6A32UTGlVG', 'Elena Rostova (Global Philanthropist)', 'donor', NOW() - INTERVAL '30 days');

-- 2. SEED WAREHOUSES
INSERT INTO warehouses (id, name, location, created_at) VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Central Logistics Hub - Chicago', 'Chicago, IL (Midwest Distribution Center)', NOW() - INTERVAL '90 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coastal Relief Depot - Seattle', 'Seattle, WA (Pacific Northwest Port)', NOW() - INTERVAL '90 days');

-- 3. SEED INVENTORY ITEMS
INSERT INTO inventory_items (id, name, sku, category, unit, created_at) VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Thermal Emergency Blankets', 'MED-BLK-001', 'Shelter & Bedding', 'pack (10)', NOW() - INTERVAL '80 days'),
('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ready-to-Use Therapeutic Food (RUTF)', 'NUT-RTF-102', 'Nutrition', 'box (50)', NOW() - INTERVAL '80 days'),
('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Field Surgical First Aid Kits', 'MED-FAK-205', 'Medical Supplies', 'kit', NOW() - INTERVAL '80 days'),
('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Water Purification Filtration Units', 'WTR-FLT-309', 'Clean Water', 'pump unit', NOW() - INTERVAL '80 days'),
('bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Solar LED Emergency Lanterns', 'PWR-LNT-412', 'Power & Lighting', 'lantern', NOW() - INTERVAL '80 days');

-- 4. SEED STOCK LEVELS
INSERT INTO stock_levels (warehouse_id, item_id, quantity, updated_at) VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 850, NOW() - INTERVAL '20 days'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1200, NOW() - INTERVAL '20 days'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 320, NOW() - INTERVAL '20 days'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 450, NOW() - INTERVAL '20 days'),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 600, NOW() - INTERVAL '20 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 400, NOW() - INTERVAL '20 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 650, NOW() - INTERVAL '20 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 180, NOW() - INTERVAL '20 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 290, NOW() - INTERVAL '20 days'),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 350, NOW() - INTERVAL '20 days');

-- 5. SEED INITIAL INVENTORY AUDIT TRANSACTIONS
INSERT INTO inventory_transactions (item_id, warehouse_id, campaign_id, change, reason, created_by, created_at) VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 1000, 'Initial supplier intake - Contract #8821', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 1500, 'Bulk nutrition shipment from UNICEF depot', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 400, 'Red Cross donation intake', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 500, 'Global Water Trust grant donation', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
('bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 700, 'Green Energy Relief Foundation grant', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days');

-- 6. SEED CAMPAIGNS
-- Initial current_funding is 0.00; inserting into donation_ledger below triggers synchronization automatically!
INSERT INTO campaigns (id, title, description, target_amount, current_funding, category, created_at) VALUES
('c1111111-cccc-cccc-cccc-cccccccccccc', 'Emergency Winter Relief 2024', 'Providing rapid warmth, thermal bedding, and nutritional assistance to communities displaced by extreme cold weather.', 150000.00, 0.00, 'Disaster Relief', NOW() - INTERVAL '25 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', 'Clean Water Access Initiative', 'Deploying industrial-grade gravity water filters and rapid purification tablets to flood-affected coastal regions.', 80000.00, 0.00, 'Sanitation & Health', NOW() - INTERVAL '20 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', 'Mobile Pediatric Medical Clinics', 'Funding mobile clinics, essential antibiotics, child vaccinations, and trauma care in underserved rural districts.', 200000.00, 0.00, 'Medical Infrastructure', NOW() - INTERVAL '15 days');

-- 7. SEED ALLOCATIONS
INSERT INTO allocations (id, campaign_id, item_id, warehouse_id, allocated_quantity, created_by, notes, created_at) VALUES
('d1111111-dddd-dddd-dddd-dddddddddddd', 'c1111111-cccc-cccc-cccc-cccccccccccc', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 150, '22222222-2222-2222-2222-222222222222', 'Direct deployment to Northern shelter camps', NOW() - INTERVAL '18 days'),
('d2222222-dddd-dddd-dddd-dddddddddddd', 'c2222222-cccc-cccc-cccc-cccccccccccc', 'bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, '22222222-2222-2222-2222-222222222222', 'Dispatched to riverside village community wells', NOW() - INTERVAL '12 days'),
('d3333333-dddd-dddd-dddd-dddddddddddd', 'c3333333-cccc-cccc-cccc-cccccccccccc', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 80, '22222222-2222-2222-2222-222222222222', 'Equipping mobile emergency van #1 and #2', NOW() - INTERVAL '8 days');

-- Deduct allocated stock from audit log
INSERT INTO inventory_transactions (item_id, warehouse_id, campaign_id, change, reason, created_by, created_at) VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-cccc-cccc-cccc-cccccccccccc', -150, 'Allocation to Emergency Winter Relief 2024', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '18 days'),
('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-cccc-cccc-cccc-cccccccccccc', -50, 'Allocation to Clean Water Access Initiative', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '12 days'),
('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-cccc-cccc-cccc-cccccccccccc', -80, 'Allocation to Mobile Pediatric Medical Clinics', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days');

-- 8. SEED DONATION LEDGER (25 entries: credits and approved debits)
-- Note: Trigger trg_sync_campaign_funding will automatically update campaigns.current_funding
INSERT INTO donation_ledger (campaign_id, donor_id, amount, type, description, created_at) VALUES
-- Campaign 1: Emergency Winter Relief (Credits)
('c1111111-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 25000.00, 'credit', 'Major seed gift - Winter shelter initiative', NOW() - INTERVAL '24 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 12500.00, 'credit', 'Anonymous community matching challenge', NOW() - INTERVAL '22 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 15000.00, 'credit', 'Secondary donation for emergency heating units', NOW() - INTERVAL '19 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 8400.00, 'credit', 'Rotary Club of Chicago seasonal drive', NOW() - INTERVAL '17 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 3200.00, 'credit', 'Online recurring donor pool (28 donors)', NOW() - INTERVAL '15 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 20000.00, 'credit', 'High-impact philanthropic grant', NOW() - INTERVAL '10 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 4500.00, 'credit', 'Local corporate matching grant', NOW() - INTERVAL '6 days'),

-- Campaign 1: Debits (Approved logistics and supply outlays)
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 18500.00, 'debit', 'Disbursement #101: Bulk purchase of 1,200 thermal insulated coats', NOW() - INTERVAL '18 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 9200.00, 'debit', 'Disbursement #102: Freight and cross-country convoy transport', NOW() - INTERVAL '14 days'),
('c1111111-cccc-cccc-cccc-cccccccccccc', NULL, 6400.00, 'debit', 'Disbursement #103: Temporary emergency warming center site lease', NOW() - INTERVAL '8 days'),

-- Campaign 2: Clean Water Access Initiative (Credits)
('c2222222-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 18000.00, 'credit', 'Initial foundation commitment for safe drinking water', NOW() - INTERVAL '19 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', NULL, 14200.00, 'credit', 'Regional eco-conservation consortium donation', NOW() - INTERVAL '16 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', NULL, 6750.00, 'credit', 'University student fundraising marathon', NOW() - INTERVAL '13 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 10000.00, 'credit', 'Supplemental equipment funding pledge', NOW() - INTERVAL '9 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', NULL, 5300.00, 'credit', 'Community micro-donations via web portal', NOW() - INTERVAL '4 days'),

-- Campaign 2: Debits
('c2222222-cccc-cccc-cccc-cccccccccccc', NULL, 11400.00, 'debit', 'Disbursement #201: Procurement of 150 gravity ceramic water filters', NOW() - INTERVAL '15 days'),
('c2222222-cccc-cccc-cccc-cccccccccccc', NULL, 7800.00, 'debit', 'Disbursement #202: Well drilling technical inspection and soil assay', NOW() - INTERVAL '7 days'),

-- Campaign 3: Mobile Pediatric Medical Clinics (Credits)
('c3333333-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 45000.00, 'credit', 'Anchor endowment for mobile clinic fleet', NOW() - INTERVAL '14 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', NULL, 28000.00, 'credit', 'Healthcare for All Philanthropy Foundation', NOW() - INTERVAL '12 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', NULL, 16500.00, 'credit', 'Physicians Association annual benefit gala', NOW() - INTERVAL '10 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 15000.00, 'credit', 'Direct pediatric vaccine supply matching grant', NOW() - INTERVAL '5 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', NULL, 9200.00, 'credit', 'Grassroots medical aid campaign contributions', NOW() - INTERVAL '2 days'),

-- Campaign 3: Debits
('c3333333-cccc-cccc-cccc-cccccccccccc', NULL, 32000.00, 'debit', 'Disbursement #301: Down payment on two customized emergency medical vans', NOW() - INTERVAL '11 days'),
('c3333333-cccc-cccc-cccc-cccccccccccc', NULL, 14500.00, 'debit', 'Disbursement #302: Essential pediatric pharmaceuticals and cold-chain vaccine storage', NOW() - INTERVAL '6 days');

-- 9. SEED DISBURSEMENT REQUESTS (Including pending ones for Admin review demo)
INSERT INTO disbursement_requests (id, campaign_id, amount, description, status, requested_by, reviewed_by, review_notes, created_at, updated_at) VALUES
('e1111111-eeee-eeee-eeee-eeeeeeeeeeee', 'c1111111-cccc-cccc-cccc-cccccccccccc', 18500.00, 'Bulk purchase of 1,200 thermal insulated coats', 'approved', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Verified wholesale invoice with supplier.', NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days'),
('e2222222-eeee-eeee-eeee-eeeeeeeeeeee', 'c1111111-cccc-cccc-cccc-cccccccccccc', 9200.00, 'Freight and cross-country convoy transport', 'approved', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Approved logistics fuel and vehicle manifest.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
-- PENDING REQUESTS FOR DEMO
('e3333333-eeee-eeee-eeee-eeeeeeeeeeee', 'c1111111-cccc-cccc-cccc-cccccccccccc', 8500.00, 'Emergency fuel and generator replenishment for shelter zone 4', 'pending', '22222222-2222-2222-2222-222222222222', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('e4444444-eeee-eeee-eeee-eeeeeeeeeeee', 'c2222222-cccc-cccc-cccc-cccccccccccc', 4200.00, 'Replacement ultrafiltration membranes for 30 community stations', 'pending', '22222222-2222-2222-2222-222222222222', NULL, NULL, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
('e5555555-eeee-eeee-eeee-eeeeeeeeeeee', 'c3333333-cccc-cccc-cccc-cccccccccccc', 12800.00, 'Diagnostic ultrasound and point-of-care hemoglobin testing kits', 'pending', '22222222-2222-2222-2222-222222222222', NULL, NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours');
