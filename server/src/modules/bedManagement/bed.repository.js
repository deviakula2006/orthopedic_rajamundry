/**
 * bed.repository.js
 *
 * All database operations for the Bed & Ward Management module.
 * Uses the clean 0005 schema: wards (UUID PK), beds (UUID PK, bed_status Vacant/Occupied),
 * bed_admissions (active admission = discharged_at IS NULL).
 *
 * No business logic lives here — only SQL.
 */

import { query } from '../../config/db.js';

// ---------------------------------------------------------------------------
// Ward queries
// ---------------------------------------------------------------------------

/**
 * List all wards, each with its full beds array embedded (including patient info).
 * Uses JSON aggregation to return everything in one query.
 */
export async function listWards() {
  const { rows } = await query(`
    SELECT
      w.id,
      w.name,
      w.daily_charge,
      w.created_at,
      w.updated_at,
      COUNT(b.id)::int                                       AS bed_count,
      COUNT(b.id) FILTER (WHERE b.status = 'Occupied')::int  AS occupied_count,
      COALESCE(
        json_agg(
          json_build_object(
            'id',           b.id,
            'bed_number',   b.bed_number,
            'status',       b.status,
            'patient_id',   b.current_patient_id,
            'patient_name', p.name,
            'patient_code', p.patient_code,
            'admitted_at',  adm.admitted_at
          )
          ORDER BY b.bed_number
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) AS beds
    FROM wards w
    LEFT JOIN beds b ON b.ward_id = w.id
    LEFT JOIN patients p ON p.id = b.current_patient_id
    LEFT JOIN bed_admissions adm
      ON adm.bed_id = b.id AND adm.discharged_at IS NULL
    GROUP BY w.id
    ORDER BY w.name ASC
  `);
  return rows;
}

/**
 * Find a single ward by its UUID (no bed counts).
 */
export async function findWardById(id) {
  const { rows } = await query(
    `SELECT id, name, daily_charge, created_at, updated_at FROM wards WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Check whether any beds exist for this ward.
 */
export async function countBedsInWard(wardId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS cnt FROM beds WHERE ward_id = $1`,
    [wardId]
  );
  return rows[0].cnt;
}

/**
 * Delete a single bed by its UUID.
 * Caller must ensure the bed is not occupied before calling.
 * Returns the deleted row's id, or null if not found.
 */
export async function deleteBed(bedId) {
  const { rows } = await query(
    `DELETE FROM beds WHERE id = $1 RETURNING id, bed_number, ward_id`,
    [bedId]
  );
  return rows[0] ?? null;
}

/**
 * Insert a new ward row.
 */
export async function createWard({ name, dailyCharge }) {
  const { rows } = await query(
    `INSERT INTO wards (name, daily_charge)
     VALUES ($1, $2)
     RETURNING id, name, daily_charge, created_at, updated_at`,
    [name, dailyCharge]
  );
  return rows[0];
}

/**
 * Delete a ward by ID. Caller must ensure no beds exist before calling.
 */
export async function deleteWard(id) {
  const { rows } = await query(
    `DELETE FROM wards WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Bed queries
// ---------------------------------------------------------------------------

/** Base SELECT used by findBedById and lockBedById result hydration */
const BED_SELECT = `
  b.id,
  b.ward_id,
  b.bed_number,
  b.status,
  b.current_patient_id AS patient_id,
  b.created_at,
  b.updated_at,
  w.name         AS ward_name,
  w.daily_charge AS daily_charge,
  p.name         AS patient_name,
  p.patient_code AS patient_code,
  adm.admitted_at
`;

const BED_FROM = `
  FROM beds b
  JOIN wards w ON w.id = b.ward_id
  LEFT JOIN patients p ON p.id = b.current_patient_id
  LEFT JOIN bed_admissions adm
    ON adm.bed_id = b.id AND adm.discharged_at IS NULL
`;

/**
 * List all beds in a ward (used by listWards enrichment in service).
 */
export async function listBedsByWard(wardId) {
  const { rows } = await query(
    `SELECT ${BED_SELECT} ${BED_FROM} WHERE b.ward_id = $1 ORDER BY b.bed_number ASC`,
    [wardId]
  );
  return rows;
}

/**
 * Fetch a single bed by UUID, with full join data.
 */
export async function findBedById(id) {
  const { rows } = await query(
    `SELECT ${BED_SELECT} ${BED_FROM} WHERE b.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * SELECT FOR UPDATE — must be called inside a transaction.
 * Returns lightweight row (no joins needed for locking).
 */
export async function lockBedById(id, client) {
  const { rows } = await client.query(
    `SELECT id, bed_number, status, current_patient_id
     FROM beds WHERE id = $1 FOR UPDATE`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Create a new bed in the given ward.
 */
export async function createBed({ wardId, bedNumber }) {
  const { rows } = await query(
    `INSERT INTO beds (ward_id, bed_number)
     VALUES ($1, $2)
     RETURNING id`,
    [wardId, bedNumber]
  );
  return findBedById(rows[0].id);
}

/**
 * Mark a bed as Occupied and link the patient.
 */
export async function updateBedOccupy(bedId, patientId, client) {
  await client.query(
    `UPDATE beds
     SET status = 'Occupied', current_patient_id = $2, updated_at = now()
     WHERE id = $1`,
    [bedId, patientId]
  );
}

/**
 * Mark a bed as Vacant and clear the patient reference.
 */
export async function updateBedVacate(bedId, client) {
  await client.query(
    `UPDATE beds
     SET status = 'Vacant', current_patient_id = NULL, updated_at = now()
     WHERE id = $1`,
    [bedId]
  );
}

// ---------------------------------------------------------------------------
// Admission queries
// ---------------------------------------------------------------------------

/**
 * Open a new admission record.
 */
export async function insertAdmission(bedId, patientId, client) {
  await client.query(
    `INSERT INTO bed_admissions (bed_id, patient_id)
     VALUES ($1, $2)`,
    [bedId, patientId]
  );
}

/**
 * Close the currently-active admission for a bed (set discharged_at = now()).
 */
export async function closeActiveAdmission(bedId, client) {
  await client.query(
    `UPDATE bed_admissions
     SET discharged_at = now(), updated_at = now()
     WHERE bed_id = $1 AND discharged_at IS NULL`,
    [bedId]
  );
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

/**
 * Aggregate stats across the entire bed system.
 */
export async function getBedStats() {
  const { rows: wardRows } = await query(
    `SELECT COUNT(*)::int AS total_wards FROM wards`
  );
  const { rows: bedRows } = await query(`
    SELECT
      COUNT(*)::int                                           AS total_beds,
      COUNT(*) FILTER (WHERE status = 'Occupied')::int       AS occupied_beds,
      COUNT(*) FILTER (WHERE status = 'Vacant')::int         AS vacant_beds
    FROM beds
  `);
  return {
    totalWards: wardRows[0].total_wards,
    totalBeds: bedRows[0].total_beds,
    occupiedBeds: bedRows[0].occupied_beds,
    vacantBeds: bedRows[0].vacant_beds
  };
}
