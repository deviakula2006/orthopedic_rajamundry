import { query } from '../../config/db.js';

const BASE_SELECT = `
  b.id, b.bed_no, b.status, b.created_at, b.updated_at,
  w.id AS ward_id, w.name AS ward_name, w.bed_type,
  p.id AS patient_id, p.patient_code, p.name AS patient_name
`;

const BASE_FROM = `
  FROM beds b
  JOIN wards w ON w.id = b.ward_id
  LEFT JOIN patients p ON p.id = b.current_patient_id
`;

export async function list({ wardId, status }) {
  const conditions = [];
  const params = [];

  if (wardId) {
    params.push(wardId);
    conditions.push(`b.ward_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`b.status = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT ${BASE_SELECT} ${BASE_FROM} ${whereSql} ORDER BY b.bed_no ASC`, params);
  return rows;
}

export async function findById(id, client = { query }) {
  const { rows } = await client.query(`SELECT ${BASE_SELECT} ${BASE_FROM} WHERE b.id = $1`, [id]);
  return rows[0] ?? null;
}

/** Locks the bed row for update within an existing transaction client. */
export async function lockById(id, client) {
  const { rows } = await client.query(
    'SELECT id, bed_no, status, current_patient_id FROM beds WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] ?? null;
}

export async function occupy(id, patientId, client) {
  await client.query(
    `UPDATE beds SET status = 'Occupied', current_patient_id = $2, updated_at = now() WHERE id = $1`,
    [id, patientId]
  );
}

export async function vacate(id, client) {
  await client.query(
    `UPDATE beds SET status = 'Available', current_patient_id = NULL, updated_at = now() WHERE id = $1`,
    [id]
  );
}

export async function insertAdmission(bedId, patientId, client) {
  await client.query('INSERT INTO bed_admissions (bed_id, patient_id) VALUES ($1, $2)', [bedId, patientId]);
}

export async function closeActiveAdmission(bedId, client) {
  await client.query(
    `UPDATE bed_admissions SET discharged_at = now() WHERE bed_id = $1 AND discharged_at IS NULL`,
    [bedId]
  );
}

export async function listAdmissionHistory(bedId) {
  const { rows } = await query(
    `SELECT ba.id, ba.patient_id, p.name AS patient_name, p.patient_code, ba.admitted_at, ba.discharged_at
     FROM bed_admissions ba
     JOIN patients p ON p.id = ba.patient_id
     WHERE ba.bed_id = $1
     ORDER BY ba.admitted_at DESC`,
    [bedId]
  );
  return rows;
}
