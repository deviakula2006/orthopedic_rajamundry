import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool, types } = pg;

// By default node-postgres parses DATE columns into JS Date objects at local
// midnight, which then serialize to a different UTC calendar day for any
// timezone ahead of UTC (e.g. 2026-05-12 becomes 2026-05-11T18:30:00.000Z in
// IST). Returning the raw 'YYYY-MM-DD' string avoids that off-by-one bug —
// this app only ever needs calendar dates, never date+time instants, for
// DATE columns (last_visit_date, date_of_birth, appointment_date, bill_date).
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  // Fired on idle client errors (e.g. network drop) — never let it crash the process.
  logger.error({ err }, 'Unexpected error on idle Postgres client');
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  logger.debug({ text, duration: Date.now() - start, rows: result.rowCount }, 'db query');
  return result;
}

/**
 * Runs `fn` with a single client inside a transaction, committing on success
 * and rolling back on any thrown error. Use for any multi-statement write
 * (e.g. bill + bill_items, bed assign + admission history).
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
