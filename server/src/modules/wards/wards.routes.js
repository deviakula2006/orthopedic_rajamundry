import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as wardsController from './wards.controller.js';

export const wardsRouter = Router();

wardsRouter.use(authenticate);
wardsRouter.get('/', wardsController.list);
wardsRouter.get('/:id', wardsController.getById);
