import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import {
  createInvestigationSchema,
  updateInvestigationSchema,
  listInvestigationsQuerySchema
} from './investigations.schema.js';
import * as investigationsController from './investigations.controller.js';

export const investigationsRouter = Router();

const ADMIN_ROLES = [ 'Admin'];

investigationsRouter.use(authenticate);

investigationsRouter.get('/', validate({ query: listInvestigationsQuerySchema }), investigationsController.list);
investigationsRouter.get('/:id', validate({ params: idParamSchema }), investigationsController.getById);
investigationsRouter.post(
  '/',
  requireRole(...ADMIN_ROLES),
  validate({ body: createInvestigationSchema }),
  investigationsController.create
);
investigationsRouter.put(
  '/:id',
  requireRole(...ADMIN_ROLES),
  validate({ params: idParamSchema, body: updateInvestigationSchema }),
  investigationsController.update
);
investigationsRouter.delete(
  '/:id',
  requireRole(...ADMIN_ROLES),
  validate({ params: idParamSchema }),
  investigationsController.remove
);
