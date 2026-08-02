import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as doctorsService from './doctors.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await doctorsService.listDoctors({ ...pagination, search: req.query.search, status: req.query.status });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.getDoctor(req.params.id);
  sendSuccess(res, { data: doctor });
});

export const create = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.createDoctor(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: doctor });
});

export const update = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.updateDoctor(req.params.id, req.body, req.user);
  sendSuccess(res, { data: doctor });
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.toggleDoctorStatus(req.params.id, req.user);
  sendSuccess(res, { data: doctor });
});

export const remove = asyncHandler(async (req, res) => {
  await doctorsService.deleteDoctor(req.params.id, req.user);
  sendSuccess(res, { data: null });
});

export const getMe = asyncHandler(async (req, res) => {
  const doctor = await doctorsService.getDoctorMe(req.user);
  sendSuccess(res, { data: doctor });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const summary = await doctorsService.getDoctorDashboard(req.user, req.query);
  sendSuccess(res, { data: summary });
});
