/**
 * Builds a parameterized `col = $n, ...` SET clause from a { column: value }
 * map, skipping any `undefined` values so partial updates only touch fields
 * the caller actually provided (as opposed to COALESCE, which can't
 * distinguish "not provided" from "set to null").
 *
 * Returns null when there is nothing to update.
 */
export function buildSetClause(fields, startIndex = 1) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  const setSql = entries.map(([column], i) => `${column} = $${i + startIndex}`).join(', ');
  const values = entries.map(([, value]) => value);
  return { setSql, values };
}
