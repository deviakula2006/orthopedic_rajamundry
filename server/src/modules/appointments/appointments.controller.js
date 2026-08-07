import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as appointmentsService from './appointments.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await appointmentsService.listAppointments({
    ...pagination,
    patientId: req.query.patientId,
    doctorId: req.query.doctorId,
    date: req.query.date,
    status: req.query.status
  });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const appointment = await appointmentsService.getAppointment(req.params.id);
  sendSuccess(res, { data: appointment });
});

export const create = asyncHandler(async (req, res) => {
  const appointment = await appointmentsService.createAppointment(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: appointment });
});

export const update = asyncHandler(async (req, res) => {
  const appointment = await appointmentsService.updateAppointment(req.params.id, req.body, req.user);
  sendSuccess(res, { data: appointment });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const appointment = await appointmentsService.updateAppointmentStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { data: appointment });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await appointmentsService.deleteAppointment(req.params.id, req.user);
  sendSuccess(res, { message: 'Appointment permanently deleted', data: result });
});
