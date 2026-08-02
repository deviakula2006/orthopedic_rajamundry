import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
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
  const history = await consultationsService.getPatientDoctorEMRHistory({
    patientId: req.params.patientId,
    doctorId: req.query.doctorId
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
