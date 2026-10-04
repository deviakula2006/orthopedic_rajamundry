import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  listAppointmentTypesQuerySchema
} from './appointmentTypes.schema.js';
import * as controller from './appointmentTypes.controller.js';

export const appointmentTypesRouter = Router();

appointmentTypesRouter.use(authenticate);

appointmentTypesRouter.get(
  '/',
  validate({ query: listAppointmentTypesQuerySchema }),
  controller.list
);

appointmentTypesRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  controller.getById
);

appointmentTypesRouter.post(
  '/',
  requireRole('Admin'),
  validate({ body: createAppointmentTypeSchema }),
  controller.create
);

appointmentTypesRouter.put(
  '/:id',
  requireRole('Admin'),
  validate({ params: idParamSchema, body: updateAppointmentTypeSchema }),
  controller.update
);

appointmentTypesRouter.patch(
  '/:id/status',
  requireRole('Admin'),
  validate({ params: idParamSchema }),
  controller.toggleStatus
);
