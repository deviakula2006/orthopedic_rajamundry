/**
 * bed.controller.js
 *
 * Thin controllers — parse request, call service, send response.
 * Zero business logic lives here.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as bedService from './bed.service.js';

// ---------------------------------------------------------------------------
// Wards
// ---------------------------------------------------------------------------

export const listWards = asyncHandler(async (_req, res) => {
  const wards = await bedService.listWards();
  sendSuccess(res, { data: wards });
});

export const createWard = asyncHandler(async (req, res) => {
  const ward = await bedService.createWard(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: ward });
});

export const deleteWard = asyncHandler(async (req, res) => {
  await bedService.deleteWard(req.params.id, req.user);
  sendSuccess(res, { data: null });
});

// ---------------------------------------------------------------------------
// Beds
// ---------------------------------------------------------------------------

export const createBed = asyncHandler(async (req, res) => {
  const bed = await bedService.createBed(req.params.id, req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: bed });
});

export const deleteBed = asyncHandler(async (req, res) => {
  await bedService.deleteBed(req.params.id, req.user);
  sendSuccess(res, { data: null });
});

export const getBed = asyncHandler(async (req, res) => {
  const bed = await bedService.getBed(req.params.id);
  sendSuccess(res, { data: bed });
});

export const assignBed = asyncHandler(async (req, res) => {
  const bed = await bedService.assignBed(req.params.id, req.body.patientId, req.user);
  sendSuccess(res, { data: bed });
});

export const vacateBed = asyncHandler(async (req, res) => {
  const bed = await bedService.vacateBed(req.params.id, req.user);
  sendSuccess(res, { data: bed });
});

// ---------------------------------------------------------------------------
// Stats (for dashboard integration)
// ---------------------------------------------------------------------------

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await bedService.getBedStats();
  sendSuccess(res, { data: stats });
});
