import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as investigationsService from './investigations.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await investigationsService.listInvestigations({
    ...pagination,
    search: req.query.search,
    category: req.query.category,
    includeInactive: req.query.includeInactive
  });
  sendSuccess(res, { data: items, meta });
});

export const getById = asyncHandler(async (req, res) => {
  const investigation = await investigationsService.getInvestigation(req.params.id);
  sendSuccess(res, { data: investigation });
});

export const create = asyncHandler(async (req, res) => {
  const investigation = await investigationsService.createInvestigation(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: investigation });
});

export const update = asyncHandler(async (req, res) => {
  const investigation = await investigationsService.updateInvestigation(req.params.id, req.body);
  sendSuccess(res, { data: investigation });
});

export const remove = asyncHandler(async (req, res) => {
  await investigationsService.deactivateInvestigation(req.params.id);
  sendSuccess(res, { data: null });
});
