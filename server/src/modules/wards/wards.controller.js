import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as wardsRepository from './wards.repository.js';
import { serializeWard } from './wards.serializer.js';

export const list = asyncHandler(async (req, res) => {
  const rows = await wardsRepository.list();
  sendSuccess(res, { data: rows.map(serializeWard) });
});

export const getById = asyncHandler(async (req, res) => {
  const row = await wardsRepository.findById(req.params.id);
  if (!row) throw ApiError.notFound('Ward not found');
  sendSuccess(res, { data: serializeWard(row) });
});
