import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  id, doctor_code, name, specialization, phone, email, status,
  availability_note, experience_years, created_at, updated_at
`;

export async function list({ limit, offset, search, status }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR specialization ILIKE $${params.length} OR doctor_code ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const whereSql = conditions.join(' AND ');

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM doctors WHERE ${whereSql}
     ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM doctors WHERE ${whereSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${BASE_SELECT} FROM doctors WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] ?? null;
}

export async function create({ name, specialization, phone, email, status, availabilityNote, experienceYears }) {
  const { rows } = await query(
    `INSERT INTO doctors (name, specialization, phone, email, status, availability_note, experience_years)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'Active')::staff_status, $6, $7)
     RETURNING ${BASE_SELECT}`,
    [name, specialization, phone, email ?? null, status ?? null, availabilityNote ?? null, experienceYears ?? null]
  );
  return rows[0];
}

export async function update(id, fields) {
  const clause = buildSetClause({
    name: fields.name,
    specialization: fields.specialization,
    phone: fields.phone,
    email: fields.email,
    status: fields.status,
    availability_note: fields.availabilityNote,
    experience_years: fields.experienceYears
  });
  if (!clause) return findById(id);

  const { rows } = await query(
    `UPDATE doctors SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1} AND deleted_at IS NULL
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id) : null;
}

export async function setStatus(id, status) {
  const { rows } = await query(
    `UPDATE doctors SET status = $2, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${BASE_SELECT}`,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function softDelete(id) {
  const { rows } = await query(
    `UPDATE doctors SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name`,
    [id]
  );
  return rows[0] ?? null;
}
