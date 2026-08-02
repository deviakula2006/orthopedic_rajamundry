import * as consultationsRepository from './consultations.repository.js';
import {
  serializeConsultation,
  serializeVital,
  serializePrescription,
  serializeConsultationInvestigation
} from './consultations.serializer.js';
import { ApiError } from '../../utils/ApiError.js';
import { query } from '../../config/db.js';
import { logActivity } from '../activities/activities.repository.js';

async function resolveAppointmentId(appointmentIdOrCode) {
  // If valid UUID format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentIdOrCode);
  if (isUuid) return appointmentIdOrCode;

  const { rows } = await query('SELECT id FROM appointments WHERE appointment_code = $1', [appointmentIdOrCode]);
  if (!rows[0]) throw ApiError.notFound('Appointment not found');
  return rows[0].id;
}

async function resolvePatientId(patientIdOrCode) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientIdOrCode);
  if (isUuid) return patientIdOrCode;

  const { rows } = await query('SELECT id FROM patients WHERE patient_code = $1', [patientIdOrCode]);
  if (!rows[0]) throw ApiError.notFound('Patient not found');
  return rows[0].id;
}

async function resolveDoctorId(doctorIdOrCode) {
  if (!doctorIdOrCode) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorIdOrCode);
  if (isUuid) return doctorIdOrCode;

  const { rows } = await query('SELECT id FROM doctors WHERE doctor_code = $1', [doctorIdOrCode]);
  return rows[0]?.id || null;
}

export async function getOrCreateForAppointment(appointmentIdOrCode, _actor) {
  const appointmentId = await resolveAppointmentId(appointmentIdOrCode);
  const consultation = await consultationsRepository.getOrCreateForAppointment(appointmentId);
  if (!consultation) throw ApiError.notFound('Failed to initialize consultation for appointment');
  return serializeConsultation(consultation);
}

export async function getConsultation(id, _actor) {
  const consultation = await consultationsRepository.findById(id);
  if (!consultation) throw ApiError.notFound('Consultation not found');
  return serializeConsultation(consultation);
}

export async function getPatientDoctorEMRHistory({ patientId: patientIdOrCode, doctorId: doctorIdOrCode }) {
  const patientId = await resolvePatientId(patientIdOrCode);
  const doctorId = doctorIdOrCode ? await resolveDoctorId(doctorIdOrCode) : null;

  const consultations = await consultationsRepository.getPatientDoctorEMRHistory({ patientId, doctorId });
  return consultations.map(serializeConsultation);
}

export async function updateConsultation(id, fields, _actor) {
  const current = await consultationsRepository.findById(id);
  if (!current) throw ApiError.notFound('Consultation not found');

  if (current.status === 'Completed') {
    throw ApiError.badRequest('Cannot edit a completed consultation');
  }

  const updated = await consultationsRepository.updateConsultation(id, fields);
  return serializeConsultation(updated);
}

export async function completeConsultation(id, fields, actor) {
  const current = await consultationsRepository.findById(id);
  if (!current) throw ApiError.notFound('Consultation not found');

  const completed = await consultationsRepository.completeConsultationTx(id, fields, actor);
  return serializeConsultation(completed);
}

export async function addVital(data, actor) {
  const patientId = await resolvePatientId(data.patientId);
  const appointmentId = data.appointmentId ? await resolveAppointmentId(data.appointmentId) : null;

  let consultationId = data.consultationId || null;
  if (!consultationId && appointmentId) {
    const cons = await consultationsRepository.getOrCreateForAppointment(appointmentId);
    consultationId = cons?.id || null;
  }

  const vitalRow = await consultationsRepository.addVital({
    ...data,
    patientId,
    appointmentId,
    consultationId,
    recordedByUserId: actor.id
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Recorded vitals for patient`,
    activityType: 'medical',
    entityType: 'vital',
    entityId: vitalRow.id
  });

  return serializeVital(vitalRow);
}

export async function addPrescription(data, _actor) {
  const currentCons = await consultationsRepository.findById(data.consultationId);
  if (!currentCons) throw ApiError.notFound('Consultation not found');

  const rxRow = await consultationsRepository.addPrescription(data);
  return serializePrescription(rxRow);
}

export async function addPrescriptionsBatch({ consultationId, prescriptions }, actor) {
  const currentCons = await consultationsRepository.findById(consultationId);
  if (!currentCons) throw ApiError.notFound('Consultation not found');

  const results = [];
  for (const item of prescriptions) {
    const rxRow = await consultationsRepository.addPrescription({
      consultationId,
      ...item
    });
    results.push(serializePrescription(rxRow));
  }

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Added ${results.length} prescriptions to consultation`,
    activityType: 'medical',
    entityType: 'consultation',
    entityId: consultationId
  });

  return results;
}

export async function orderInvestigation(data, actor) {
  const currentCons = await consultationsRepository.findById(data.consultationId);
  if (!currentCons) throw ApiError.notFound('Consultation not found');

  const invRow = await consultationsRepository.orderInvestigation(data);

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Ordered investigation test: ${invRow.test_name}`,
    activityType: 'medical',
    entityType: 'investigation',
    entityId: invRow.id
  });

  return serializeConsultationInvestigation(invRow);
}
