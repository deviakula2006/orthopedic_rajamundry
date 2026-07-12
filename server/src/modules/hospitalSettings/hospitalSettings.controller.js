import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as hospitalSettingsService from './hospitalSettings.service.js';

export const get = asyncHandler(async (req, res) => {
  const settings = await hospitalSettingsService.getHospitalSettings();
  sendSuccess(res, { data: settings });
});

export const update = asyncHandler(async (req, res) => {
  const settings = await hospitalSettingsService.updateHospitalSettings(req.body, req.user);
  sendSuccess(res, { data: settings });
});
