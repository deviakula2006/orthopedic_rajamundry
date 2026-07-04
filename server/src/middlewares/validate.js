import { ApiError } from '../utils/ApiError.js';

/**
 * Validates a request against zod schemas and replaces req.body/query/params
 * with the parsed (and coerced/defaulted) values.
 *
 * Usage: validate({ body: createPatientSchema, query: listQuerySchema })
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(ApiError.badRequest('Validation failed', result.error.flatten().fieldErrors));
      }
      req[key] = result.data;
    }
    next();
  };
}
