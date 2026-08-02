import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  id, doctor_code, name, specialization, phone, email, status,
  availability_note, experience_years, user_id, created_at, updated_at
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

export async function findById(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM doctors WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] ?? null;
}

export async function create({ name, specialization, phone, email, status, availabilityNote, experienceYears, userId }, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO doctors (name, specialization, phone, email, status, availability_note, experience_years, user_id)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'Active')::staff_status, $6, $7, $8)
     RETURNING ${BASE_SELECT}`,
    [name, specialization, phone, email ?? null, status ?? null, availabilityNote ?? null, experienceYears ?? null, userId ?? null]
  );
  return rows[0];
}

export async function update(id, fields, client) {
  const q = client ? client.query.bind(client) : query;
  const clause = buildSetClause({
    name: fields.name,
    specialization: fields.specialization,
    phone: fields.phone,
    email: fields.email,
    status: fields.status,
    availability_note: fields.availabilityNote,
    experience_years: fields.experienceYears
  });
  if (!clause) return findById(id, client);

  const { rows } = await q(
    `UPDATE doctors SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1} AND deleted_at IS NULL
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id, client) : null;
}

export async function setStatus(id, status, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE doctors SET status = $2, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${BASE_SELECT}`,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function softDelete(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE doctors SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findByUserId(userId, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM doctors WHERE user_id = $1 AND deleted_at IS NULL`, [userId]);
  return rows[0] ?? null;
}

export async function findByCode(doctorCode, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM doctors WHERE doctor_code = $1 AND deleted_at IS NULL`, [doctorCode]);
  return rows[0] ?? null;
}

export async function getDoctorDashboardSummary({ doctorId, date }) {
  const targetDate = date || new Date().toISOString().slice(0, 10);

  const { rows: metricRows } = await query(
    `SELECT
       COUNT(*)::int AS total_appointments,
       COUNT(*) FILTER (WHERE a.status::text IN ('Scheduled', 'In Consultation'))::int AS pending_consultations,
       COUNT(*) FILTER (WHERE a.status::text = 'Completed')::int AS completed_consultations
     FROM appointments a
     WHERE a.doctor_id = $1 AND a.appointment_date = $2`,
    [doctorId, targetDate]
  );

  const { rows: queueRows } = await query(
    `SELECT
       a.id AS appointment_id, a.appointment_code, a.appointment_date, a.appointment_time,
       a.type, a.status AS appointment_status, a.notes AS chief_complaint,
       p.id AS patient_id, p.patient_code, p.name AS patient_name, p.age AS patient_age,
       p.gender AS patient_gender, p.phone AS patient_phone, p.primary_diagnosis,
       c.id AS consultation_id, c.status AS consultation_status, c.diagnosis AS consultation_diagnosis
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     LEFT JOIN consultations c ON c.appointment_id = a.id
     WHERE a.doctor_id = $1 AND a.appointment_date = $2
     ORDER BY a.appointment_time ASC`,
    [doctorId, targetDate]
  );

  return {
    metrics: metricRows[0] || { total_appointments: 0, pending_consultations: 0, completed_consultations: 0 },
    queue: queueRows
  };
}
