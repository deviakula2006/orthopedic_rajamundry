import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as service from './appointmentTypes.service.js';

export const list = asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly === true || req.query.activeOnly === 'true';
  const items = await service.listAppointmentTypes({ activeOnly });
  sendSuccess(res, { data: items });
});

export const getById = asyncHandler(async (req, res) => {
  const item = await service.getAppointmentType(req.params.id);
  sendSuccess(res, { data: item });
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.createAppointmentType(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: item });
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.updateAppointmentType(req.params.id, req.body, req.user);
  sendSuccess(res, { data: item });
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const item = await service.toggleAppointmentTypeStatus(req.params.id, req.user);
  sendSuccess(res, { data: item });
});
