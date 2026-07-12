export function serializeBed(row) {
  return {
    id: row.id,
    bedNo: row.bed_no,
    status: row.status,
    ward: { id: row.ward_id, name: row.ward_name, bedType: row.bed_type },
    patient: row.patient_id ? { id: row.patient_id, code: row.patient_code, name: row.patient_name } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function serializeAdmission(row) {
  return {
    id: row.id,
    patient: { id: row.patient_id, name: row.patient_name, code: row.patient_code },
    admittedAt: row.admitted_at,
    dischargedAt: row.discharged_at
  };
}
