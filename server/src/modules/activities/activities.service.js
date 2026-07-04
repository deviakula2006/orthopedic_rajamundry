import * as activitiesRepository from './activities.repository.js';
import { serializeActivity } from './activities.serializer.js';
import { buildMeta } from '../../utils/pagination.js';

export async function listActivities({ page, limit, offset }) {
  const { rows, total } = await activitiesRepository.listRecent({ limit, offset });
  return { items: rows.map(serializeActivity), meta: buildMeta({ page, limit, total }) };
}
