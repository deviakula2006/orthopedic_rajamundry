import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as doctorsRepository from '../doctors/doctors.repository.js';
import * as consultationsService from './consultations.service.js';

export const getOrCreateForAppointment = asyncHandler(async (req, res) => {
  const consultation = await consultationsService.getOrCreateForAppointment(
    req.params.appointmentId
  );
  sendSuccess(res, { data: consultation });
});

export const getById = asyncHandler(async (req, res) => {
  const consultation = await consultationsService.getConsultation(req.params.id);
  sendSuccess(res, { data: consultation });
});

export const getPatientDoctorEMRHistory = asyncHandler(async (req, res) => {
  let doctorId = req.query.doctorId;
  if (req.user?.role === 'Doctor') {
    const doctor = await doctorsRepository.findByUserId(req.user.id);
    if (!doctor) throw ApiError.forbidden('Doctor profile not found');
    doctorId = doctor.id;
    const isAssociated = await doctorsRepository.isPatientAssociatedWithDoctor(req.params.patientId, doctor.id);
    if (!isAssociated) {
      throw ApiError.forbidden('You do not have permission to access this patient history');
    }
  }
  const history = await consultationsService.getPatientDoctorEMRHistory({
    patientId: req.params.patientId,
    doctorId
  });
  sendSuccess(res, { data: history });
});

export const update = asyncHandler(async (req, res) => {
  const consultation = await consultationsService.updateConsultation(
    req.params.id,
    req.body,
    req.user
  );
  sendSuccess(res, { data: consultation });
});

export const complete = asyncHandler(async (req, res) => {
  const consultation = await consultationsService.completeConsultation(
    req.params.id,
    req.body,
    req.user
  );
  sendSuccess(res, { data: consultation });
});

export const addVital = asyncHandler(async (req, res) => {
  const vital = await consultationsService.addVital(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: vital });
});

export const addPrescription = asyncHandler(async (req, res) => {
  const rx = await consultationsService.addPrescription(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: rx });
});

export const addPrescriptionsBatch = asyncHandler(async (req, res) => {
  const rxs = await consultationsService.addPrescriptionsBatch(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: rxs });
});

export const orderInvestigation = asyncHandler(async (req, res) => {
  const inv = await consultationsService.orderInvestigation(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: inv });
});

export const orderInvestigationsBatch = asyncHandler(async (req, res) => {
  const results = await consultationsService.orderInvestigationsBatch(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: results });
});

export const cancelInvestigation = asyncHandler(async (req, res) => {
  const result = await consultationsService.cancelInvestigationOrder(req.params.id, req.user);
  sendSuccess(res, { data: result });
});
