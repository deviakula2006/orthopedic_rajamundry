/**
 * bed.routes.js
 *
 * Mounted at /api/bed-management
 *
 * GET    /wards                 — list all wards (with bed counts)
 * POST   /wards                 — create a ward
 * DELETE /wards/:id             — delete a ward (must have no beds)
 * POST   /wards/:id/beds        — add a bed to a ward
 * GET    /beds/:id              — get a single bed (with patient info)
 * DELETE /beds/:id              — delete a vacant bed
 * POST   /beds/:id/assign       — assign a patient to a vacant bed
 * POST   /beds/:id/vacate       — release an occupied bed
 * GET    /stats                 — aggregate stats for the dashboard
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/commonSchemas.js';
import { createWardSchema, createBedSchema, assignBedSchema } from './bed.schema.js';
import * as bedController from './bed.controller.js';

export const bedManagementRouter = Router();

const WRITE_ROLES = ['Admin', 'Receptionist'];

// All routes require a valid JWT
bedManagementRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Ward routes
// ---------------------------------------------------------------------------
bedManagementRouter.get('/wards', bedController.listWards);

bedManagementRouter.post(
  '/wards',
  requireRole(...WRITE_ROLES),
  validate({ body: createWardSchema }),
  bedController.createWard
);

bedManagementRouter.delete(
  '/wards/:id',
  requireRole('Admin'),
  validate({ params: idParamSchema }),
  bedController.deleteWard
);

// Add a bed to a ward
bedManagementRouter.post(
  '/wards/:id/beds',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: createBedSchema }),
  bedController.createBed
);

// ---------------------------------------------------------------------------
// Bed routes
// ---------------------------------------------------------------------------
bedManagementRouter.get(
  '/beds/:id',
  validate({ params: idParamSchema }),
  bedController.getBed
);

bedManagementRouter.delete(
  '/beds/:id',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema }),
  bedController.deleteBed
);

bedManagementRouter.post(
  '/beds/:id/assign',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema, body: assignBedSchema }),
  bedController.assignBed
);

bedManagementRouter.post(
  '/beds/:id/vacate',
  requireRole(...WRITE_ROLES),
  validate({ params: idParamSchema }),
  bedController.vacateBed
);

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
bedManagementRouter.get('/stats', bedController.getStats);
