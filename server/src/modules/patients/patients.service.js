import * as patientsRepository from './patients.repository.js';
import { serializePatient } from './patients.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listPatients({ page, limit, offset, search }) {
  const { rows, total } = await patientsRepository.list({ limit, offset, search });
  return { items: rows.map(serializePatient), meta: buildMeta({ page, limit, total }) };
}

export async function getPatient(id) {
  const row = await patientsRepository.findById(id);
  if (!row) throw ApiError.notFound('Patient not found');
  return serializePatient(row);
}

export async function createPatient(data, actor) {
  const row = await patientsRepository.create(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Registered new patient ${row.name}`,
    activityType: 'patient',
    entityType: 'patient',
    entityId: row.id
  });
  return serializePatient(row);
}

export async function updatePatient(id, data, actor) {
  const row = await patientsRepository.update(id, data);
  if (!row) throw ApiError.notFound('Patient not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated patient details for ${row.name}`,
    activityType: 'patient',
    entityType: 'patient',
    entityId: row.id
  });
  return serializePatient(row);
}

export async function deletePatient(id, actor) {
  const row = await patientsRepository.softDelete(id);
  if (!row) throw ApiError.notFound('Patient not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Removed patient record of ${row.name}`,
    activityType: 'patient',
    entityType: 'patient',
    entityId: row.id
  });
}
