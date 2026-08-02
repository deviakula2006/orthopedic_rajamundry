import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  updateConsultationSchema,
  completeConsultationSchema,
  createVitalsSchema,
  createPrescriptionSchema,
  createPrescriptionsBatchSchema,
  orderInvestigationSchema
} from './consultations.schema.js';
import * as controller from './consultations.controller.js';

export const consultationsRouter = Router();

consultationsRouter.use(authenticate);

consultationsRouter.get('/appointment/:appointmentId', controller.getOrCreateForAppointment);
consultationsRouter.get('/patient/:patientId/history', controller.getPatientDoctorEMRHistory);
consultationsRouter.get('/:id', controller.getById);

consultationsRouter.put(
  '/:id',
  requireRole('Doctor', 'Admin'),
  validate({ body: updateConsultationSchema }),
  controller.update
);

consultationsRouter.post(
  '/:id/complete',
  requireRole('Doctor', 'Admin'),
  validate({ body: completeConsultationSchema }),
  controller.complete
);

consultationsRouter.post(
  '/vitals',
  requireRole('Admin', 'Receptionist', 'Doctor'),
  validate({ body: createVitalsSchema }),
  controller.addVital
);

consultationsRouter.post(
  '/prescriptions',
  requireRole('Doctor', 'Admin'),
  validate({ body: createPrescriptionSchema }),
  controller.addPrescription
);

consultationsRouter.post(
  '/prescriptions/batch',
  requireRole('Doctor', 'Admin'),
  validate({ body: createPrescriptionsBatchSchema }),
  controller.addPrescriptionsBatch
);

consultationsRouter.post(
  '/investigations',
  requireRole('Doctor', 'Admin'),
  validate({ body: orderInvestigationSchema }),
  controller.orderInvestigation
);
