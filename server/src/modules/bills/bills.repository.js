import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = `
  b.id, b.invoice_no, b.bill_date, b.bill_type, b.payment_mode, b.payment_status,
  b.sub_total, b.discount, b.tax, b.total, b.created_at, b.updated_at,
  p.id AS patient_id, p.patient_code, p.name AS patient_name,
  d.id AS doctor_id, d.doctor_code, d.name AS doctor_name
`;

const BASE_FROM = `
  FROM bills b
  JOIN patients p ON p.id = b.patient_id
  LEFT JOIN doctors d ON d.id = b.doctor_id
`;

export async function list({ limit, offset, patientId, paymentStatus, billType }) {
  const conditions = [];
  const params = [];

  if (patientId) {
    params.push(patientId);
    conditions.push(`b.patient_id = $${params.length}`);
  }
  if (paymentStatus) {
    params.push(paymentStatus);
    conditions.push(`b.payment_status = $${params.length}`);
  }
  if (billType) {
    params.push(billType);
    conditions.push(`b.bill_type = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT ${BASE_SELECT} ${BASE_FROM} ${whereSql}
     ORDER BY b.bill_date DESC, b.created_at DESC
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
  const { rows } = await client.query(`SELECT ${BASE_SELECT} ${BASE_FROM} WHERE b.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listItems(billId) {
  const { rows } = await query(
    `SELECT id, investigation_id, description, item_type, quantity, amount
     FROM bill_items WHERE bill_id = $1 ORDER BY created_at ASC`,
    [billId]
  );
  return rows;
}

export async function createBillHeader(
  { patientId, doctorId, billDate, billType, paymentMode, paymentStatus, subTotal, discount, tax, total },
  client
) {
  const { rows } = await client.query(
    `INSERT INTO bills (patient_id, doctor_id, bill_date, bill_type, payment_mode, payment_status, sub_total, discount, tax, total)
     VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, COALESCE($6, 'Pending')::payment_status, $7, $8, $9, $10)
     RETURNING id, invoice_no`,
    [
      patientId,
      doctorId ?? null,
      billDate ?? null,
      billType,
      paymentMode ?? null,
      paymentStatus ?? null,
      subTotal,
      discount,
      tax,
      total
    ]
  );
  return rows[0];
}

export async function insertItem({ billId, description, itemType, quantity, amount, investigationId }, client) {
  await client.query(
    `INSERT INTO bill_items (bill_id, investigation_id, description, item_type, quantity, amount)
     VALUES ($1, $2, $3, $4::bill_item_type, COALESCE($5, 1), $6)`,
    [billId, investigationId ?? null, description, itemType, quantity ?? null, amount]
  );
}

export async function updateStatus(id, fields) {
  const clause = buildSetClause({
    payment_status: fields.paymentStatus,
    payment_mode: fields.paymentMode
  });
  if (!clause) return findById(id);

  const { rows } = await query(
    `UPDATE bills SET ${clause.setSql}, updated_at = now() WHERE id = $${clause.values.length + 1} RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id) : null;
}
