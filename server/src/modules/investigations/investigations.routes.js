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
import * as billsController from '../bills/bills.controller.js';
import * as consultationsController from '../consultations/consultations.controller.js';
import { pendingInvestigationsQuerySchema } from '../bills/bills.schema.js';
import { orderInvestigationSchema } from '../consultations/consultations.schema.js';

export const investigationsRouter = Router();

const ADMIN_ROLES = [ 'Admin'];
const STAFF_ROLES = ['Admin', 'Receptionist', 'Doctor'];

investigationsRouter.use(authenticate);

investigationsRouter.get('/pending', validate({ query: pendingInvestigationsQuerySchema }), billsController.getPendingInvestigations);
investigationsRouter.post(
  '/orders',
  requireRole(...STAFF_ROLES),
  validate({ body: orderInvestigationSchema }),
  consultationsController.orderInvestigation
);
investigationsRouter.delete(
  '/orders/:id',
  requireRole(...STAFF_ROLES),
  validate({ params: idParamSchema }),
  consultationsController.cancelInvestigation
);

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
