import * as receptionistsRepository from './receptionists.repository.js';
import { serializeReceptionist } from './receptionists.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listReceptionists({ page, limit, offset, search }) {
  const { rows, total } = await receptionistsRepository.list({ limit, offset, search });
  return { items: rows.map(serializeReceptionist), meta: buildMeta({ page, limit, total }) };
}

export async function getReceptionist(id) {
  const row = await receptionistsRepository.findById(id);
  if (!row) throw ApiError.notFound('Receptionist not found');
  return serializeReceptionist(row);
}

export async function createReceptionist(data, actor) {
  const row = await receptionistsRepository.create(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Hired receptionist ${row.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });
  return serializeReceptionist(row);
}

export async function updateReceptionist(id, data, actor) {
  const row = await receptionistsRepository.update(id, data);
  if (!row) throw ApiError.notFound('Receptionist not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated profile of receptionist ${row.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });
  return serializeReceptionist(row);
}

export async function deleteReceptionist(id, actor) {
  const row = await receptionistsRepository.softDelete(id);
  if (!row) throw ApiError.notFound('Receptionist not found');
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Terminated receptionist ${row.name} access`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });
}
