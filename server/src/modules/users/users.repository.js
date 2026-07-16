import { query } from '../../config/db.js';

const SELECT_FIELDS = `
  u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_url,
  u.is_active, u.last_login_at, u.created_at, u.updated_at,
  r.name AS role
`;

export async function findByUsernameOrEmail(identifier, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${SELECT_FIELDS} FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1 OR u.email = $1`,
    [identifier]
  );
  return rows[0] ?? null;
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

export async function updateProfile(id, { fullName, email }, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `UPDATE users SET full_name = COALESCE($2, full_name), email = COALESCE($3, email)
     WHERE id = $1
     RETURNING id`,
    [id, fullName ?? null, email ?? null]
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
    [username, email, passwordHash, fullName, roleId]
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
