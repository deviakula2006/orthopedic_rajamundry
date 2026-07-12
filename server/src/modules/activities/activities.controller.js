import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { parsePagination } from '../../utils/pagination.js';
import * as activitiesService from './activities.service.js';

export const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { items, meta } = await activitiesService.listActivities(pagination);
  sendSuccess(res, { data: items, meta });
});
