import { query } from '../../config/db.js';

/**
 * Records an audit/dashboard-feed entry. `client` is optional — pass the
 * transaction client when logging as part of a larger transaction so the
 * activity row is rolled back together with the rest of the operation.
 */
export async function logActivity(
  { userId = null, actorName, action, activityType = 'general', entityType = null, entityId = null },
  client = { query }
) {
  await client.query(
    `INSERT INTO activities (user_id, actor_name, action, activity_type, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, actorName, action, activityType, entityType, entityId]
  );
}

export async function listRecent({ limit, offset }) {
  const { rows } = await query(
    `SELECT id, user_id, actor_name, action, activity_type, entity_type, entity_id, created_at
     FROM activities
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: countRows } = await query('SELECT COUNT(*)::int AS total FROM activities');
  return { rows, total: countRows[0].total };
}
