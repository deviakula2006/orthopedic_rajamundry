import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as usersRepository from '../users/users.repository.js';
import * as doctorsRepository from '../doctors/doctors.repository.js';
import * as receptionistsRepository from '../receptionists/receptionists.repository.js';
import * as hospitalSettingsRepository from '../hospitalSettings/hospitalSettings.repository.js';
import { serializeUser } from '../users/users.serializer.js';
import { sendOtpRecoveryEmail } from '../../services/email.service.js';
import { logActivity } from '../activities/activities.repository.js';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, name: user.full_name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function login(username, password) {
  // Login by username only — email is not accepted as a login identifier
  const user = await usersRepository.findByUsername(username);

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

  const fullUserProfile = await getCurrentUser(user.id);
  return { token: signToken(user), user: fullUserProfile };
}

export async function getCurrentUser(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const base = serializeUser(user);

  // Attach role-specific profile data from respective tables
  if (user.role === 'Doctor') {
    const doc = await doctorsRepository.findByUserId(userId);
    if (doc) {
      base.phone = doc.phone;
      base.specialization = doc.specialization;
      base.experience = doc.experience_years != null ? `${doc.experience_years} Years` : '';
      base.experienceYears = doc.experience_years;
      base.availability = doc.availability_note || '';
      base.doctorCode = doc.doctor_code;
      base.status = doc.status;
    }
  } else if (user.role === 'Receptionist') {
    const rec = await receptionistsRepository.findByUserId(userId);
    if (rec) {
      base.phone = rec.phone;
      base.shift = rec.shift;
      base.receptionistCode = rec.receptionist_code;
      base.status = rec.status;
    }
  } else if (user.role === 'Admin' || user.role === 'Super Admin') {
    const settings = await hospitalSettingsRepository.get();
    base.hospitalName = settings?.name || 'Rajahmundry Orthopedic Hospital';
    base.phone = settings?.contact_phone || '';
    base.recoveryEmail = settings?.email || 'akuladevigangabhavani@gmail.com';
  }

  return base;
}

export async function updateProfile(userId, data) {
  const user = await usersRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  // If username is being changed, validate uniqueness (exclude self)
  if (data.username !== undefined && data.username.trim() !== '') {
    const newUsername = data.username.trim();
    if (await usersRepository.isUsernameTaken(newUsername, userId)) {
      throw ApiError.badRequest('Username is already taken.');
    }
  }

  // If email is being changed, validate uniqueness (exclude self)
  if (data.email !== undefined && data.email.toLowerCase() !== user.email.toLowerCase()) {
    if (await usersRepository.isEmailTaken(data.email, userId)) {
      throw ApiError.badRequest('Email is already registered');
    }
  }

  await withTransaction(async (client) => {
    // 1. Update user table (name, email, username)
    if (data.name !== undefined || data.email !== undefined || data.username !== undefined) {
      await usersRepository.updateProfile(
        userId,
        {
          fullName: data.name,
          email: data.email,
          username: data.username?.trim() || undefined
        },
        client
      );
    }

    // 2. Synchronize role profile table
    if (user.role === 'Doctor') {
      const doc = await doctorsRepository.findByUserId(userId, client);
      if (doc) {
        await doctorsRepository.update(
          doc.id,
          {
            name: data.name,
            email: data.email,
            phone: data.phone,
            specialization: data.specialization,
            experienceYears: data.experienceYears,
            availabilityNote: data.availabilityNote
          },
          client
        );
      }
    } else if (user.role === 'Receptionist') {
      const rec = await receptionistsRepository.findByUserId(userId, client);
      if (rec) {
        await receptionistsRepository.update(
          rec.id,
          {
            name: data.name,
            email: data.email,
            phone: data.phone,
            shift: data.shift
          },
          client
        );
      }
    } else if ((user.role === 'Admin' || user.role === 'Super Admin') && data.phone !== undefined) {
      await hospitalSettingsRepository.update({ contactPhone: data.phone }, client);
    }
  });

  return getCurrentUser(userId);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await usersRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const currentMatches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!currentMatches) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await usersRepository.updatePasswordHash(userId, newHash);

  await logActivity({
    userId,
    actorName: user.full_name,
    action: `Changed system credentials for account ${user.username}`,
    activityType: 'auth',
    entityType: 'user',
    entityId: userId
  });
}

