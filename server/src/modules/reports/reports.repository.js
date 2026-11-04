import { query } from '../../config/db.js';

// --- Revenue Report ---
export async function getRevenueReport({ dateFrom, dateTo }) {
  // Query all bills in date range with per-bill line item allocation
  const billsRes = await query(
    `WITH bill_items_agg AS (
       SELECT 
         b.id,
         b.invoice_no,
         b.bill_date,
         b.created_at,
         b.bill_type,
         b.payment_status,
         b.payment_mode,
         b.sub_total,
         b.discount,
         b.tax,
         b.total,
         p.id AS patient_uuid,
         p.patient_code,
         p.name AS patient_name,
         d.name AS doctor_name,
         COALESCE(SUM(CASE WHEN bi.item_type IN ('Consultation', 'Therapy', 'Procedure') THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS consult_items_sum,
         COALESCE(SUM(CASE WHEN bi.item_type = 'Investigation' THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS inv_items_sum,
         COALESCE(SUM(bi.amount * bi.quantity), 0) AS total_items_sum,
         COUNT(bi.id) AS item_count
       FROM bills b
       JOIN patients p ON b.patient_id = p.id
       LEFT JOIN doctors d ON b.doctor_id = d.id
       LEFT JOIN bill_items bi ON bi.bill_id = b.id
       WHERE b.bill_date >= $1 AND b.bill_date <= $2
       GROUP BY b.id, b.invoice_no, b.bill_date, b.created_at, b.bill_type, b.payment_status, b.payment_mode, b.sub_total, b.discount, b.tax, b.total, p.id, p.patient_code, p.name, d.name
     )
     SELECT 
       id, invoice_no, bill_date AS date, created_at, bill_type, payment_status, payment_mode,
       sub_total, discount, tax, total, patient_uuid, patient_code, patient_name, doctor_name,
       CASE 
         WHEN item_count > 0 AND total_items_sum > 0 THEN
           CASE 
             WHEN inv_items_sum = 0 THEN total
             WHEN consult_items_sum = 0 THEN 0
             ELSE ROUND((consult_items_sum::numeric / total_items_sum) * total, 2)
           END
         WHEN item_count = 0 AND bill_type = 'OPD' THEN total
         ELSE 0
       END AS consult_portion,
       CASE 
         WHEN item_count > 0 AND total_items_sum > 0 THEN
           CASE 
             WHEN consult_items_sum = 0 THEN total
             WHEN inv_items_sum = 0 THEN 0
             ELSE total - ROUND((consult_items_sum::numeric / total_items_sum) * total, 2)
           END
         WHEN item_count = 0 AND bill_type = 'Lab' THEN total
         ELSE 0
       END AS inv_portion,
       CASE 
         WHEN (item_count > 0 AND consult_items_sum > 0 AND inv_items_sum > 0) THEN 'Both'
         WHEN (item_count > 0 AND inv_items_sum > 0) OR (item_count = 0 AND bill_type = 'Lab') THEN 'Investigation'
         ELSE 'Consultation'
       END AS category
     FROM bill_items_agg
     ORDER BY bill_date DESC, created_at DESC, invoice_no DESC`,
    [dateFrom, dateTo]
  );

  const rows = billsRes.rows;

  let totalPaidRevenue = 0;
  let consultationPaidRevenue = 0;
  let investigationPaidRevenue = 0;
  let paidCount = 0;

  let totalPendingAmount = 0;
  let consultationPendingAmount = 0;
  let investigationPendingAmount = 0;
  let pendingCount = 0;

  for (const r of rows) {
    const tot = Number(r.total);
    const cp = Number(r.consult_portion);
    const ip = Number(r.inv_portion);

    if (r.payment_status === 'Paid') {
      totalPaidRevenue += tot;
      consultationPaidRevenue += cp;
      investigationPaidRevenue += ip;
      paidCount++;
    } else {
      totalPendingAmount += tot;
      consultationPendingAmount += cp;
      investigationPendingAmount += ip;
      pendingCount++;
    }
  }

  // Ensure exact zero-discrepancy reconciliation:
  consultationPaidRevenue = Math.round(consultationPaidRevenue * 100) / 100;
  investigationPaidRevenue = Math.round((totalPaidRevenue - consultationPaidRevenue) * 100) / 100;

  consultationPendingAmount = Math.round(consultationPendingAmount * 100) / 100;
  investigationPendingAmount = Math.round((totalPendingAmount - consultationPendingAmount) * 100) / 100;

  // Revenue trend by day of week
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM bill_date)::int AS dow, COALESCE(SUM(total), 0)::numeric AS revenue 
     FROM bills 
     WHERE bill_date >= $1 AND bill_date <= $2 AND payment_status = 'Paid'
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  return {
    totalCollected: totalPaidRevenue,
    summary: {
      totalPaidRevenue,
      totalPendingAmount,
      consultationPaidRevenue,
      investigationPaidRevenue,
      paidCount,
      pendingCount,
      consultationPendingAmount,
      investigationPendingAmount
    },
    trend: trendRes.rows,
    items: rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoice_no,
      patientId: r.patient_code,
      patientName: r.patient_name,
      doctorName: r.doctor_name || '—',
      date: r.date,
      dateTime: r.created_at,
      billType: r.bill_type,
      category: r.category,
      paymentStatus: r.payment_status,
      paymentMode: r.payment_mode,
      subTotal: Number(r.sub_total),
      discount: Number(r.discount),
      tax: Number(r.tax),
      total: Number(r.total),
      consultationAmount: Number(r.consult_portion),
      investigationAmount: Number(r.inv_portion)
    }))
  };
}

