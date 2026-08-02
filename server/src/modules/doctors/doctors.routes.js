import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import { createDoctorSchema, updateDoctorSchema, listDoctorsQuerySchema } from './doctors.schema.js';
import * as doctorsController from './doctors.controller.js';

export const doctorsRouter = Router();

const ADMIN_ROLES = [ 'Admin'];

doctorsRouter.use(authenticate);

doctorsRouter.get('/', validate({ query: listDoctorsQuerySchema }), doctorsController.list);
doctorsRouter.get('/me', doctorsController.getMe);
doctorsRouter.get('/dashboard', doctorsController.getDashboard);
doctorsRouter.get('/:id', validate({ params: idParamSchema }), doctorsController.getById);
doctorsRouter.post('/', requireRole(...ADMIN_ROLES), validate({ body: createDoctorSchema }), doctorsController.create);
doctorsRouter.put(
  '/:id',
  requireRole(...ADMIN_ROLES),
  validate({ params: idParamSchema, body: updateDoctorSchema }),
  doctorsController.update
);
doctorsRouter.patch(
  '/:id/status',
  requireRole(...ADMIN_ROLES),
  validate({ params: idParamSchema }),
  doctorsController.toggleStatus
);
doctorsRouter.delete('/:id', requireRole(...ADMIN_ROLES), validate({ params: idParamSchema }), doctorsController.remove);
