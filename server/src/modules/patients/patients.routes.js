import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import { createPatientSchema, updatePatientSchema, listPatientsQuerySchema } from './patients.schema.js';
import * as patientsController from './patients.controller.js';

export const patientsRouter = Router();

const WRITE_ROLES = ['Admin', 'Receptionist'];

patientsRouter.use(authenticate);

patientsRouter.get('/', validate({ query: listPatientsQuerySchema }), patientsController.list);
patientsRouter.get('/:id', validate({ params: idParamSchema }), patientsController.getById);
patientsRouter.post('/', requireRole(...WRITE_ROLES), validate({ body: createPatientSchema }), patientsController.create);
patientsRouter.put(
  '/:id',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: updatePatientSchema }),
  patientsController.update
);
patientsRouter.delete('/:id', requireRole( 'Admin'), validate({ params: idParamSchema }), patientsController.remove);
