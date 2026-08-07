import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  a.id, a.appointment_code, a.appointment_date, a.appointment_time, a.type, a.status, a.fee, a.notes,
  a.created_at, a.updated_at,
  p.id AS patient_id, p.patient_code, p.name AS patient_name, p.phone AS patient_phone,
  d.id AS doctor_id, d.doctor_code, d.name AS doctor_name
`;

const BASE_FROM = `
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
`;

export async function list({ limit, offset, patientId, doctorId, date, status }) {
  const conditions = [];
  const params = [];

  if (patientId) {
    params.push(patientId);
    conditions.push(`a.patient_id = $${params.length}`);
  }
  if (doctorId) {
    params.push(doctorId);
    conditions.push(`a.doctor_id = $${params.length}`);
  }
  if (date) {
    params.push(date);
    conditions.push(`a.appointment_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} ${BASE_FROM} ${whereSql}
     ORDER BY a.appointment_date ASC, a.appointment_time ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total ${BASE_FROM} ${whereSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: countRows[0].total };
}

export async function findById(id, client = { query }) {
  const { rows } = await client.query(`SELECT ${BASE_SELECT} ${BASE_FROM} WHERE a.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create({ patientId, doctorId, appointmentDate, appointmentTime, type, fee, notes }) {
  const { rows } = await query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, fee, notes)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'Consultation')::appointment_type, COALESCE($6, 0), $7)
     RETURNING id`,
    [patientId, doctorId, appointmentDate, appointmentTime, type ?? null, fee ?? null, notes ?? null]
  );
  return findById(rows[0].id);
}

export async function update(id, fields, client = { query }) {
  const existing = await client.query('SELECT status FROM appointments WHERE id = $1', [id]);
  const currentStatus = existing.rows[0]?.status;

  let newStatus = fields.status;
  if (!newStatus && currentStatus === 'Cancelled') {
    newStatus = 'Scheduled';
  }

  const clause = buildSetClause({
    patient_id: fields.patientId,
    doctor_id: fields.doctorId,
    appointment_date: fields.appointmentDate,
    appointment_time: fields.appointmentTime,
    type: fields.type,
    fee: fields.fee,
    notes: fields.notes,
    status: newStatus
  });
  if (!clause) return findById(id, client);

  const { rows } = await client.query(
    `UPDATE appointments SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1}
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id, client) : null;
}

export async function updateStatus(id, status, client = { query }) {
  const { rows } = await client.query(
    `UPDATE appointments SET status = $2, updated_at = now() WHERE id = $1 RETURNING id`,
    [id, status]
  );
  return rows[0] ? findById(id, client) : null;
}

export async function deletePermanent(id, client = { query }) {
  const { rows } = await client.query(
    `DELETE FROM appointments WHERE id = $1 RETURNING id, appointment_code`,
    [id]
  );
  return rows[0] ?? null;
}
