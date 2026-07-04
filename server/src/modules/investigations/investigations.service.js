import * as investigationsRepository from './investigations.repository.js';
import { serializeInvestigation } from './investigations.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listInvestigations({ page, limit, offset, search, category, includeInactive }) {
  const { rows, total } = await investigationsRepository.list({ limit, offset, search, category, includeInactive });
  return { items: rows.map(serializeInvestigation), meta: buildMeta({ page, limit, total }) };
}

export async function getInvestigation(id) {
  const row = await investigationsRepository.findById(id);
  if (!row) throw ApiError.notFound('Investigation not found');
  return serializeInvestigation(row);
}

export async function createInvestigation(data, actor) {
  const row = await investigationsRepository.create(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Added investigation test: ${row.test_name}`,
    activityType: 'medical',
    entityType: 'investigation',
    entityId: row.id
  });
  return serializeInvestigation(row);
}

export async function updateInvestigation(id, data) {
  const row = await investigationsRepository.update(id, data);
  if (!row) throw ApiError.notFound('Investigation not found');
  return serializeInvestigation(row);
}

export async function deactivateInvestigation(id) {
  const row = await investigationsRepository.deactivate(id);
  if (!row) throw ApiError.notFound('Investigation not found');
}
