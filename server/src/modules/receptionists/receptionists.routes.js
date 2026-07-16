import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import {
  createReceptionistSchema,
  updateReceptionistSchema,
  listReceptionistsQuerySchema
} from './receptionists.schema.js';
import * as receptionistsController from './receptionists.controller.js';

export const receptionistsRouter = Router();

const ADMIN_ROLES = ['Admin'];

receptionistsRouter.use(authenticate);

receptionistsRouter.get('/', validate({ query: listReceptionistsQuerySchema }), receptionistsController.list);
receptionistsRouter.get('/:id', validate({ params: idParamSchema }), receptionistsController.getById);
receptionistsRouter.post('/', requireRole(...ADMIN_ROLES), validate({ body: createReceptionistSchema }), receptionistsController.create);
receptionistsRouter.put(
  '/:id',
  requireRole(...ADMIN_ROLES),
  validate({ params: idParamSchema, body: updateReceptionistSchema }),
  receptionistsController.update
);
receptionistsRouter.delete('/:id', requireRole(...ADMIN_ROLES), validate({ params: idParamSchema }), receptionistsController.remove);
