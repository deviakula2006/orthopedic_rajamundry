import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = 'id, name, address, contact_phone, license_number, gst_rate, email, updated_at';

export async function get(client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM hospital_settings WHERE id = 1`);
  return rows[0] ?? null;
}

export async function update(fields, client) {
  const q = client ? client.query.bind(client) : query;
  const clause = buildSetClause({
    name: fields.name,
    address: fields.address,
    contact_phone: fields.contactPhone,
    license_number: fields.licenseNumber,
    email: fields.email,
    gst_rate: fields.gstRate !== undefined ? fields.gstRate : undefined
  });
  if (!clause) return get(client);

  await q(`UPDATE hospital_settings SET ${clause.setSql}, updated_at = now() WHERE id = 1`, clause.values);
  return get(client);
}
