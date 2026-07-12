import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  id, investigation_code, test_name, category, price, is_active, created_at, updated_at
`;

export async function list({ limit, offset, search, category, includeInactive }) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('is_active = TRUE');
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(test_name ILIKE $${params.length} OR investigation_code ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM investigations ${whereSql}
     ORDER BY test_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM investigations ${whereSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${BASE_SELECT} FROM investigations WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create({ testName, category, price, isActive }) {
  const { rows } = await query(
    `INSERT INTO investigations (test_name, category, price, is_active)
     VALUES ($1, $2, $3, COALESCE($4, TRUE))
     RETURNING ${BASE_SELECT}`,
    [testName, category, price, isActive ?? null]
  );
  return rows[0];
}

export async function update(id, fields) {
  const clause = buildSetClause({
    test_name: fields.testName,
    category: fields.category,
    price: fields.price,
    is_active: fields.isActive
  });
  if (!clause) return findById(id);

  const { rows } = await query(
    `UPDATE investigations SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1}
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id) : null;
}

export async function deactivate(id) {
  const { rows } = await query(
    `UPDATE investigations SET is_active = FALSE, updated_at = now() WHERE id = $1 RETURNING id, test_name`,
    [id]
  );
  return rows[0] ?? null;
}
