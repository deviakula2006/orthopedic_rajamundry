import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import { assignBedSchema, listBedsQuerySchema } from './beds.schema.js';
import * as bedsController from './beds.controller.js';

export const bedsRouter = Router();

const WRITE_ROLES = ['Super Admin', 'Admin', 'Receptionist'];

bedsRouter.use(authenticate);

bedsRouter.get('/', validate({ query: listBedsQuerySchema }), bedsController.list);
bedsRouter.get('/:id', validate({ params: idParamSchema }), bedsController.getById);
bedsRouter.get('/:id/admissions', validate({ params: idParamSchema }), bedsController.admissionHistory);
bedsRouter.post(
  '/:id/assign',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: assignBedSchema }),
  bedsController.assign
);
bedsRouter.post('/:id/release', requireRole(...WRITE_ROLES), validate({ params: idParamSchema }), bedsController.release);
