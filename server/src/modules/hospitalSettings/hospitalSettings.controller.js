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

export const requestRecoveryEmailChange = asyncHandler(async (req, res) => {
  const result = await hospitalSettingsService.requestRecoveryEmailChange(req.body, req.user);
  sendSuccess(res, { data: result });
});

export const verifyRecoveryEmailChange = asyncHandler(async (req, res) => {
  const result = await hospitalSettingsService.verifyRecoveryEmailChange(req.body, req.user);
  sendSuccess(res, { data: result });
});
