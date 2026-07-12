import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  listAppointmentsQuerySchema
} from './appointments.schema.js';
import * as appointmentsController from './appointments.controller.js';

export const appointmentsRouter = Router();

const WRITE_ROLES = [ 'Admin', 'Receptionist'];

appointmentsRouter.use(authenticate);

appointmentsRouter.get('/', validate({ query: listAppointmentsQuerySchema }), appointmentsController.list);
appointmentsRouter.get('/:id', validate({ params: idParamSchema }), appointmentsController.getById);
appointmentsRouter.post(
  '/',
  requireRole(...WRITE_ROLES),
  validate({ body: createAppointmentSchema }),
  appointmentsController.create
);
appointmentsRouter.put(
  '/:id',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: updateAppointmentSchema }),
  appointmentsController.update
);
appointmentsRouter.patch(
  '/:id/status',
  requireRole(...WRITE_ROLES, 'Doctor'),
  validate({ params: idParamSchema, body: updateAppointmentStatusSchema }),
  appointmentsController.updateStatus
);
appointmentsRouter.delete(
  '/:id',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema }),
  appointmentsController.remove
);
