import * as doctorsRepository from './doctors.repository.js';
import { serializeDoctor } from './doctors.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listDoctors({ page, limit, offset, search, status }) {
  const { rows, total } = await doctorsRepository.list({ limit, offset, search, status });
  return { items: rows.map(serializeDoctor), meta: buildMeta({ page, limit, total }) };
}

export async function getDoctor(id) {
  const row = await doctorsRepository.findById(id);
  if (!row) throw ApiError.notFound('Doctor not found');
  return serializeDoctor(row);
}

export async function createDoctor(data, actor) {
  const row = await doctorsRepository.create(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Added Dr. ${row.name} to panel`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });
  return serializeDoctor(row);
}

export async function updateDoctor(id, data, actor) {
  const row = await doctorsRepository.update(id, data);
  if (!row) throw ApiError.notFound('Doctor not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated credentials of Dr. ${row.name}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });
  return serializeDoctor(row);
}

export async function toggleDoctorStatus(id, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor not found');

  const nextStatus = current.status === 'Active' ? 'Inactive' : 'Active';
  const row = await doctorsRepository.setStatus(id, nextStatus);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Toggled status of Dr. ${row.name} to ${nextStatus}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });
  return serializeDoctor(row);
}

export async function deleteDoctor(id, actor) {
  const row = await doctorsRepository.softDelete(id);
  if (!row) throw ApiError.notFound('Doctor not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Removed Dr. ${row.name} from doctors directory`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });
}
