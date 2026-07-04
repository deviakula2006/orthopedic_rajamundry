import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as bedsService from './beds.service.js';

export const list = asyncHandler(async (req, res) => {
  const beds = await bedsService.listBeds({ wardId: req.query.wardId, status: req.query.status });
  sendSuccess(res, { data: beds });
});

export const getById = asyncHandler(async (req, res) => {
  const bed = await bedsService.getBed(req.params.id);
  sendSuccess(res, { data: bed });
});

export const admissionHistory = asyncHandler(async (req, res) => {
  const history = await bedsService.getBedAdmissionHistory(req.params.id);
  sendSuccess(res, { data: history });
});

export const assign = asyncHandler(async (req, res) => {
  const bed = await bedsService.assignBed(req.params.id, req.body.patientId, req.user);
  sendSuccess(res, { data: bed });
});

export const release = asyncHandler(async (req, res) => {
  const bed = await bedsService.releaseBed(req.params.id, req.user);
  sendSuccess(res, { data: bed });
});
