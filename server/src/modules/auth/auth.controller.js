import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  sendSuccess(res, { data: result });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, { data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { data: user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  sendSuccess(res, { data: null });
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const result = await authService.requestPasswordReset(username);
  sendSuccess(res, { data: result });
});

export const forgotPasswordVerify = asyncHandler(async (req, res) => {
  const { username, otp } = req.body;
  const result = await authService.verifyPasswordResetOtp({ username, otp });
  sendSuccess(res, { data: result });
});

export const forgotPasswordReset = asyncHandler(async (req, res) => {
  const { username, resetToken, newPassword } = req.body;
  const result = await authService.resetPassword({ username, resetToken, newPassword });
  sendSuccess(res, { data: result });
});
