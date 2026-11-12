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
  const { rows } = await client.query(
    `SELECT ${BASE_SELECT} ${BASE_FROM} WHERE b.id::text = $1 OR b.invoice_no = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listItems(billId) {
  const { rows } = await query(
    `SELECT bi.id, bi.investigation_id, bi.consultation_investigation_id, bi.description, bi.item_type, bi.quantity, bi.amount
     FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     WHERE b.id::text = $1 OR b.invoice_no = $1
     ORDER BY bi.created_at ASC`,
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

export async function insertItem(
  { billId, description, itemType, quantity, amount, investigationId, consultationInvestigationId },
  client
) {
  await client.query(
    `INSERT INTO bill_items (bill_id, investigation_id, consultation_investigation_id, description, item_type, quantity, amount)
     VALUES ($1, $2, $3, $4, $5::bill_item_type, COALESCE($6, 1), $7)`,
    [
      billId,
      investigationId ?? null,
      consultationInvestigationId ?? null,
      description,
      itemType,
      quantity ?? null,
      amount
    ]
  );
}

export async function getPendingInvestigations(patientId, client = { query }) {
  const q = client.query.bind(client);
  const { rows } = await q(
    `SELECT 
       ci.id,
       ci.consultation_id,
       COALESCE(ci.patient_id, c.patient_id) AS patient_id,
       ci.investigation_id,
       ci.test_name,
       ci.status AS clinical_status,
       ci.billing_status,
       ci.bill_id,
       ci.ordered_at,
       ci.completed_at,
       ci.ordered_by_name,
       COALESCE(ci.ordered_by_name, d.name, u.username, 'Hospital Staff') AS ordered_by,
       COALESCE(inv.investigation_code, inv_by_name.investigation_code, 'INV') AS investigation_code,
       COALESCE(inv.category, inv_by_name.category, 'Diagnostic') AS category,
       COALESCE(inv.price, inv_by_name.price, 0) AS price
     FROM consultation_investigations ci
     LEFT JOIN consultations c ON c.id = ci.consultation_id
     LEFT JOIN doctors d ON d.id = c.doctor_id
     LEFT JOIN users u ON u.id = ci.ordered_by_user_id
     LEFT JOIN investigations inv ON inv.id = ci.investigation_id
     LEFT JOIN investigations inv_by_name ON LOWER(inv_by_name.test_name) = LOWER(ci.test_name)
     WHERE (ci.patient_id = $1 OR c.patient_id = $1)
       AND (ci.billing_status = 'Unbilled' OR ci.billing_status IS NULL)
       AND ci.bill_id IS NULL
       AND ci.status <> 'Cancelled'
       AND ci.deleted_at IS NULL
     ORDER BY ci.ordered_at DESC, ci.id DESC`,
    [patientId]
  );
  return rows;
}

export async function lockAndVerifyInvestigationOrders(orderIds, client) {
  const { rows } = await client.query(
    `SELECT 
       ci.id,
       COALESCE(ci.patient_id, c.patient_id) AS patient_id,
       ci.bill_id,
       ci.billing_status,
       ci.status AS clinical_status,
       ci.test_name,
       ci.deleted_at,
       ci.investigation_id,
       COALESCE(inv.investigation_code, inv_by_name.investigation_code, 'INV') AS investigation_code,
       COALESCE(inv.category, inv_by_name.category, 'Diagnostic') AS category,
       COALESCE(inv.price, inv_by_name.price, 0) AS price
     FROM consultation_investigations ci
     LEFT JOIN consultations c ON c.id = ci.consultation_id
     LEFT JOIN investigations inv ON inv.id = ci.investigation_id
     LEFT JOIN investigations inv_by_name ON LOWER(inv_by_name.test_name) = LOWER(ci.test_name)
     WHERE ci.id = ANY($1)
     FOR UPDATE OF ci`,
    [orderIds]
  );
  return rows;
}

export async function linkInvestigationOrdersToBill(orderIds, billId, client) {
  if (!orderIds || !orderIds.length) return;
  await client.query(
    `UPDATE consultation_investigations
     SET bill_id = $1, billing_status = 'Billed', billed_at = now()
     WHERE id = ANY($2)`,
    [billId, orderIds]
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
