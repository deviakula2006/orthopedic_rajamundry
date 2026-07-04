export function serializeActivity(row) {
  return {
    id: row.id,
    userId: row.user_id,
    actorName: row.actor_name,
    action: row.action,
    type: row.activity_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at
  };
}
