import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as receptionistsService from './receptionists.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await receptionistsService.listReceptionists({ ...pagination, search: req.query.search });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const receptionist = await receptionistsService.getReceptionist(req.params.id);
  sendSuccess(res, { data: receptionist });
});

export const create = asyncHandler(async (req, res) => {
  const receptionist = await receptionistsService.createReceptionist(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: receptionist });
});

export const update = asyncHandler(async (req, res) => {
  const receptionist = await receptionistsService.updateReceptionist(req.params.id, req.body, req.user);
  sendSuccess(res, { data: receptionist });
});

export const remove = asyncHandler(async (req, res) => {
  await receptionistsService.deleteReceptionist(req.params.id, req.user);
  sendSuccess(res, { data: null });
});
