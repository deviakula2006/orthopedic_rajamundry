import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import * as usersRepository from '../users/users.repository.js';
import { serializeUser } from '../users/users.serializer.js';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, name: user.full_name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function login(username, password) {
  const user = await usersRepository.findByUsernameOrEmail(username);

  // Compare against a fixed dummy hash when the user doesn't exist so the
  // response time doesn't leak whether the username is valid.
  const hashToCompare = user?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatches) {
    throw ApiError.unauthorized('Invalid username or password');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  await usersRepository.updateLastLogin(user.id);

  return { token: signToken(user), user: serializeUser(user) };
}

export async function getCurrentUser(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return serializeUser(user);
}

export async function updateProfile(userId, { name, email }) {
  const updated = await usersRepository.updateProfile(userId, { fullName: name, email });
  if (!updated) throw ApiError.notFound('User not found');
  return serializeUser(updated);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await usersRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const currentMatches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!currentMatches) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await usersRepository.updatePasswordHash(userId, newHash);
}
