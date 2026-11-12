import { query } from '../../config/db.js';

const SELECT_FIELDS = `
  u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_url,
  u.is_active, u.last_login_at, u.created_at, u.updated_at,
  r.name AS role
`;

/** Login: match by username only (case-insensitive), exclude soft-deleted accounts. */
export async function findByUsername(identifier, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.username) = LOWER($1) AND u.deleted_at IS NULL`,
    [identifier]
  );
  return rows[0] ?? null;
}

/** Find active, non-deleted user by registered email (case-insensitive). */
export async function findByRegisteredEmail(email, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))
       AND u.deleted_at IS NULL
       AND u.is_active = TRUE
       AND r.name IN ('Admin', 'Doctor', 'Receptionist')`,
    [email]
  );
  return rows[0] ?? null;
}

/** Legacy function used by auth.service.js login — now delegates to username-only lookup. */
export async function findByUsernameOrEmail(identifier, client) {
  return findByUsername(identifier, client);
}

/** Check if a username is taken among non-deleted accounts (excludes excludeId if provided). */
export async function isUsernameTaken(username, excludeUserId, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL ${excludeUserId ? 'AND id != $2' : ''}`,
    excludeUserId ? [username, excludeUserId] : [username]
  );
  return rows.length > 0;
}

/** Check if an email is taken among non-deleted accounts (excludes excludeId if provided). */
export async function isEmailTaken(email, excludeUserId, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL ${excludeUserId ? 'AND id != $2' : ''}`,
    excludeUserId ? [email, excludeUserId] : [email]
  );
  return rows.length > 0;
}

export async function findById(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateLastLogin(id, client) {
  const q = client ? client.query.bind(client) : query;
  await q('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function updateProfile(id, { fullName, email, username }, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE users
       SET full_name = COALESCE($2, full_name),
           email     = COALESCE($3, email),
           username  = COALESCE($4, username)
     WHERE id = $1
     RETURNING id`,
    [id, fullName ?? null, email ? email.toLowerCase().trim() : null, username ? username.trim() : null]
  );
  return rows[0] ? findById(id, client) : null;
}

export async function updatePasswordHash(id, passwordHash, client) {
  const q = client ? client.query.bind(client) : query;
  await q('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [id, passwordHash]);
}

export async function create({ username, email, passwordHash, fullName, roleId }, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO users (username, email, password_hash, full_name, role_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, full_name, role_id, is_active, created_at`,
    [username.trim(), email.toLowerCase().trim(), passwordHash, fullName, roleId]
  );
  return rows[0];
}

export async function findRoleIdByName(name, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q('SELECT id FROM roles WHERE name = $1', [name]);
  return rows[0]?.id ?? null;
}

export async function updateActiveStatus(id, isActive, client) {
  const q = client ? client.query.bind(client) : query;
  await q('UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1', [id, isActive]);
}

/** Soft-delete a user account (sets deleted_at and deactivates). */
export async function softDelete(id, client) {
  const q = client ? client.query.bind(client) : query;
  await q(
    'UPDATE users SET deleted_at = now(), is_active = FALSE, updated_at = now() WHERE id = $1',
    [id]
  );
}