/**
 * 1. Request Password Recovery OTP
 * Dispatches a cryptographically secure 6-digit OTP to the hospital's registered email.
 */
export async function requestPasswordReset(username) {
  // Look up by username only (strict — email cannot substitute)
  const user = await usersRepository.findByUsername(username);

  // Return generic response without revealing account existence
  const genericMessage =
    'If an eligible account is registered with this identifier, a recovery verification code has been dispatched to the hospital recovery email.';

  if (!user || !user.is_active) {
    return { success: true, message: genericMessage };
  }

  // Invalidate any active OTPs for this user
  await query(
    'UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
    [user.id]
  );

  // Generate cryptographically secure 6-digit OTP
  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);

  // Store OTP hash with 5-minute expiry
  await query(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
     VALUES ($1, $2, now() + interval '5 minutes')`,
    [user.id, otpHash]
  );

  // Retrieve hospital recovery email from database
  const settings = await hospitalSettingsRepository.get();
  const recoveryEmail = settings?.email || 'akuladevigangabhavani@gmail.com';

  // Send email containing username, role, OTP, and expiry instructions
  await sendOtpRecoveryEmail({
    to: recoveryEmail,
    username: user.username,
    role: user.role,
    otp,
    expiryMinutes: 5
  });

  return { success: true, message: genericMessage };
}

/**
 * 2. Verify Recovery OTP
 * Verifies OTP, tracks attempt limits, and issues a single-use reset token.
 */
export async function verifyPasswordResetOtp({ username, otp }) {
  const user = await usersRepository.findByUsername(username);
  if (!user || !user.is_active) {
    throw ApiError.badRequest('Invalid or expired verification code');
  }

  const { rows } = await query(
    `SELECT * FROM password_reset_otps
     WHERE user_id = $1 AND is_used = FALSE AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  const record = rows[0];
  if (!record) {
    throw ApiError.badRequest('Invalid or expired verification code');
  }

  if (record.attempts >= record.max_attempts) {
    await query('UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1', [record.id]);
    throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new code.');
  }

  const matches = await bcrypt.compare(otp, record.otp_hash);
  if (!matches) {
    await query('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    throw ApiError.badRequest('Invalid verification code');
  }

  // Generate single-use reset session token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await query('UPDATE password_reset_otps SET reset_token_hash = $2 WHERE id = $1', [
    record.id,
    tokenHash
  ]);

  return { success: true, resetToken };
}

/**
 * 3. Reset Password with verified token
 */
export async function resetPassword({ username, resetToken, newPassword }) {
  const user = await usersRepository.findByUsername(username);
  if (!user || !user.is_active) {
    throw ApiError.badRequest('Invalid or expired reset session');
  }

  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  const { rows } = await query(
    `SELECT * FROM password_reset_otps
     WHERE user_id = $1 AND reset_token_hash = $2 AND is_used = FALSE AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, tokenHash]
  );

  const record = rows[0];
  if (!record) {
    throw ApiError.badRequest('Invalid or expired reset session. Please request a new code.');
  }

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  await withTransaction(async (client) => {
    // Update user password hash
    await usersRepository.updatePasswordHash(user.id, newHash, client);

    // Consume OTP record
    await client.query('UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1', [record.id]);

    // Log security activity
    await logActivity({
      userId: user.id,
      actorName: user.full_name,
      action: `Password reset successfully via hospital recovery code for account ${user.username}`,
      activityType: 'auth',
      entityType: 'user',
      entityId: user.id
    });
  });

  return {
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.'
  };
}
