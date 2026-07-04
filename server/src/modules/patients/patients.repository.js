import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  id, patient_code, name, age, date_of_birth, gender, phone, address,
  blood_group, primary_diagnosis, last_visit_date, created_at, updated_at
`;

export async function list({ limit, offset, search }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length} OR patient_code ILIKE $${params.length})`);
  }

  const whereSql = conditions.join(' AND ');

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM patients WHERE ${whereSql}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM patients WHERE ${whereSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id) {
  const { rows } = await query(`SELECT ${BASE_SELECT} FROM patients WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] ?? null;
}

export async function create({ name, age, dateOfBirth, gender, phone, address, bloodGroup, diagnosis, lastVisitDate }) {
  const { rows } = await query(
    `INSERT INTO patients (name, age, date_of_birth, gender, phone, address, blood_group, primary_diagnosis, last_visit_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${BASE_SELECT}`,
    [name, age ?? null, dateOfBirth ?? null, gender, phone, address ?? null, bloodGroup ?? null, diagnosis ?? null, lastVisitDate ?? null]
  );
  return rows[0];
}

export async function update(id, fields) {
  const clause = buildSetClause({
    name: fields.name,
    age: fields.age,
    date_of_birth: fields.dateOfBirth,
    gender: fields.gender,
    phone: fields.phone,
    address: fields.address,
    blood_group: fields.bloodGroup,
    primary_diagnosis: fields.diagnosis,
    last_visit_date: fields.lastVisitDate
  });
  if (!clause) return findById(id);

  const { rows } = await query(
    `UPDATE patients SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1} AND deleted_at IS NULL
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id) : null;
}

export async function softDelete(id) {
  const { rows } = await query(
    `UPDATE patients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name`,
    [id]
  );
  return rows[0] ?? null;
}
