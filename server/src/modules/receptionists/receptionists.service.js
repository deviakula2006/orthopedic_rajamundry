import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import * as receptionistsRepository from './receptionists.repository.js';
import { serializeReceptionist } from './receptionists.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';
import * as usersRepository from '../users/users.repository.js';
import { withTransaction } from '../../config/db.js';

export async function listReceptionists({ page, limit, offset, search }) {
  const { rows, total } = await receptionistsRepository.list({ limit, offset, search });
  return { items: rows.map(serializeReceptionist), meta: buildMeta({ page, limit, total }) };
}

export async function getReceptionist(id) {
  const row = await receptionistsRepository.findById(id);
  if (!row) throw ApiError.notFound('Receptionist not found');
  return serializeReceptionist(row);
}

export async function createReceptionist(data, actor) {
  // 1. Check if email already exists
  const existingUser = await usersRepository.findByUsernameOrEmail(data.email);
  if (existingUser) {
    throw ApiError.badRequest('Email is already registered');
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  // 3. Run transaction
  const resultRec = await withTransaction(async (client) => {
    // 3.1 Find Receptionist role ID
    const roleId = await usersRepository.findRoleIdByName('Receptionist', client);
    if (!roleId) throw ApiError.internal('Role "Receptionist" not found in database');

    // 3.2 Generate unique, stable username
    let baseUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
    if (!baseUsername) baseUsername = 'receptionist';
    let username = baseUsername;
    let counter = 1;
    while (await usersRepository.findByUsernameOrEmail(username, client)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // 3.3 Create user account
    const userRow = await usersRepository.create({
      username,
      email: data.email,
      passwordHash,
      fullName: data.name,
      roleId
    }, client);

    // 3.4 Create receptionist profile
    const recRow = await receptionistsRepository.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: data.status,
      shift: data.shift,
      userId: userRow.id
    }, client);

    return recRow;
  });

  // 4. Log activity
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Registered new receptionist: ${resultRec.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: resultRec.id
  });

  return serializeReceptionist(resultRec);
}

export async function updateReceptionist(id, data, actor) {
  const current = await receptionistsRepository.findById(id);
  if (!current) throw ApiError.notFound('Receptionist not found');

  // If email is changing, check duplicate in users table
  if (data.email && data.email !== current.email) {
    const existingUser = await usersRepository.findByUsernameOrEmail(data.email);
    if (existingUser && existingUser.id !== current.user_id) {
      throw ApiError.badRequest('Email is already registered');
    }
  }

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      // Sync user profile
      await usersRepository.updateProfile(current.user_id, {
        fullName: data.name,
        email: data.email
      }, client);

      // Sync active status
      if (data.status) {
        await usersRepository.updateActiveStatus(current.user_id, data.status === 'Active', client);
      }

      // Sync password if provided and not empty
      if (data.password && data.password.trim() !== '') {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);
        await usersRepository.updatePasswordHash(current.user_id, passwordHash, client);
      }
    }

    return await receptionistsRepository.update(id, data, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated details of receptionist ${row.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });

  return serializeReceptionist(row);
}

export async function deleteReceptionist(id, actor) {
  const current = await receptionistsRepository.findById(id);
  if (!current) throw ApiError.notFound('Receptionist not found');

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      await usersRepository.updateActiveStatus(current.user_id, false, client);
    }
    return await receptionistsRepository.softDelete(id, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Removed receptionist ${row.name} from directory`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });
}
