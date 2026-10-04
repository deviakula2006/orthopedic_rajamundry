import { withTransaction } from '../../config/db.js';
import * as appointmentsRepository from './appointments.repository.js';
import * as patientsRepository from '../patients/patients.repository.js';
import * as doctorsRepository from '../doctors/doctors.repository.js';
import * as appointmentTypesRepository from '../appointmentTypes/appointmentTypes.repository.js';
import { serializeAppointment } from './appointments.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';
import { validateAppointmentDateTime, normalizeTo24Hour } from '../../utils/dateTime.js';

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
  // 1. Validate date & time in Asia/Kolkata (IST)
  const timeValidation = validateAppointmentDateTime({
    appointmentDate: data.appointmentDate,
    appointmentTime: data.appointmentTime
  });
  if (!timeValidation.valid) {
    throw ApiError.badRequest(timeValidation.error);
  }

  // 2. Validate patient exists
  const patient = await patientsRepository.findById(data.patientId);
  if (!patient) {
    throw ApiError.notFound('Patient not found');
  }

  // 3. Validate doctor exists
  const doctor = await doctorsRepository.findById(data.doctorId);
  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }
  if (doctor.status !== 'Active') {
    throw ApiError.badRequest('Assigned doctor is not active');
  }

  // 4. Resolve and validate appointment type & fee
  let appointmentTypeId = data.appointmentTypeId || null;
  let type = data.type || null;
  let fee = data.fee;

  if (appointmentTypeId) {
    const apptType = await appointmentTypesRepository.findById(appointmentTypeId);
    if (!apptType) {
      throw ApiError.badRequest('Selected appointment type does not exist');
    }
    if (!apptType.is_active) {
      throw ApiError.badRequest(`Appointment type "${apptType.name}" is inactive`);
    }
    type = apptType.name;
    if (fee === undefined || fee === null) {
      fee = Number(apptType.default_fee);
    }
  } else if (type) {
    const apptType = await appointmentTypesRepository.findByName(type);
    if (apptType) {
      appointmentTypeId = apptType.id;
      if (fee === undefined || fee === null) {
        fee = Number(apptType.default_fee);
      }
    }
  } else {
    // Default to 'Consultation' if neither provided
    const defaultType = await appointmentTypesRepository.findByName('Consultation');
    if (defaultType) {
      appointmentTypeId = defaultType.id;
      type = defaultType.name;
      if (fee === undefined || fee === null) {
        fee = Number(defaultType.default_fee);
      }
    }
  }

  // 5. Patient type validation
  const patientType = data.patientType === 'Inpatient' ? 'Inpatient' : 'Outpatient';

  let row;
  try {
    row = await appointmentsRepository.create({
      ...data,
      appointmentTime: timeValidation.normalizedTime,
      patientType,
      appointmentTypeId,
      type: type || 'Consultation',
      fee: fee ?? 0
    });
  } catch (err) {
    if (isDoubleBookingError(err)) {
      throw ApiError.conflict('This doctor already has an appointment booked at that date and time');
    }
    throw err;
  }

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Booked ${patientType.toLowerCase()} appointment for ${row.patient_name} with ${row.doctor_name}`,
    activityType: 'appointment',
    entityType: 'appointment',
    entityId: row.id
  });
  return serializeAppointment(row);
}

export async function updateAppointment(id, data, actor) {
  return withTransaction(async (client) => {
    const existing = await appointmentsRepository.findById(id, client);
    if (!existing) throw ApiError.notFound('Appointment not found');

    const appointmentDate = data.appointmentDate || existing.appointment_date;
    const appointmentTime = data.appointmentTime || existing.appointment_time;

    if (data.appointmentDate || data.appointmentTime) {
      const timeValidation = validateAppointmentDateTime({
        appointmentDate,
        appointmentTime
      });
      if (!timeValidation.valid) {
        throw ApiError.badRequest(timeValidation.error);
      }
      data.appointmentTime = timeValidation.normalizedTime;
    }

    if (data.appointmentTypeId) {
      const apptType = await appointmentTypesRepository.findById(data.appointmentTypeId);
      if (!apptType) {
        throw ApiError.badRequest('Selected appointment type does not exist');
      }
      data.type = apptType.name;
      if (data.fee === undefined || data.fee === null) {
        data.fee = Number(apptType.default_fee);
      }
    }

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
