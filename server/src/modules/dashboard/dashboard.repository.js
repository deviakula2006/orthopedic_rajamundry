import { query } from '../../config/db.js';

export async function getPatientsCount() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM patients WHERE deleted_at IS NULL');
  return rows[0].count;
}

export async function getActiveDoctorsCount() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM doctors WHERE deleted_at IS NULL AND status = 'Active'`
  );
  return rows[0].count;
}

export async function getActiveReceptionistsCount() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM receptionists WHERE deleted_at IS NULL AND status = 'Active'`
  );
  return rows[0].count;
}

export async function getAppointmentsTodayCount() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM appointments WHERE appointment_date = CURRENT_DATE AND status != 'Cancelled'`
  );
  return rows[0].count;
}

export async function getBedOccupancy() {
  const { rows: bedRows } = await query('SELECT status, COUNT(*)::int AS count FROM beds GROUP BY status');
  const byStatus = Object.fromEntries(bedRows.map((r) => [r.status, r.count]));
  const total = bedRows.reduce((sum, r) => sum + r.count, 0);
  const { rows: wardRows } = await query('SELECT COUNT(*)::int AS count FROM wards');
  return {
    total,
    totalWards: wardRows[0].count,
    vacant: byStatus.Vacant ?? 0,
    occupied: byStatus.Occupied ?? 0
  };
}


export async function getRevenueToday() {
  const { rows } = await query(
    `SELECT COALESCE(SUM(total), 0) AS revenue FROM bills WHERE bill_date = CURRENT_DATE AND payment_status = 'Paid'`
  );
  return Number(rows[0].revenue);
}

export async function getTodayInvestigationsCount() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM bill_items bi
     JOIN bills b ON bi.bill_id = b.id
     WHERE bi.item_type = 'Investigation' AND b.bill_date = CURRENT_DATE`
  );
  return rows[0].count;
}

export async function getAppointmentsTrend() {
  const { rows } = await query(
    `SELECT appointment_date::text AS date, COUNT(*)::int AS count 
     FROM appointments 
     WHERE appointment_date >= CURRENT_DATE - INTERVAL '6 days' AND status != 'Cancelled'
     GROUP BY appointment_date
     ORDER BY appointment_date ASC`
  );
  return rows;
}

export async function getRevenueOverview() {
  const { rows } = await query(
    `SELECT bill_type AS type, COALESCE(SUM(total), 0)::numeric AS total 
     FROM bills 
     WHERE payment_status = 'Paid'
     GROUP BY bill_type`
  );
  return rows;
}

export async function getPendingBillsCount() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM bills WHERE payment_status IN ('Pending', 'Partially Paid')`
  );
  return rows[0].count;
}
