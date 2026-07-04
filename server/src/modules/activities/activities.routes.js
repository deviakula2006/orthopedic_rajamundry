import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as activitiesController from './activities.controller.js';

export const activitiesRouter = Router();

activitiesRouter.use(authenticate);
activitiesRouter.get('/', activitiesController.list);
