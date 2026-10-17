import { withTransaction, query } from './db';

export class InsufficientStockError extends Error {
  public available: number;
  public requested: number;

  constructor(available: number, requested: number) {
    super(
      `Insufficient inventory: Requested ${requested} units, but only ${available} units are currently available in this warehouse.`
    );
    this.name = 'InsufficientStockError';
    this.available = available;
    this.requested = requested;
  }
}

export class StockNotFoundError extends Error {
  constructor(warehouseId: string, itemId: string) {
    super(`Stock record not found for warehouse ${warehouseId} and item ${itemId}`);
    this.name = 'StockNotFoundError';
  }
}

export interface AllocateStockParams {
  campaignId: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  userId: string;
  notes?: string;
}

export interface TransferStockParams {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  reason: string;
}

/**
 * FEATURE 1: Atomic Stock Allocation
 * Executes as an isolated transaction with pessimistic row-level locking (SELECT ... FOR UPDATE).
 * Enforces negative stock prevention at both database CHECK constraint and application level.
 */
export async function allocateStock(params: AllocateStockParams) {
  const { campaignId, itemId, warehouseId, quantity, userId, notes } = params;

  if (quantity <= 0) {
    throw new Error('Allocation quantity must be greater than zero.');
  }

  return withTransaction(async (client) => {
    // 1. Acquire exclusive row lock on stock_levels with SELECT ... FOR UPDATE
    const lockResult = await client.query(
      `SELECT quantity FROM stock_levels
       WHERE warehouse_id = $1 AND item_id = $2
       FOR UPDATE`,
      [warehouseId, itemId]
    );

    if (lockResult.rowCount === 0) {
      throw new StockNotFoundError(warehouseId, itemId);
    }

    const currentQty = lockResult.rows[0].quantity;

    // 2. Application-level inventory balance check
    if (currentQty < quantity) {
      throw new InsufficientStockError(currentQty, quantity);
    }

    // 3. Decrement stock levels (guarded by DB CHECK (quantity >= 0))
    await client.query(
      `UPDATE stock_levels
       SET quantity = quantity - $1, updated_at = NOW()
       WHERE warehouse_id = $2 AND item_id = $3`,
      [quantity, warehouseId, itemId]
    );

    // 4. Record allocation to the campaign
    const allocResult = await client.query(
      `INSERT INTO allocations (campaign_id, item_id, warehouse_id, allocated_quantity, created_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, campaign_id, item_id, warehouse_id, allocated_quantity, created_by, created_at`,
      [campaignId, itemId, warehouseId, quantity, userId, notes || null]
    );

    // 5. Append to the immutable inventory audit log
    await client.query(
      `INSERT INTO inventory_transactions (item_id, warehouse_id, campaign_id, change, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        itemId,
        warehouseId,
        campaignId,
        -quantity,
        `Allocated to campaign ${campaignId}${notes ? `: ${notes}` : ''}`,
        userId,
      ]
    );

    return allocResult.rows[0];
  });
}

/**
 * FEATURE 1: Atomic Inter-Warehouse Transfer
 * Safely transfers inventory between two warehouses without deadlock risk.
 * Orders lock acquisition by warehouse_id to guarantee consistent lock ordering across concurrent transfers.
 */
export async function transferStock(params: TransferStockParams) {
  const { itemId, fromWarehouseId, toWarehouseId, quantity, userId, reason } = params;

  if (quantity <= 0) {
    throw new Error('Transfer quantity must be greater than zero.');
  }

  if (fromWarehouseId === toWarehouseId) {
    throw new Error('Source and destination warehouses must be different.');
  }

  return withTransaction(async (client) => {
    // Acquire locks in deterministic alphabetical order to prevent deadlock between concurrent transfers
    const [firstLockWh, secondLockWh] = [fromWarehouseId, toWarehouseId].sort();

    const lockedRows = await client.query(
      `SELECT warehouse_id, quantity FROM stock_levels
       WHERE item_id = $1 AND warehouse_id IN ($2, $3)
       ORDER BY warehouse_id ASC
       FOR UPDATE`,
      [itemId, firstLockWh, secondLockWh]
    );

    const fromRow = lockedRows.rows.find((r) => r.warehouse_id === fromWarehouseId);
    if (!fromRow) {
      throw new StockNotFoundError(fromWarehouseId, itemId);
    }

    if (fromRow.quantity < quantity) {
      throw new InsufficientStockError(fromRow.quantity, quantity);
    }

    // Decrement source warehouse
    await client.query(
      `UPDATE stock_levels
       SET quantity = quantity - $1, updated_at = NOW()
       WHERE warehouse_id = $2 AND item_id = $3`,
      [quantity, fromWarehouseId, itemId]
    );

    // Increment destination warehouse (or initialize if doesn't exist yet)
    await client.query(
      `INSERT INTO stock_levels (warehouse_id, item_id, quantity, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (warehouse_id, item_id)
       DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity, updated_at = NOW()`,
      [toWarehouseId, itemId, quantity]
    );

    // Audit log: source deduction
    await client.query(
      `INSERT INTO inventory_transactions (item_id, warehouse_id, change, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        itemId,
        fromWarehouseId,
        -quantity,
        `Inter-warehouse transfer out to ${toWarehouseId}: ${reason}`,
        userId,
      ]
    );

    // Audit log: destination addition
    await client.query(
      `INSERT INTO inventory_transactions (item_id, warehouse_id, change, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        itemId,
        toWarehouseId,
        quantity,
        `Inter-warehouse transfer in from ${fromWarehouseId}: ${reason}`,
        userId,
      ]
    );

    return { success: true, transferred: quantity, itemId, fromWarehouseId, toWarehouseId };
  });
}

/**
 * Fetch stock overview across all warehouses and items.
 */
export async function getInventoryOverview() {
  const result = await query(`
    SELECT 
      sl.warehouse_id,
      w.name AS warehouse_name,
      w.location AS warehouse_location,
      sl.item_id,
      i.name AS item_name,
      i.sku AS item_sku,
      i.category AS item_category,
      i.unit AS item_unit,
      sl.quantity,
      sl.updated_at
    FROM stock_levels sl
    JOIN warehouses w ON sl.warehouse_id = w.id
    JOIN inventory_items i ON sl.item_id = i.id
    ORDER BY w.name ASC, i.name ASC
  `);
  return result.rows;
}

/**
 * Fetch inventory audit transactions with joined metadata.
 */
export async function getInventoryTransactions(limit = 50) {
  const result = await query(
    `
    SELECT 
      t.id,
      t.item_id,
      i.name AS item_name,
      i.sku AS item_sku,
      t.warehouse_id,
      w.name AS warehouse_name,
      t.campaign_id,
      c.title AS campaign_title,
      t.change,
      t.reason,
      t.created_by,
      u.name AS created_by_name,
      t.created_at
    FROM inventory_transactions t
    JOIN inventory_items i ON t.item_id = i.id
    JOIN warehouses w ON t.warehouse_id = w.id
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT $1
  `,
    [limit]
  );
  return result.rows;
}

/**
 * Fetch allocations made to a specific campaign.
 */
export async function getCampaignAllocations(campaignId: string) {
  const result = await query(
    `
    SELECT 
      a.id,
      a.campaign_id,
      a.item_id,
      i.name AS item_name,
      i.sku AS item_sku,
      i.unit AS item_unit,
      a.warehouse_id,
      w.name AS warehouse_name,
      a.allocated_quantity,
      a.notes,
      a.created_at,
      u.name AS created_by_name
    FROM allocations a
    JOIN inventory_items i ON a.item_id = i.id
    JOIN warehouses w ON a.warehouse_id = w.id
    JOIN users u ON a.created_by = u.id
    WHERE a.campaign_id = $1
    ORDER BY a.created_at DESC
  `,
    [campaignId]
  );
  return result.rows;
}
