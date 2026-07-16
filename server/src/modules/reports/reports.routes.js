import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { getReportQuerySchema } from './reports.schema.js';
import * as reportsController from './reports.controller.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.use(requireRole('Admin', 'Receptionist'));

reportsRouter.get('/revenue', validate({ query: getReportQuerySchema }), reportsController.getRevenueReport);
reportsRouter.get('/patients', validate({ query: getReportQuerySchema }), reportsController.getPatientsReport);
reportsRouter.get('/investigations', validate({ query: getReportQuerySchema }), reportsController.getInvestigationsReport);
