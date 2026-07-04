import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.resolve(__dirname, '../../../docs/seed.sql');

async function run() {
  if (env.isProduction && !process.argv.includes('--force')) {
    logger.error('Refusing to run dev seed data against a production environment. Pass --force to override.');
    process.exitCode = 1;
    return;
  }

  const sql = await fs.readFile(SEED_FILE, 'utf8');
  logger.info('Seeding database with development data...');
  await pool.query(sql); // seed.sql wraps itself in BEGIN/COMMIT
  logger.info('Seed complete. Dev login: admin / Admin@123 (see docs/seed.sql)');
}

run()
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
