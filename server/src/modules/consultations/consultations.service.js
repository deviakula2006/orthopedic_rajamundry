import * as consultationsRepository from './consultations.repository.js';
import * as investigationsRepository from '../investigations/investigations.repository.js';
import * as patientsRepository from '../patients/patients.repository.js';
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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentIdOrCode);
  const sql = isUuid
    ? 'SELECT id FROM appointments WHERE id = $1'
    : 'SELECT id FROM appointments WHERE appointment_code = $1';
  const { rows } = await query(sql, [appointmentIdOrCode]);
  if (!rows[0]) throw ApiError.notFound('Appointment not found');
  return rows[0].id;
}

async function resolvePatientId(patientIdOrCode) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientIdOrCode);
  const sql = isUuid
    ? 'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL'
    : 'SELECT id FROM patients WHERE patient_code = $1 AND deleted_at IS NULL';
  const { rows } = await query(sql, [patientIdOrCode]);
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
  let consultationId = data.consultationId || null;
  let patientId = data.patientId || null;

  if (consultationId) {
    const currentCons = await consultationsRepository.findById(consultationId);
    if (!currentCons) throw ApiError.notFound('Consultation not found');
    patientId = currentCons.patientId || currentCons.patient_id;
  } else if (data.appointmentId) {
    const resolvedAptId = await resolveAppointmentId(data.appointmentId);
    const cons = await consultationsRepository.getOrCreateForAppointment(resolvedAptId);
    if (!cons) throw ApiError.notFound('Consultation for appointment not found');
    consultationId = cons.id;
    patientId = cons.patientId || cons.patient_id;
  } else if (patientId) {
    const resolvedPatId = await resolvePatientId(patientId);
    patientId = resolvedPatId;
  } else {
    throw ApiError.badRequest('Either consultationId, appointmentId, or patientId must be provided');
  }

  let testName = data.testName?.trim();
  let investigationId = data.investigationId || null;

  if (!testName && investigationId) {
    const inv = await investigationsRepository.findById(investigationId);
    if (!inv) throw ApiError.notFound('Investigation catalog item not found');
    testName = inv.test_name;
  } else if (testName && !investigationId) {
    const { rows: matchedInv } = await query(
      `SELECT id FROM investigations WHERE LOWER(test_name) = LOWER($1) AND is_active = TRUE LIMIT 1`,
      [testName]
    );
    if (matchedInv[0]) {
      investigationId = matchedInv[0].id;
    }
  }

  if (!testName) {
    throw ApiError.badRequest('Investigation test name is required');
  }

  const invRow = await consultationsRepository.orderInvestigation({
    consultationId,
    patientId,
    investigationId,
    testName,
    orderedByUserId: actor?.id || null,
    orderedByName: actor?.name || null
  });

  await logActivity({
    userId: actor?.id || null,
    actorName: actor?.name || 'Staff',
    action: `Ordered investigation test: ${invRow.test_name}`,
    activityType: 'medical',
    entityType: 'investigation',
    entityId: invRow.id
  });

  return serializeConsultationInvestigation(invRow);
}

export async function cancelInvestigationOrder(orderId, actor) {
  const row = await consultationsRepository.findInvestigationOrderById(orderId);
  if (!row) throw ApiError.notFound('Investigation order not found');
  if (row.bill_id || row.billing_status === 'Billed') {
    throw ApiError.badRequest('Cannot cancel an already-billed investigation order');
  }
  await consultationsRepository.cancelInvestigationOrder(orderId);
  await logActivity({
    userId: actor?.id || null,
    actorName: actor?.name || 'Staff',
    action: `Cancelled investigation test: ${row.test_name}`,
    activityType: 'medical',
    entityType: 'investigation',
    entityId: orderId
  });
  return { id: orderId, status: 'Cancelled' };
}
