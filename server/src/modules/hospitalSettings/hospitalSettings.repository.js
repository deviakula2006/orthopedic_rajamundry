import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = 'id, name, address, contact_phone, license_number, updated_at';

export async function get() {
  const { rows } = await query(`SELECT ${BASE_SELECT} FROM hospital_settings WHERE id = 1`);
  return rows[0] ?? null;
}

export async function update(fields) {
  const clause = buildSetClause({
    name: fields.name,
    address: fields.address,
    contact_phone: fields.contactPhone,
    license_number: fields.licenseNumber
  });
  if (!clause) return get();

  await query(`UPDATE hospital_settings SET ${clause.setSql}, updated_at = now() WHERE id = 1`, clause.values);
  return get();
}
