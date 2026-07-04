export function serializeAppointment(row) {
  return {
    id: row.id,
    code: row.appointment_code,
    patient: { id: row.patient_id, code: row.patient_code, name: row.patient_name },
    doctor: { id: row.doctor_id, code: row.doctor_code, name: row.doctor_name },
    date: row.appointment_date,
    time: row.appointment_time,
    type: row.type,
    status: row.status,
    fee: Number(row.fee),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
