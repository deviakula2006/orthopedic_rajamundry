import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as dashboardService from './dashboard.service.js';

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  sendSuccess(res, { data });
});
