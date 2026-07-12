export function sendSuccess(res, { statusCode = 200, data = null, meta } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}
