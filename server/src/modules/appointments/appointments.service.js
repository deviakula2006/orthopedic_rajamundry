import { withTransaction } from '../../config/db.js';
import * as appointmentsRepository from './appointments.repository.js';
import { serializeAppointment } from './appointments.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

const DOUBLE_BOOKING_CONSTRAINTS = [
  'appointments_doctor_id_appointment_date_appointment_time_key',
  'idx_unique_active_doctor_appointment'
];

function isDoubleBookingError(err) {
  return err.code === '23505' && (DOUBLE_BOOKING_CONSTRAINTS.includes(err.constraint) || DOUBLE_BOOKING_CONSTRAINTS.includes(err.detail));
}

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
    if (isDoubleBookingError(err)) {
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
  return withTransaction(async (client) => {
    let row;
    try {
      row = await appointmentsRepository.update(id, data, client);
    } catch (err) {
      if (isDoubleBookingError(err)) {
        throw ApiError.conflict('This doctor already has an appointment booked at that date and time');
      }
      throw err;
    }
    if (!row) throw ApiError.notFound('Appointment not found');

    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Rescheduled appointment ${row.appointment_code} with ${row.doctor_name}`,
        activityType: 'appointment',
        entityType: 'appointment',
        entityId: row.id
      },
      client
    );
    return serializeAppointment(row);
  });
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

export async function cancelAppointment(id, actor) {
  return updateAppointmentStatus(id, 'Cancelled', actor);
}

export async function deleteAppointment(id, actor) {
  return withTransaction(async (client) => {
    const existing = await appointmentsRepository.findById(id);
    if (!existing) throw ApiError.notFound('Appointment not found');

    const deleted = await appointmentsRepository.deletePermanent(id, client);
    if (!deleted) throw ApiError.notFound('Appointment not found');

    await logActivity(
      {
        userId: actor.id,
        actorName: actor.name,
        action: `Permanently deleted appointment ${existing.appointment_code}`,
        activityType: 'appointment',
        entityType: 'appointment',
        entityId: id
      },
      client
    );

    return { id, appointmentCode: existing.appointment_code, deleted: true };
  });
}
