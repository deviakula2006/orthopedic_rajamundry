export function serializePatient(row) {
  return {
    id: row.id,
    code: row.patient_code,
    name: row.name,
    age: row.age,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    address: row.address,
    bloodGroup: row.blood_group,
    diagnosis: row.primary_diagnosis,
    lastVisitDate: row.last_visit_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
