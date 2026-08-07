import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '../../../docs');

// Ordered list of DDL files to apply. `docs/schema.sql` is the single source
// of truth for the schema (see docs/DATABASE_SCHEMA.md) — future structural
// changes should be added here as new files rather than editing schema.sql
// in place, once it has run against a real environment.
const MIGRATIONS = ['schema.sql', '0002_hospital_settings.sql', '0003_doctor_consultations.sql', '0004_appointment_conflict_fix.sql', '0005_bed_management_rewrite.sql'];

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function run() {
  await ensureMigrationsTable();

  for (const name of MIGRATIONS) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (rows.length > 0) {
      logger.info(`Skipping already-applied migration: ${name}`);
      continue;
    }

    const filePath = path.join(DOCS_DIR, name);
    const sql = await fs.readFile(filePath, 'utf8');
    logger.info(`Applying migration: ${name}`);
    await pool.query(sql); // schema.sql wraps itself in BEGIN/COMMIT
    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    logger.info(`Applied migration: ${name}`);
  }

  logger.info('All migrations applied');
}

run()
  .catch((err) => {
    logger.error({ err }, 'Migration failed');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
