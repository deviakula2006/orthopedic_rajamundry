import { query } from '../../config/db.js';

export async function list() {
  const { rows } = await query('SELECT id, name, bed_type, base_rate FROM wards ORDER BY id ASC');
  return rows;
}

export async function findById(id) {
  const { rows } = await query('SELECT id, name, bed_type, base_rate FROM wards WHERE id = $1', [id]);
  return rows[0] ?? null;
}
