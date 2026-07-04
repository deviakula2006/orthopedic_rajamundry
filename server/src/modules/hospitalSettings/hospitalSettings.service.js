import * as hospitalSettingsRepository from './hospitalSettings.repository.js';
import { serializeHospitalSettings } from './hospitalSettings.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export async function getHospitalSettings() {
  const row = await hospitalSettingsRepository.get();
  if (!row) throw ApiError.internal('Hospital settings row is missing');
  return serializeHospitalSettings(row);
}

export async function updateHospitalSettings(data, actor) {
  const row = await hospitalSettingsRepository.update(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: 'Updated hospital organization details',
    activityType: 'general',
    entityType: 'hospital_settings',
    entityId: null
  });
  return serializeHospitalSettings(row);
}
