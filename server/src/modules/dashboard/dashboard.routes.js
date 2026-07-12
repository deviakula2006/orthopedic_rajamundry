import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import * as dashboardController from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/summary', dashboardController.summary);
