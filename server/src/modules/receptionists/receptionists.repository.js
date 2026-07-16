import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  id, receptionist_code, name, phone, email, status, shift, user_id, created_at, updated_at
`;

export async function list({ limit, offset, search }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR receptionist_code ILIKE $${params.length})`);
  }

  const whereSql = conditions.join(' AND ');

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM receptionists WHERE ${whereSql}
     ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM receptionists WHERE ${whereSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM receptionists WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] ?? null;
}

export async function create({ name, phone, email, status, shift, userId }, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO receptionists (name, phone, email, status, shift, user_id)
     VALUES ($1, $2, $3, COALESCE($4, 'Active')::staff_status, $5, $6)
     RETURNING ${BASE_SELECT}`,
    [name, phone, email ?? null, status ?? null, shift ?? null, userId ?? null]
  );
  return rows[0];
}

export async function update(id, fields, client) {
  const q = client ? client.query.bind(client) : query;
  const clause = buildSetClause({
    name: fields.name,
    phone: fields.phone,
    email: fields.email,
    status: fields.status,
    shift: fields.shift
  });
  if (!clause) return findById(id, client);

  const { rows } = await q(
    `UPDATE receptionists SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1} AND deleted_at IS NULL
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id, client) : null;
}

export async function softDelete(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE receptionists SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name`,
    [id]
  );
  return rows[0] ?? null;
}
