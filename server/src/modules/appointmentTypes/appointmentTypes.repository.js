import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = 'id, code, name, default_fee, is_active, created_at, updated_at';

export async function list({ activeOnly = false } = {}) {
  const where = activeOnly ? 'WHERE is_active = TRUE' : '';
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM appointment_types ${where} ORDER BY created_at ASC`
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM appointment_types WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findByName(name) {
  const { rows } = await query(
    `SELECT ${BASE_SELECT} FROM appointment_types WHERE LOWER(name) = LOWER($1)`,
    [name]
  );
  return rows[0] ?? null;
}

export async function create({ name, defaultFee = 0, isActive = true }) {
  const { rows } = await query(
    `INSERT INTO appointment_types (name, default_fee, is_active)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, defaultFee, isActive]
  );
  return findById(rows[0].id);
}

export async function update(id, fields) {
  const clause = buildSetClause({
    name: fields.name,
    default_fee: fields.defaultFee,
    is_active: fields.isActive
  });
  if (!clause) return findById(id);

  const { rows } = await query(
    `UPDATE appointment_types SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1}
     RETURNING id`,
    [...clause.values, id]
  );
  return rows[0] ? findById(id) : null;
}

export async function deactivate(id) {
  const { rows } = await query(
    `UPDATE appointment_types SET is_active = FALSE, updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return rows[0] ? findById(id) : null;
}
