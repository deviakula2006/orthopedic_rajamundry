import { query } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';

const BASE_SELECT = 'id, name, address, contact_phone, license_number, gst_rate, email, pending_email, is_email_verified, updated_at';

export async function get(client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(`SELECT ${BASE_SELECT} FROM hospital_settings WHERE id = 1`);
  return rows[0] ?? null;
}

export async function getWithVerificationDetails(client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT id, name, address, contact_phone, license_number, gst_rate, email,
            pending_email, email_verification_otp_hash, email_verification_expires_at,
            is_email_verified, updated_at
     FROM hospital_settings WHERE id = 1`
  );
  return rows[0] ?? null;
}

export async function setPendingRecoveryEmail({ pendingEmail, otpHash, expiresAt }, client) {
  const q = client ? client.query.bind(client) : query;
  await q(
    `UPDATE hospital_settings
     SET pending_email = $1,
         email_verification_otp_hash = $2,
         email_verification_expires_at = $3,
         updated_at = now()
     WHERE id = 1`,
    [pendingEmail, otpHash, expiresAt]
  );
  return get(client);
}

export async function verifyAndApplyRecoveryEmail(client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE hospital_settings
     SET email = pending_email,
         pending_email = NULL,
         email_verification_otp_hash = NULL,
         email_verification_expires_at = NULL,
         email_verified_at = now(),
         is_email_verified = TRUE,
         updated_at = now()
     WHERE id = 1
     RETURNING ${BASE_SELECT}`
  );
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
