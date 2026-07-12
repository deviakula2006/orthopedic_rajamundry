import { withTransaction } from '../../config/db.js';
import * as bedsRepository from './beds.repository.js';
import { serializeBed, serializeAdmission } from './beds.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listBeds(filters) {
  const rows = await bedsRepository.list(filters);
  return rows.map(serializeBed);
}

export async function getBed(id) {
  const row = await bedsRepository.findById(id);
  if (!row) throw ApiError.notFound('Bed not found');
  return serializeBed(row);
}

export async function getBedAdmissionHistory(id) {
  const bed = await bedsRepository.findById(id);
  if (!bed) throw ApiError.notFound('Bed not found');
  const rows = await bedsRepository.listAdmissionHistory(id);
  return rows.map(serializeAdmission);
}

export async function assignBed(bedId, patientId, actor) {
  return withTransaction(async (client) => {
    const bed = await bedsRepository.lockById(bedId, client);
    if (!bed) throw ApiError.notFound('Bed not found');
    if (bed.status !== 'Available') {
      throw ApiError.conflict(`Bed ${bed.bed_no} is not available (current status: ${bed.status})`);
    }

    const { rows: patientRows } = await client.query(
      'SELECT id, name FROM patients WHERE id = $1 AND deleted_at IS NULL',
      [patientId]
    );
    const patient = patientRows[0];
    if (!patient) throw ApiError.badRequest('Patient not found');

    await bedsRepository.occupy(bedId, patientId, client);
    await bedsRepository.insertAdmission(bedId, patientId, client);
    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Admitted ${patient.name} to Ward Bed ${bed.bed_no}`,
        activityType: 'bed',
        entityType: 'bed',
        entityId: bedId
      },
      client
    );

    const updated = await bedsRepository.findById(bedId, client);
    return serializeBed(updated);
  });
}

export async function releaseBed(bedId, actor) {
  return withTransaction(async (client) => {
    const bed = await bedsRepository.lockById(bedId, client);
    if (!bed) throw ApiError.notFound('Bed not found');
    if (bed.status !== 'Occupied') {
      throw ApiError.conflict(`Bed ${bed.bed_no} is not occupied (current status: ${bed.status})`);
    }

    const { rows: patientRows } = await client.query('SELECT name FROM patients WHERE id = $1', [bed.current_patient_id]);
    const patientName = patientRows[0]?.name ?? 'patient';

    await bedsRepository.vacate(bedId, client);
    await bedsRepository.closeActiveAdmission(bedId, client);
    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Discharged patient ${patientName} from Bed ${bed.bed_no}`,
        activityType: 'bed',
        entityType: 'bed',
        entityId: bedId
      },
      client
    );

    const updated = await bedsRepository.findById(bedId, client);
    return serializeBed(updated);
  });
}
