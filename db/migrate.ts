import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/givetrack_db';

export async function runMigrations() {
  console.log(`[MIGRATIONS] Connecting to database: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Fetch applied migrations
    const appliedResult = await client.query('SELECT migration_name FROM schema_migrations');
    const appliedMigrations = new Set(appliedResult.rows.map((row) => row.migration_name));

    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`[MIGRATIONS] Found ${files.length} migration files in ${migrationsDir}`);

    let newlyAppliedCount = 0;

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`[MIGRATIONS] - ${file} (already applied)`);
        continue;
      }

      console.log(`[MIGRATIONS] > Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration inside a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[MIGRATIONS] [OK] Applied ${file}`);
        newlyAppliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATIONS] [ERROR] Failed to apply ${file}:`, err);
        throw err;
      }
    }

    console.log(`[MIGRATIONS] Completed. Applied ${newlyAppliedCount} new migration(s).`);
  } catch (error) {
    console.error('[MIGRATIONS] Migration process failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations();
}
