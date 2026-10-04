import { formatTo12Hour } from '../../utils/dateTime.js';

export function serializeAppointment(row) {
  return {
    id: row.id,
    code: row.appointment_code,
    patient: { id: row.patient_id, code: row.patient_code, name: row.patient_name },
    doctor: { id: row.doctor_id, code: row.doctor_code, name: row.doctor_name },
    date: row.appointment_date,
    time: row.appointment_time ? formatTo12Hour(row.appointment_time) : '',
    rawTime: row.appointment_time,
    type: row.appointment_type_name || row.type,
    patientType: row.patient_type || 'Outpatient',
    appointmentTypeId: row.appointment_type_id || null,
    status: row.status,
    fee: Number(row.fee),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
