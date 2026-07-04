import * as appointmentsRepository from './appointments.repository.js';
import { serializeAppointment } from './appointments.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

const DOUBLE_BOOKING_CONSTRAINT = 'appointments_doctor_id_appointment_date_appointment_time_key';

export async function listAppointments({ page, limit, offset, patientId, doctorId, date, status }) {
  const { rows, total } = await appointmentsRepository.list({ limit, offset, patientId, doctorId, date, status });
  return { items: rows.map(serializeAppointment), meta: buildMeta({ page, limit, total }) };
}

export async function getAppointment(id) {
  const row = await appointmentsRepository.findById(id);
  if (!row) throw ApiError.notFound('Appointment not found');
  return serializeAppointment(row);
}

export async function createAppointment(data, actor) {
  let row;
  try {
    row = await appointmentsRepository.create(data);
  } catch (err) {
    if (err.code === '23505' && err.constraint === DOUBLE_BOOKING_CONSTRAINT) {
      throw ApiError.conflict('This doctor already has an appointment booked at that date and time');
    }
    throw err;
  }

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Booked appointment for ${row.patient_name} with ${row.doctor_name}`,
    activityType: 'appointment',
    entityType: 'appointment',
    entityId: row.id
  });
  return serializeAppointment(row);
}

export async function updateAppointment(id, data, actor) {
  let row;
  try {
    row = await appointmentsRepository.update(id, data);
  } catch (err) {
    if (err.code === '23505' && err.constraint === DOUBLE_BOOKING_CONSTRAINT) {
      throw ApiError.conflict('This doctor already has an appointment booked at that date and time');
    }
    throw err;
  }
  if (!row) throw ApiError.notFound('Appointment not found');

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated appointment ${row.appointment_code}`,
    activityType: 'appointment',
    entityType: 'appointment',
    entityId: row.id
  });
  return serializeAppointment(row);
}

export async function updateAppointmentStatus(id, status, actor) {
  const row = await appointmentsRepository.updateStatus(id, status);
  if (!row) throw ApiError.notFound('Appointment not found');

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Marked appointment ${row.appointment_code} as ${status}`,
    activityType: 'appointment',
    entityType: 'appointment',
    entityId: row.id
  });
  return serializeAppointment(row);
}

// Cancelling, not deleting: appointments are never physically removed so the
// audit trail and doctor schedule history stay intact (see DATABASE_SCHEMA.md #1).
export async function cancelAppointment(id, actor) {
  return updateAppointmentStatus(id, 'Cancelled', actor);
}
