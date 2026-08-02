import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const DOCS_DIR = path.resolve(__dirname, '../../docs');

// Mirrors the MIGRATIONS list in src/db/migrate.js — keep both in sync.
const MIGRATIONS = ['schema.sql', '0002_hospital_settings.sql', '0003_doctor_consultations.sql'];

/**
 * Runs once before the whole test suite: recreates the test database from
 * scratch and applies every migration + docs/seed.sql, so tests exercise the
 * exact same DDL used in development/production rather than a mocked layer.
 */
export default async function globalSetup() {
  const testUrl = new URL(process.env.DATABASE_URL);
  const dbName = testUrl.pathname.slice(1);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  const adminClient = new pg.Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  const pool = new pg.Pool({ connectionString: testUrl.toString() });
  for (const migration of MIGRATIONS) {
    const sql = await fs.readFile(path.join(DOCS_DIR, migration), 'utf8');
    await pool.query(sql);
  }
  const seedSql = await fs.readFile(path.join(DOCS_DIR, 'seed.sql'), 'utf8');
  await pool.query(seedSql);
  await pool.end();
}
