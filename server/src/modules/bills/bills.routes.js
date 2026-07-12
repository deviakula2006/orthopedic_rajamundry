import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import { createBillSchema, updateBillStatusSchema, listBillsQuerySchema } from './bills.schema.js';
import * as billsController from './bills.controller.js';

export const billsRouter = Router();

const WRITE_ROLES = [ 'Admin', 'Receptionist'];

billsRouter.use(authenticate);

billsRouter.get('/', validate({ query: listBillsQuerySchema }), billsController.list);
billsRouter.get('/:id', validate({ params: idParamSchema }), billsController.getById);
billsRouter.post('/', requireRole(...WRITE_ROLES), validate({ body: createBillSchema }), billsController.create);
billsRouter.patch(
  '/:id/status',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: updateBillStatusSchema }),
  billsController.updateStatus
);
