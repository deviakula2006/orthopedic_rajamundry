export function serializeReceptionist(row) {
  return {
    id: row.id,
    code: row.receptionist_code,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    shift: row.shift,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
