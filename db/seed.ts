import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/givetrack_db';

export async function runSeed() {
  console.log(`[SEED] Connecting to database: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    const seedFile = path.resolve(__dirname, 'seed.sql');
    if (!fs.existsSync(seedFile)) {
      throw new Error(`seed.sql not found at ${seedFile}`);
    }

    console.log('[SEED] Reading seed.sql...');
    const sql = fs.readFileSync(seedFile, 'utf-8');

    console.log('[SEED] Executing seed SQL statements...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('[SEED] Successfully seeded database with realistic demo dataset!');
  } catch (error) {
    console.error('[SEED] Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  runSeed();
}
