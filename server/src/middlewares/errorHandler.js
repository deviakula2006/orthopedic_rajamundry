import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Maps Postgres error codes we can meaningfully translate into HTTP responses.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_MAP = {
  '23505': () => ApiError.conflict('A record with this value already exists'),
  '23503': () => ApiError.badRequest('Referenced record does not exist'),
  '23514': () => ApiError.badRequest('Value violates a data constraint'),
  '22P02': () => ApiError.badRequest('Malformed input value')
};

// function normalizeError(err) {
//   if (err instanceof ApiError) return err;
//   if (err.code && PG_ERROR_MAP[err.code]) return PG_ERROR_MAP[err.code]();
//   return ApiError.internal();
// }
function normalizeError(err) {
  console.log("PG ERROR:", err);

  if (err instanceof ApiError) return err;

  if (err.code && PG_ERROR_MAP[err.code]) return PG_ERROR_MAP[err.code]();

  return ApiError.internal();
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
