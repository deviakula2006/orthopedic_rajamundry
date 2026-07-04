import { query } from '../../config/db.js';

const SELECT_FIELDS = `
  u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_url,
  u.is_active, u.last_login_at, u.created_at, u.updated_at,
  r.name AS role
`;

export async function findByUsernameOrEmail(identifier) {
  const { rows } = await query(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1 OR u.email = $1`,
    [identifier]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateLastLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function updateProfile(id, { fullName, email }) {
  const { rows } = await query(
    `UPDATE users SET full_name = COALESCE($2, full_name), email = COALESCE($3, email)
     WHERE id = $1
     RETURNING id`,
    [id, fullName ?? null, email ?? null]
  );
  return rows[0] ? findById(id) : null;
}

export async function updatePasswordHash(id, passwordHash) {
  await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [id, passwordHash]);
}
