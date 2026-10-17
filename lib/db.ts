import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Global pool instance cache for Next.js hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/givetrack_db';

const pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    max: 20, // concurrency support
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbPool = pool;
}

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute a parameterized query with safe type casting.
 * Enforces parameterization (no concatenated SQL).
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`[DB SLOW QUERY] (${duration}ms): ${text.replace(/\s+/g, ' ').slice(0, 100)}`);
    }
    return res;
  } catch (error) {
    console.error(`[DB QUERY ERROR] SQL: ${text.replace(/\s+/g, ' ')}`, error);
    throw error;
  }
}

/**
 * Acquire a single client from the pool (must be released by caller).
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Execute work inside an isolated database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[DB] Failed to rollback transaction:', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
