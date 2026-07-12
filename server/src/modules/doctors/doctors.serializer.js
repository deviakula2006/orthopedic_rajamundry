export function serializeDoctor(row) {
  return {
    id: row.id,
    code: row.doctor_code,
    name: row.name,
    specialization: row.specialization,
    phone: row.phone,
    email: row.email,
    status: row.status,
    availabilityNote: row.availability_note,
    experienceYears: row.experience_years,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
