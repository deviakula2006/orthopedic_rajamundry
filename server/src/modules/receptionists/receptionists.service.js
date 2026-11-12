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
  const username = data.username?.trim();
  if (!username) throw ApiError.badRequest('Username is required.');

  // 1. Check username uniqueness (case-insensitive, non-deleted accounts only)
  if (await usersRepository.isUsernameTaken(username)) {
    throw ApiError.badRequest('Username is already taken.');
  }

  // 2. Check email uniqueness (case-insensitive, non-deleted accounts only)
  if (await usersRepository.isEmailTaken(data.email)) {
    throw ApiError.badRequest('Email is already registered');
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  // 4. Run transaction
  const resultRec = await withTransaction(async (client) => {
    // 4.1 Find Receptionist role ID
    const roleId = await usersRepository.findRoleIdByName('Receptionist', client);
    if (!roleId) throw ApiError.internal('Role "Receptionist" not found in database');

    // 4.2 Create user account with the explicitly provided username
    const userRow = await usersRepository.create({
      username,
      email: data.email,
      passwordHash,
      fullName: data.name,
      roleId
    }, client);

    if (data.status && data.status !== 'Active') {
      await usersRepository.updateActiveStatus(userRow.id, false, client);
    }

    // 4.3 Create receptionist profile
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

  // 5. Log activity
  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Registered new receptionist: ${resultRec.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: resultRec.id
  });

  return serializeReceptionist(resultRec);
}

export async function updateReceptionist(id, data, actor) {
  const current = await receptionistsRepository.findById(id);
  if (!current) throw ApiError.notFound('Receptionist account could not be found.');

  // Verify or safely heal linked user through receptionists.user_id
  let linkedUserId = current.user_id;
  let linkedUser = linkedUserId ? await usersRepository.findById(linkedUserId) : null;

  if (!linkedUser) {
    // Attempt auto-recovery by email
    const emailToSearch = data.email || current.email;
    if (emailToSearch) {
      linkedUser = await usersRepository.findByUsername(emailToSearch);
      if (linkedUser) {
        linkedUserId = linkedUser.id;
        await receptionistsRepository.update(id, { userId: linkedUserId });
      }
    }
  }

  // If username is changing, check uniqueness
  if (data.username !== undefined && data.username.trim() !== '') {
    const newUsername = data.username.trim();
    if (await usersRepository.isUsernameTaken(newUsername, linkedUserId)) {
      throw ApiError.badRequest('Username is already taken.');
    }
  }

  // If email is changing, check uniqueness
  if (data.email && data.email.toLowerCase() !== current.email?.toLowerCase()) {
    if (await usersRepository.isEmailTaken(data.email, linkedUserId)) {
      throw ApiError.badRequest('Email is already registered');
    }
  }

  const row = await withTransaction(async (client) => {
    if (!linkedUser) {
      // Create user account if absent
      const username = data.username?.trim();
      if (!username) throw ApiError.badRequest('Username is required to create a login account for this receptionist.');

      if (await usersRepository.isUsernameTaken(username, null, client)) {
        throw ApiError.badRequest('Username is already taken.');
      }

      const roleId = await usersRepository.findRoleIdByName('Receptionist', client);
      const initialPass = data.password && data.password.trim() !== '' ? data.password : 'Reception@123';
      const initialHash = await bcrypt.hash(initialPass, env.BCRYPT_SALT_ROUNDS);
      const createdUser = await usersRepository.create(
        {
          username,
          email: data.email || current.email,
          passwordHash: initialHash,
          fullName: data.name || current.name,
          roleId
        },
        client
      );
      linkedUserId = createdUser.id;
      data.userId = linkedUserId;
    } else {
      // Sync user profile: name, email, and optionally username
      await usersRepository.updateProfile(
        linkedUserId,
        {
          fullName: data.name,
          email: data.email,
          username: data.username?.trim() || undefined
        },
        client
      );

      // Sync active status
      if (data.status) {
        await usersRepository.updateActiveStatus(linkedUserId, data.status === 'Active', client);
      }

      // Sync password if provided and not empty
      if (data.password && data.password.trim() !== '') {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);
        await usersRepository.updatePasswordHash(linkedUserId, passwordHash, client);
      }
    }

    return await receptionistsRepository.update(id, data, client);
  });

  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Updated details of receptionist ${row.name}`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });

  return serializeReceptionist(row);
}

export async function deleteReceptionist(id, actor) {
  const current = await receptionistsRepository.findById(id);
  if (!current) throw ApiError.notFound('Receptionist account could not be found.');

  const row = await withTransaction(async (client) => {
    // Soft-delete the linked user account so email/username can be reused
    if (current.user_id) {
      await usersRepository.softDelete(current.user_id, client);
    }
    return await receptionistsRepository.softDelete(id, client);
  });

  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Removed receptionist ${row.name} from directory`,
    activityType: 'receptionist',
    entityType: 'receptionist',
    entityId: row.id
  });
}
