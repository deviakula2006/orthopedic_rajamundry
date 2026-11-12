import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import {
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordRequestSchema,
  forgotPasswordVerifySchema,
  forgotPasswordResetSchema,
  initiateRecoverySchema,
  sendRecoveryOtpSchema,
  verifyRecoveryOtpSchema,
  resetRecoveryPasswordSchema
} from './auth.schema.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
authRouter.get('/me', authenticate, authController.me);
authRouter.patch('/profile', authenticate, validate({ body: updateProfileSchema }), authController.updateProfile);
authRouter.patch(
  '/password',
  authenticate,
  authRateLimiter,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

// Two-Option OTP Recovery Flow (Email-First)
authRouter.post(
  '/forgot-password/initiate',
  authRateLimiter,
  validate({ body: initiateRecoverySchema }),
  authController.initiateRecovery
);

authRouter.post(
  '/forgot-password/send-otp',
  authRateLimiter,
  validate({ body: sendRecoveryOtpSchema }),
  authController.sendRecoveryOtp
);

authRouter.post(
  '/forgot-password/verify-otp',
  authRateLimiter,
  validate({ body: verifyRecoveryOtpSchema }),
  authController.verifyRecoveryOtp
);

authRouter.post(
  '/forgot-password/reset-password',
  authRateLimiter,
  validate({ body: resetRecoveryPasswordSchema }),
  authController.resetRecoveryPassword
);

// Legacy Username-based Forgot Password Flow (Backwards compatibility)
authRouter.post(
  '/forgot-password/request',
  authRateLimiter,
  validate({ body: forgotPasswordRequestSchema }),
  authController.forgotPasswordRequest
);

authRouter.post(
  '/forgot-password/verify',
  authRateLimiter,
  validate({ body: forgotPasswordVerifySchema }),
  authController.forgotPasswordVerify
);

authRouter.post(
  '/forgot-password/reset',
  authRateLimiter,
  validate({ body: forgotPasswordResetSchema }),
  authController.forgotPasswordReset
);
