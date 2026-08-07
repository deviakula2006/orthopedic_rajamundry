/**
 * bed.service.js
 *
 * All business logic for the Bed & Ward Management module.
 * Controllers only call service functions — no SQL ever touches the controller.
 */

import { withTransaction } from '../../config/db.js';
import * as bedRepository from './bed.repository.js';
import { serializeWard, serializeBed } from './bed.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { ApiError } from '../../utils/ApiError.js';

// ---------------------------------------------------------------------------
// Ward operations
// ---------------------------------------------------------------------------

/**
 * Return all wards, each enriched with bed counts.
 */
export async function listWards() {
  const rows = await bedRepository.listWards();
  return rows.map(serializeWard);
}

/**
 * Create a new ward.
 * @param {{ name: string, dailyCharge: number }} data
 * @param {{ id: string, name: string }} actor
 */
export async function createWard(data, actor) {
  const row = await bedRepository.createWard({
    name: data.name,
    dailyCharge: data.dailyCharge ?? 0
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Created ward "${row.name}"`,
    activityType: 'ward',
    entityType: 'ward',
    entityId: row.id
  });

  return serializeWard({ ...row, bed_count: 0, occupied_count: 0, beds: [] });
}

/**
 * Delete a ward (only allowed when it has no beds).
 * @param {string} wardId
 * @param {{ id: string, name: string }} actor
 */
export async function deleteWard(wardId, actor) {
  const ward = await bedRepository.findWardById(wardId);
  if (!ward) throw ApiError.notFound('Ward not found');

  const bedCount = await bedRepository.countBedsInWard(wardId);
  if (bedCount > 0) {
    throw ApiError.conflict(
      `Cannot delete ward "${ward.name}" because it still has ${bedCount} bed(s). Remove all beds first.`
    );
  }

  await bedRepository.deleteWard(wardId);

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Deleted ward "${ward.name}"`,
    activityType: 'ward',
    entityType: 'ward',
    entityId: wardId
  });
}

// ---------------------------------------------------------------------------
// Bed operations
// ---------------------------------------------------------------------------

/**
 * Create a new bed inside a ward.
 * @param {string} wardId
 * @param {{ bedNumber: string }} data
 * @param {{ id: string, name: string }} actor
 */
export async function createBed(wardId, data, actor) {
  const ward = await bedRepository.findWardById(wardId);
  if (!ward) throw ApiError.notFound('Ward not found');

  let row;
  try {
    row = await bedRepository.createBed({ wardId, bedNumber: data.bedNumber });
  } catch (err) {
    // Postgres unique violation code
    if (err.code === '23505') {
      throw ApiError.conflict(
        `Bed number "${data.bedNumber}" already exists in ward "${ward.name}"`
      );
    }
    throw err;
  }

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Created bed "${data.bedNumber}" in ward "${ward.name}"`,
    activityType: 'bed',
    entityType: 'bed',
    entityId: row.id
  });

  return serializeBed(row);
}

/**
 * Delete a bed (only if it is Vacant).
 * @param {string} bedId
 * @param {{ id: string, name: string }} actor
 */
export async function deleteBed(bedId, actor) {
  const bed = await bedRepository.findBedById(bedId);
  if (!bed) throw ApiError.notFound('Bed not found');

  if (bed.status === 'Occupied') {
    throw ApiError.conflict(
      `Bed "${bed.bed_number}" is currently occupied. Vacate it before deleting.`
    );
  }

  await bedRepository.deleteBed(bedId);

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Deleted bed "${bed.bed_number}" from ward "${bed.ward_name}"`,
    activityType: 'bed',
    entityType: 'bed',
    entityId: bedId
  });
}

/**
 * Get a single bed by UUID.
 * @param {string} bedId
 */
export async function getBed(bedId) {
  const row = await bedRepository.findBedById(bedId);
  if (!row) throw ApiError.notFound('Bed not found');
  return serializeBed(row);
}

/**
 * Assign a patient to a vacant bed.
 * Creates the admission record and updates bed status atomically.
 *
 * @param {string} bedId
 * @param {string} patientId  — must be a UUID from the patients table
 * @param {{ id: string, name: string }} actor
 */
export async function assignBed(bedId, patientId, actor) {
  return withTransaction(async (client) => {
    // Lock the bed row to prevent concurrent assigns
    const bed = await bedRepository.lockBedById(bedId, client);
    if (!bed) throw ApiError.notFound('Bed not found');

    if (bed.status !== 'Vacant') {
      throw ApiError.conflict(
        `Bed "${bed.bed_number}" is already ${bed.status}`
      );
    }

    // Verify patient exists and is not soft-deleted
    const { rows: patientRows } = await client.query(
      `SELECT id, name, patient_code FROM patients WHERE id = $1 AND deleted_at IS NULL`,
      [patientId]
    );
    const patient = patientRows[0];
    if (!patient) throw ApiError.badRequest('Patient not found');

    // Ensure patient is not already occupying another bed
    const { rows: activeBed } = await client.query(
      `SELECT b.bed_number, w.name AS ward_name
       FROM beds b
       JOIN wards w ON w.id = b.ward_id
       WHERE b.current_patient_id = $1 AND b.status = 'Occupied'`,
      [patientId]
    );
    if (activeBed.length > 0) {
      throw ApiError.conflict(
        `Patient "${patient.name}" is already admitted to bed "${activeBed[0].bed_number}" in "${activeBed[0].ward_name}"`
      );
    }

    // Perform update + admission in the same transaction
    await bedRepository.updateBedOccupy(bedId, patientId, client);
    await bedRepository.insertAdmission(bedId, patientId, client);

    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Admitted patient "${patient.name}" to bed "${bed.bed_number}"`,
        activityType: 'bed',
        entityType: 'bed',
        entityId: bedId
      },
      client
    );

    // Re-fetch the enriched row
    const updated = await bedRepository.findBedById(bedId);
    return serializeBed(updated);
  });
}

/**
 * Release a patient from an occupied bed.
 * Closes the admission record and resets bed status atomically.
 *
 * @param {string} bedId
 * @param {{ id: string, name: string }} actor
 */
export async function vacateBed(bedId, actor) {
  return withTransaction(async (client) => {
    const bed = await bedRepository.lockBedById(bedId, client);
    if (!bed) throw ApiError.notFound('Bed not found');

    if (bed.status !== 'Occupied') {
      throw ApiError.conflict(
        `Bed "${bed.bed_number}" is not occupied (current status: ${bed.status})`
      );
    }

    // Fetch patient name for the activity log
    const { rows: patientRows } = await client.query(
      `SELECT name FROM patients WHERE id = $1`,
      [bed.current_patient_id]
    );
    const patientName = patientRows[0]?.name ?? 'Unknown patient';

    await bedRepository.closeActiveAdmission(bedId, client);
    await bedRepository.updateBedVacate(bedId, client);

    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Discharged patient "${patientName}" from bed "${bed.bed_number}"`,
        activityType: 'bed',
        entityType: 'bed',
        entityId: bedId
      },
      client
    );

    const updated = await bedRepository.findBedById(bedId);
    return serializeBed(updated);
  });
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

/**
 * Return aggregate statistics about beds for the dashboard.
 */
export async function getBedStats() {
  return bedRepository.getBedStats();
}