// --- Consultations Report ---
export async function getConsultationsReport({ dateFrom, dateTo }) {
  const itemsRes = await query(
    `WITH bill_items_agg AS (
       SELECT 
         b.id,
         b.invoice_no,
         b.bill_date,
         b.created_at,
         b.bill_type,
         b.payment_status,
         b.payment_mode,
         b.sub_total,
         b.discount,
         b.tax,
         b.total,
         p.id AS patient_uuid,
         p.patient_code,
         p.name AS patient_name,
         d.name AS doctor_name,
         COALESCE(
           (SELECT bi.description FROM bill_items bi WHERE bi.bill_id = b.id AND bi.item_type IN ('Consultation', 'Therapy', 'Procedure') ORDER BY bi.created_at ASC LIMIT 1),
           'Consultation'
         ) AS consult_type_desc,
         COALESCE(SUM(CASE WHEN bi.item_type IN ('Consultation', 'Therapy', 'Procedure') THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS consult_items_sum,
         COALESCE(SUM(CASE WHEN bi.item_type = 'Investigation' THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS inv_items_sum,
         COALESCE(SUM(bi.amount * bi.quantity), 0) AS total_items_sum,
         COUNT(bi.id) AS item_count
       FROM bills b
       JOIN patients p ON b.patient_id = p.id
       LEFT JOIN doctors d ON b.doctor_id = d.id
       LEFT JOIN bill_items bi ON bi.bill_id = b.id
       WHERE b.bill_date >= $1 AND b.bill_date <= $2
       GROUP BY b.id, b.invoice_no, b.bill_date, b.created_at, b.bill_type, b.payment_status, b.payment_mode, b.sub_total, b.discount, b.tax, b.total, p.id, p.patient_code, p.name, d.name
     )
     SELECT 
       id, invoice_no, bill_date AS date, created_at, bill_type, payment_status, payment_mode,
       sub_total, discount, tax, total, patient_uuid, patient_code, patient_name, doctor_name,
       consult_type_desc,
       CASE 
         WHEN item_count > 0 AND total_items_sum > 0 THEN
           CASE 
             WHEN inv_items_sum = 0 THEN total
             WHEN consult_items_sum = 0 THEN 0
             ELSE ROUND((consult_items_sum::numeric / total_items_sum) * total, 2)
           END
         WHEN item_count = 0 AND bill_type = 'OPD' THEN total
         ELSE 0
       END AS consult_portion
     FROM bill_items_agg
     WHERE (item_count > 0 AND consult_items_sum > 0) OR (item_count = 0 AND bill_type = 'OPD')
     ORDER BY bill_date DESC, created_at DESC, invoice_no DESC`,
    [dateFrom, dateTo]
  );

  const rows = itemsRes.rows;

  let paidConsultationRevenue = 0;
  let pendingConsultationAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const r of rows) {
    const cp = Number(r.consult_portion);
    if (r.payment_status === 'Paid') {
      paidConsultationRevenue += cp;
      paidCount++;
    } else {
      pendingConsultationAmount += cp;
      pendingCount++;
    }
  }

  paidConsultationRevenue = Math.round(paidConsultationRevenue * 100) / 100;
  pendingConsultationAmount = Math.round(pendingConsultationAmount * 100) / 100;

  // Trend by day of week
  const trendRes = await query(
    `WITH bill_allocations AS (
       SELECT 
         b.id,
         b.bill_date,
         b.total,
         COALESCE(SUM(CASE WHEN bi.item_type IN ('Consultation', 'Therapy', 'Procedure') THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS consult_items_sum,
         COALESCE(SUM(bi.amount * bi.quantity), 0) AS total_items_sum,
         COUNT(bi.id) AS item_count,
         b.bill_type
       FROM bills b
       LEFT JOIN bill_items bi ON bi.bill_id = b.id
       WHERE b.bill_date >= $1 AND b.bill_date <= $2 AND b.payment_status = 'Paid'
       GROUP BY b.id, b.bill_date, b.total, b.bill_type
     )
     SELECT 
       EXTRACT(ISODOW FROM bill_date)::int AS dow,
       COALESCE(SUM(
         CASE 
           WHEN item_count > 0 AND total_items_sum > 0 THEN ROUND((consult_items_sum::numeric / total_items_sum) * total, 2)
           WHEN item_count = 0 AND bill_type = 'OPD' THEN total
           ELSE 0
         END
       ), 0)::numeric AS revenue
     FROM bill_allocations
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  return {
    totalCollected: paidConsultationRevenue,
    summary: {
      paidConsultationRevenue,
      pendingConsultationAmount,
      paidCount,
      pendingCount
    },
    trend: trendRes.rows,
    items: rows.map((b) => ({
      id: b.id,
      invoiceNo: b.invoice_no,
      patientName: b.patient_name,
      patientId: b.patient_code,
      consultationType: b.consult_type_desc || 'Consultation',
      dateTime: b.created_at,
      date: b.date,
      doctorName: b.doctor_name || 'Hospital Consultant',
      consultationRevenue: Number(b.consult_portion),
      totalAmount: Number(b.total),
      paymentStatus: b.payment_status,
      paymentMode: b.payment_mode,
      billType: b.bill_type,
      subTotal: Number(b.sub_total),
      discount: Number(b.discount),
      tax: Number(b.tax),
      total: Number(b.total)
    }))
  };
}

// --- Lab Investigations Report ---
export async function getInvestigationsReport({ dateFrom, dateTo }) {
  const itemsRes = await query(
    `WITH bill_items_agg AS (
       SELECT 
         b.id,
         b.invoice_no,
         b.bill_date,
         b.created_at,
         b.bill_type,
         b.payment_status,
         b.payment_mode,
         b.sub_total,
         b.discount,
         b.tax,
         b.total,
         p.id AS patient_uuid,
         p.patient_code,
         p.name AS patient_name,
         COALESCE(
           STRING_AGG(DISTINCT bi.description, ', ') FILTER (WHERE bi.item_type = 'Investigation'),
           'Diagnostic Investigation'
         ) AS investigation_names,
         COALESCE(SUM(CASE WHEN bi.item_type IN ('Consultation', 'Therapy', 'Procedure') THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS consult_items_sum,
         COALESCE(SUM(CASE WHEN bi.item_type = 'Investigation' THEN (bi.amount * bi.quantity) ELSE 0 END), 0) AS inv_items_sum,
         COALESCE(SUM(bi.amount * bi.quantity), 0) AS total_items_sum,
         COUNT(bi.id) AS item_count,
         COUNT(CASE WHEN bi.item_type = 'Investigation' THEN 1 END) AS inv_item_count
       FROM bills b
       JOIN patients p ON b.patient_id = p.id
       LEFT JOIN bill_items bi ON bi.bill_id = b.id
       WHERE b.bill_date >= $1 AND b.bill_date <= $2
       GROUP BY b.id, b.invoice_no, b.bill_date, b.created_at, b.bill_type, b.payment_status, b.payment_mode, b.sub_total, b.discount, b.tax, b.total, p.id, p.patient_code, p.name
     )
     SELECT 
       id, invoice_no, bill_date AS date, created_at, bill_type, payment_status, payment_mode,
       sub_total, discount, tax, total, patient_uuid, patient_code, patient_name,
       investigation_names, inv_item_count,
       CASE 
         WHEN item_count > 0 AND total_items_sum > 0 THEN
           CASE 
             WHEN consult_items_sum = 0 THEN total
             WHEN inv_items_sum = 0 THEN 0
             ELSE total - ROUND((consult_items_sum::numeric / total_items_sum) * total, 2)
           END
         WHEN item_count = 0 AND bill_type = 'Lab' THEN total
         ELSE 0
       END AS inv_portion
     FROM bill_items_agg
     WHERE (item_count > 0 AND inv_items_sum > 0) OR (item_count = 0 AND bill_type = 'Lab')
     ORDER BY bill_date DESC, created_at DESC, invoice_no DESC`,
    [dateFrom, dateTo]
  );

  const rows = itemsRes.rows;

  let paidInvestigationRevenue = 0;
  let pendingInvestigationAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let totalTestsOrdered = 0;

  for (const r of rows) {
    const ip = Number(r.inv_portion);
    totalTestsOrdered += Number(r.inv_item_count || 1);
    if (r.payment_status === 'Paid') {
      paidInvestigationRevenue += ip;
      paidCount++;
    } else {
      pendingInvestigationAmount += ip;
      pendingCount++;
    }
  }

  paidInvestigationRevenue = Math.round(paidInvestigationRevenue * 100) / 100;
  pendingInvestigationAmount = Math.round(pendingInvestigationAmount * 100) / 100;

  // Trend by day of week
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM b.bill_date)::int AS dow, COUNT(*)::int AS count 
     FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     WHERE bi.item_type = 'Investigation' AND b.bill_date >= $1 AND b.bill_date <= $2
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  return {
    totalTestsOrdered,
    totalCollected: paidInvestigationRevenue,
    summary: {
      paidInvestigationRevenue,
      pendingInvestigationAmount,
      paidCount,
      pendingCount,
      totalTestsOrdered
    },
    trend: trendRes.rows,
    items: rows.map((b) => ({
      id: b.id,
      invoiceNo: b.invoice_no,
      patientName: b.patient_name,
      patientId: b.patient_code,
      investigationName: b.investigation_names || 'Diagnostic Investigation',
      dateTime: b.created_at,
      date: b.date,
      investigationAmount: Number(b.inv_portion),
      totalAmount: Number(b.total),
      paymentStatus: b.payment_status,
      paymentMode: b.payment_mode
    }))
  };
}

// --- Patient Registrations Report ---
export async function getPatientsReport({ dateFrom, dateTo }) {
  const patientsSql = `
    SELECT 
      p.id, p.patient_code AS code, p.name, p.age, p.gender, p.phone, p.address,
      p.blood_group AS "bloodGroup", p.primary_diagnosis AS diagnosis,
      p.created_at, p.created_at::date AS "registeredDate",
      COALESCE(
        (SELECT d.name FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = p.id ORDER BY a.appointment_date DESC, a.created_at DESC LIMIT 1),
        (SELECT d.name FROM consultations c JOIN doctors d ON c.doctor_id = d.id WHERE c.patient_id = p.id ORDER BY c.created_at DESC LIMIT 1),
        (SELECT d.name FROM bills b JOIN doctors d ON b.doctor_id = d.id WHERE b.patient_id = p.id AND b.doctor_id IS NOT NULL ORDER BY b.bill_date DESC, b.created_at DESC LIMIT 1),
        'Not Assigned'
      ) AS assigned_doctor
    FROM patients p
    WHERE p.created_at::date >= $1 AND p.created_at::date <= $2 AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `;
  const patientsRes = await query(patientsSql, [dateFrom, dateTo]);
  const rows = patientsRes.rows;

  let assignedCount = 0;
  let unassignedCount = 0;
  for (const r of rows) {
    if (r.assigned_doctor && r.assigned_doctor !== 'Not Assigned') {
      assignedCount++;
    } else {
      unassignedCount++;
    }
  }

  // Trend by day of week
  const trendRes = await query(
    `SELECT EXTRACT(ISODOW FROM created_at)::int AS dow, COUNT(*)::int AS count 
     FROM patients 
     WHERE created_at::date >= $1 AND created_at::date <= $2 AND deleted_at IS NULL
     GROUP BY dow`,
    [dateFrom, dateTo]
  );

  return {
    totalRegistrations: rows.length,
    summary: {
      totalRegistrations: rows.length,
      assignedCount,
      unassignedCount
    },
    trend: trendRes.rows,
    items: rows
  };
}
