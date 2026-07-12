import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { updateHospitalSettingsSchema } from './hospitalSettings.schema.js';
import * as hospitalSettingsController from './hospitalSettings.controller.js';

export const hospitalSettingsRouter = Router();

hospitalSettingsRouter.use(authenticate);

hospitalSettingsRouter.get('/', hospitalSettingsController.get);
hospitalSettingsRouter.put(
  '/',
  requireRole( 'Admin'),
  validate({ body: updateHospitalSettingsSchema }),
  hospitalSettingsController.update
);
