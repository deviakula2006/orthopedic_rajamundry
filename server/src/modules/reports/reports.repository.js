import { query } from '../../config/db.js';

// --- Revenue Report ---
export async function getRevenueReport({ dateFrom, dateTo }) {
  // Total collected revenue (sum of paid bills)
  const totalCollectedRes = await query(
    `SELECT COALESCE(SUM(total), 0)::numeric AS total FROM bills 
     WHERE bill_date >= $1 AND bill_date <= $2 AND payment_status = 'Paid'`,
    [dateFrom, dateTo]
  );
  const totalCollected = Number(totalCollectedRes.rows[0].total);

  // Revenue trend by day of week
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM bill_date)::int AS dow, COALESCE(SUM(total), 0)::numeric AS revenue 
     FROM bills 
     WHERE bill_date >= $1 AND bill_date <= $2 AND payment_status = 'Paid'
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  // Bill rows
  const billsRes = await query(
    `SELECT b.id, b.invoice_no, b.bill_date AS date, b.bill_type, b.payment_status, 
            b.sub_total, b.discount, b.tax, b.total,
            p.name AS patient_name, d.name AS doctor_name
     FROM bills b
     JOIN patients p ON b.patient_id = p.id
     LEFT JOIN doctors d ON b.doctor_id = d.id
     WHERE b.bill_date >= $1 AND b.bill_date <= $2
     ORDER BY b.bill_date DESC, b.invoice_no DESC`,
    [dateFrom, dateTo]
  );

  return {
    totalCollected,
    trend: trendRes.rows,
    items: billsRes.rows
  };
}

// --- Patient Registrations Report ---
export async function getPatientsReport({ dateFrom, dateTo }) {
  // Total registrations
  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM patients 
     WHERE created_at::date >= $1 AND created_at::date <= $2 AND deleted_at IS NULL`,
    [dateFrom, dateTo]
  );
  const totalRegistrations = totalRes.rows[0].total;

  // Registration trend
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM created_at)::int AS dow, COUNT(*)::int AS count 
     FROM patients 
     WHERE created_at::date >= $1 AND created_at::date <= $2 AND deleted_at IS NULL
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  // Patient rows
  const patientsRes = await query(
    `SELECT id, patient_code AS code, name, age, gender, phone, blood_group AS "bloodGroup", 
            primary_diagnosis AS diagnosis, created_at::date AS "registeredDate"
     FROM patients
     WHERE created_at::date >= $1 AND created_at::date <= $2 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [dateFrom, dateTo]
  );

  return {
    totalRegistrations,
    trend: trendRes.rows,
    items: patientsRes.rows
  };
}

// --- Lab Investigations Report ---
export async function getInvestigationsReport({ dateFrom, dateTo }) {
  // Total actual tests ordered
  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     WHERE bi.item_type = 'Investigation' AND b.bill_date >= $1 AND b.bill_date <= $2`,
    [dateFrom, dateTo]
  );
  const totalTestsOrdered = totalRes.rows[0].total;

  // Trend
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM b.bill_date)::int AS dow, COUNT(*)::int AS count 
     FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     WHERE bi.item_type = 'Investigation' AND b.bill_date >= $1 AND b.bill_date <= $2
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  // Investigation order rows
  const ordersRes = await query(
    `SELECT bi.id AS order_id, i.investigation_code AS code, bi.description AS test_name, 
            i.category, bi.amount AS price, b.bill_date AS date,
            p.name AS patient_name, p.patient_code AS patient_code
     FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     JOIN patients p ON b.patient_id = p.id
     LEFT JOIN investigations i ON bi.investigation_id = i.id
     WHERE bi.item_type = 'Investigation' AND b.bill_date >= $1 AND b.bill_date <= $2
     ORDER BY b.bill_date DESC, bi.id DESC`,
    [dateFrom, dateTo]
  );

  return {
    totalTestsOrdered,
    trend: trendRes.rows,
    items: ordersRes.rows
  };
}
