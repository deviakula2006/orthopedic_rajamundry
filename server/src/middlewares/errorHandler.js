import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Maps Postgres error codes we can meaningfully translate into HTTP responses.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_MAP = {
  '23505': (err) => {
    const match = err?.detail?.match(/Key \((.+?)\)=\((.+?)\) already exists/);
    if (match) {
      return ApiError.conflict(`${match[1]} '${match[2]}' is already taken`);
    }
    return ApiError.conflict('A record with this value already exists');
  },
  '23503': (err) => {
    if (err?.constraint === 'doctors_user_id_fkey') {
      return ApiError.badRequest('Doctor account is not linked to a valid user account.');
    }
    if (err?.constraint === 'receptionists_user_id_fkey') {
      return ApiError.badRequest('Receptionist account is not linked to a valid user account.');
    }
    if (err?.constraint === 'activities_user_id_fkey') {
      return ApiError.badRequest('Actor account is not linked to a valid user account.');
    }
    if (err?.constraint?.includes('doctor')) {
      return ApiError.badRequest('Doctor account could not be found.');
    }
    if (err?.constraint?.includes('receptionist')) {
      return ApiError.badRequest('Receptionist account could not be found.');
    }
    if (err?.constraint?.includes('patient')) {
      return ApiError.badRequest('Patient account could not be found.');
    }
    return ApiError.badRequest(err?.detail ? `Referenced record does not exist: ${err.detail}` : 'Referenced record does not exist');
  },
  '23514': () => ApiError.badRequest('Value violates a data constraint'),
  '22P02': () => ApiError.badRequest('Malformed input value (check ID format or numeric fields)')
};

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err?.code && PG_ERROR_MAP[err.code]) {
    return PG_ERROR_MAP[err.code](err);
  }

  return ApiError.internal(err?.message || 'Internal server error');
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err);

  if (apiError.statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  } else {
    logger.warn({ code: apiError.code, path: req.path, method: req.method }, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(!env.isProduction && apiError.statusCode >= 500 ? { stack: err.stack } : {})
    }
  });
}
