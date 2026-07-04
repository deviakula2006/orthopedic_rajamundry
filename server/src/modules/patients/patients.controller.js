import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as patientsService from './patients.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await patientsService.listPatients({ ...pagination, search: req.query.search });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const patient = await patientsService.getPatient(req.params.id);
  sendSuccess(res, { data: patient });
});

export const create = asyncHandler(async (req, res) => {
  const patient = await patientsService.createPatient(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: patient });
});

export const update = asyncHandler(async (req, res) => {
  const patient = await patientsService.updatePatient(req.params.id, req.body, req.user);
  sendSuccess(res, { data: patient });
});

export const remove = asyncHandler(async (req, res) => {
  await patientsService.deletePatient(req.params.id, req.user);
  sendSuccess(res, { data: null });
});
