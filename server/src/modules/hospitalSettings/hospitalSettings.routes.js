import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  updateHospitalSettingsSchema,
  requestRecoveryEmailChangeSchema,
  verifyRecoveryEmailChangeSchema
} from './hospitalSettings.schema.js';
import * as hospitalSettingsController from './hospitalSettings.controller.js';

export const hospitalSettingsRouter = Router();

hospitalSettingsRouter.use(authenticate);

hospitalSettingsRouter.get('/', hospitalSettingsController.get);
hospitalSettingsRouter.put(
  '/',
  requireRole('Admin'),
  validate({ body: updateHospitalSettingsSchema }),
  hospitalSettingsController.update
);
hospitalSettingsRouter.patch(
  '/',
  requireRole('Admin'),
  validate({ body: updateHospitalSettingsSchema }),
  hospitalSettingsController.update
);

hospitalSettingsRouter.post(
  '/recovery-email/request',
  requireRole('Admin'),
  validate({ body: requestRecoveryEmailChangeSchema }),
  hospitalSettingsController.requestRecoveryEmailChange
);

hospitalSettingsRouter.post(
  '/recovery-email/verify',
  requireRole('Admin'),
  validate({ body: verifyRecoveryEmailChangeSchema }),
  hospitalSettingsController.verifyRecoveryEmailChange
);
