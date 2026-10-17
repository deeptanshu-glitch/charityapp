import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { allocateStock, InsufficientStockError } from '../../lib/inventory';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/givetrack_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 25, // Large pool to allow true concurrent connections
});

async function runConcurrencyTest() {
  console.log('='.repeat(70));
  console.log(' GIVETRACK CONCURRENCY & TRANSACTION ISOLATION TEST');
  console.log(' Testing pessimistic row-level locking (SELECT ... FOR UPDATE)');
  console.log(' and database CHECK (quantity >= 0) constraint guarantees.');
  console.log('='.repeat(70));

  const client = await pool.connect();

  try {
    // 1. Setup isolated test entities
    console.log('\n[1/4] Initializing test entities...');

    // Test Campaign
    const campRes = await client.query(`
      INSERT INTO campaigns (title, description, target_amount, current_funding, category)
      VALUES ('Concurrency Stress Test Campaign', 'Automated test suite fixture', 100000.00, 50000.00, 'Test')
      RETURNING id
    `);
    const campaignId = campRes.rows[0].id;

    // Test Warehouse
    const whRes = await client.query(`
      INSERT INTO warehouses (name, location)
      VALUES ('Stress Test Warehouse', 'Automated Isolation Sandbox')
      RETURNING id
    `);
    const warehouseId = whRes.rows[0].id;

    // Test Inventory Item
    const itemRes = await client.query(`
      INSERT INTO inventory_items (name, sku, unit, category)
      VALUES ('Stress Test Sterile Gauze', 'TEST-GAUZE-${Date.now()}', 'box', 'Test')
      RETURNING id
    `);
    const itemId = itemRes.rows[0].id;

    // Test User (Volunteer)
    const userRes = await client.query(`
      SELECT id FROM users WHERE role = 'volunteer' LIMIT 1
    `);
    const userId = userRes.rows[0]?.id || (await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('test-runner-${Date.now()}@test.org', 'mock_hash', 'Concurrency Tester', 'volunteer')
      RETURNING id
    `)).rows[0].id;

    // Initial stock setup: EXACTLY 50 units
    const INITIAL_STOCK = 50;
    const DEMAND_PER_REQUEST = 10;
    const CONCURRENT_REQUESTS = 20; // 20 requests * 10 units = 200 total demand (400% of available stock!)

    await client.query(`
      INSERT INTO stock_levels (warehouse_id, item_id, quantity)
      VALUES ($1, $2, $3)
    `, [warehouseId, itemId, INITIAL_STOCK]);

    console.log(`[+] Test fixture established:`);
    console.log(`    - Initial Stock: ${INITIAL_STOCK} units`);
    console.log(`    - Concurrent Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`    - Units per Request: ${DEMAND_PER_REQUEST}`);
    console.log(`    - Total Aggregated Demand: ${CONCURRENT_REQUESTS * DEMAND_PER_REQUEST} units`);

    // 2. Launch concurrent workers simultaneously
    console.log('\n[2/4] Firing 20 parallel transactions with SELECT ... FOR UPDATE...');
    const startTime = Date.now();

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
      return allocateStock({
        campaignId,
        itemId,
        warehouseId,
        quantity: DEMAND_PER_REQUEST,
        userId,
        notes: `Concurrent worker thread #${i + 1}`,
      });
    });

    const results = await Promise.allSettled(promises);
    const durationMs = Date.now() - startTime;

    console.log(`[+] All ${CONCURRENT_REQUESTS} requests completed in ${durationMs}ms`);

    // 3. Analyze transaction outcomes
    console.log('\n[3/4] Analyzing transaction results...');
    let successCount = 0;
    let failureCount = 0;
    const errorReasons: Record<string, number> = {};

    for (const r of results) {
      if (r.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        const errName = r.reason?.name || 'Error';
        errorReasons[errName] = (errorReasons[errName] || 0) + 1;
      }
    }

    console.log(`    - Successful Allocations: ${successCount} (expected: ${INITIAL_STOCK / DEMAND_PER_REQUEST})`);
    console.log(`    - Rejected (Insufficient Stock): ${failureCount} (expected: ${CONCURRENT_REQUESTS - (INITIAL_STOCK / DEMAND_PER_REQUEST)})`);
    console.log('    - Handled Error Types:', errorReasons);

    // 4. Verify Database Integrity & Conservation of Mass
    console.log('\n[4/4] Verifying database invariants and constraints...');

    const stockCheck = await client.query(`
      SELECT quantity FROM stock_levels WHERE warehouse_id = $1 AND item_id = $2
    `, [warehouseId, itemId]);
    const finalStock = stockCheck.rows[0].quantity;

    const allocCheck = await client.query(`
      SELECT COALESCE(SUM(allocated_quantity), 0) as total_allocated
      FROM allocations
      WHERE warehouse_id = $1 AND item_id = $2
    `, [warehouseId, itemId]);
    const totalAllocated = parseInt(allocCheck.rows[0].total_allocated, 10);

    const auditCheck = await client.query(`
      SELECT COALESCE(SUM(-change), 0) as total_audited
      FROM inventory_transactions
      WHERE warehouse_id = $1 AND item_id = $2 AND change < 0
    `, [warehouseId, itemId]);
    const totalAudited = parseInt(auditCheck.rows[0].total_audited, 10);

    console.log(`    - Final Stock Level in DB: ${finalStock} units`);
    console.log(`    - Total Units in Allocations Table: ${totalAllocated} units`);
    console.log(`    - Total Units in Audit Log Table: ${totalAudited} units`);

    // Clean up test data
    await client.query('DELETE FROM allocations WHERE warehouse_id = $1', [warehouseId]);
    await client.query('DELETE FROM inventory_transactions WHERE warehouse_id = $1', [warehouseId]);
    await client.query('DELETE FROM stock_levels WHERE warehouse_id = $1', [warehouseId]);
    await client.query('DELETE FROM inventory_items WHERE id = $1', [itemId]);
    await client.query('DELETE FROM warehouses WHERE id = $1', [warehouseId]);
    await client.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);

    // Validation assertions
    console.log('\n' + '-'.repeat(70));
    console.log(' TEST VERIFICATION SUMMARY:');
    console.log('-'.repeat(70));

    const check1 = finalStock >= 0;
    const check2 = finalStock === 0;
    const check3 = successCount === INITIAL_STOCK / DEMAND_PER_REQUEST;
    const check4 = totalAllocated === INITIAL_STOCK;
    const check5 = totalAudited === totalAllocated;
    const check6 = INITIAL_STOCK === finalStock + totalAllocated;

    console.log(` [${check1 ? 'PASS' : 'FAIL'}] Invariant 1: Stock NEVER dropped below zero (Final: ${finalStock})`);
    console.log(` [${check2 ? 'PASS' : 'FAIL'}] Invariant 2: Stock depleted accurately to zero without over-allocation`);
    console.log(` [${check3 ? 'PASS' : 'FAIL'}] Invariant 3: Exactly ${INITIAL_STOCK / DEMAND_PER_REQUEST} transactions succeeded out of ${CONCURRENT_REQUESTS}`);
    console.log(` [${check4 ? 'PASS' : 'FAIL'}] Invariant 4: Total allocated units (${totalAllocated}) matches stock consumed`);
    console.log(` [${check5 ? 'PASS' : 'FAIL'}] Invariant 5: Audit log units (${totalAudited}) matches allocation table`);
    console.log(` [${check6 ? 'PASS' : 'FAIL'}] Invariant 6: Conservation of Mass: Initial = Final + Allocated`);
    console.log('-'.repeat(70));

    if (check1 && check2 && check3 && check4 && check5 && check6) {
      console.log(' >>> SUCCESS: ALL CONCURRENCY & TRANSACTION TESTS PASSED! <<< \n');
      process.exit(0);
    } else {
      console.error(' >>> FAILURE: ONE OR MORE CONCURRENCY CHECKS FAILED! <<< \n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error in concurrency test suite:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runConcurrencyTest();
