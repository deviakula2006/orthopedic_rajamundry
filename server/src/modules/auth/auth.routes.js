import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema.js';
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
