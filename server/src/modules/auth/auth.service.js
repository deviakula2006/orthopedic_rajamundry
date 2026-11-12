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

// ---------------------------------------------------------------------------
// Two-Option Password Recovery Workflow (Email-First, Registered vs Hospital)
// ---------------------------------------------------------------------------

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '******';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*****@${domain}`;
  }
  return `${local[0]}*****${local[local.length - 1]}@${domain}`;
}

export async function initiatePasswordRecovery({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await usersRepository.findByRegisteredEmail(normalizedEmail);
  const settings = await hospitalSettingsRepository.get();
  const hospitalEmail = settings?.email || 'akuladevigangabhavani@gmail.com';

  const recoverySessionId = crypto.randomBytes(32).toString('hex');

  if (user && user.is_active && !user.deleted_at) {
    // Invalidate previous active sessions for this user
    await query('UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE', [user.id]);

    // Insert pending challenge record bound to this user and session ID
    await query(
      `INSERT INTO password_reset_otps (session_id, user_id, otp_hash, expires_at, delivery_method, recipient_email)
       VALUES ($1, $2, 'PENDING_METHOD_SELECTION', now() + interval '15 minutes', 'registered_email', $3)`,
      [recoverySessionId, user.id, user.email]
    );
  }

  const accountFound = !!(user && user.is_active && !user.deleted_at);

  return {
    success: true,
    accountFound,
    recoverySessionId,
    options: [
      {
        id: 'registered_email',
        label: 'Send OTP to my registered email',
        description: 'Receive a password reset OTP at the email address registered with your hospital account.',
        maskedDestination: maskEmail(user ? user.email : normalizedEmail)
      },
      {
        id: 'hospital_email',
        label: 'Try another way – Send OTP to Hospital Email',
        description: "If you cannot access your registered email, request the OTP through the hospital's official recovery inbox.",
        maskedDestination: maskEmail(hospitalEmail),
        available: Boolean(hospitalEmail)
      }
    ]
  };
}

export async function sendRecoveryOtp({ recoverySessionId, method }) {
  const { rows } = await query(
    `SELECT po.*, u.username, u.email AS user_email, u.is_active, u.deleted_at, r.name AS role
     FROM password_reset_otps po
     JOIN users u ON u.id = po.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE po.session_id = $1 AND po.is_used = FALSE AND po.created_at > now() - interval '15 minutes'
     ORDER BY po.created_at DESC LIMIT 1`,
    [recoverySessionId]
  );

  const record = rows[0];
  if (!record || !record.is_active || record.deleted_at) {
    // Prevent account enumeration by returning generic response
    return {
      success: true,
      deliveryMethod: method,
      message: 'If an eligible account is registered, a verification code has been dispatched.'
    };
  }

  // Rate limiting check: at least 30 seconds between successive dispatches
  if (
    record.otp_hash !== 'PENDING_METHOD_SELECTION' &&
    record.last_sent_at &&
    Date.now() - new Date(record.last_sent_at).getTime() < 30000
  ) {
    throw ApiError.tooManyRequests('Please wait a moment before requesting another verification code.');
  }

  let recipient;
  if (method === 'registered_email') {
    recipient = record.user_email;
  } else if (method === 'hospital_email') {
    const settings = await hospitalSettingsRepository.get();
    recipient = settings?.email;
    if (!recipient) {
      throw ApiError.badRequest('Hospital recovery email is temporarily unavailable.');
    }
  } else {
    throw ApiError.badRequest('Invalid recovery delivery method selected.');
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);

  await query(
    `UPDATE password_reset_otps
     SET otp_hash = $2,
         delivery_method = $3,
         recipient_email = $4,
         expires_at = now() + interval '5 minutes',
         attempts = 0,
         last_sent_at = now()
     WHERE id = $1`,
    [record.id, otpHash, method, recipient]
  );

  await sendOtpRecoveryEmail({
    to: recipient,
    username: record.username,
    role: record.role,
    otp,
    deliveryMethod: method,
    expiryMinutes: 5
  });

  return {
    success: true,
    deliveryMethod: method,
    maskedRecipient: maskEmail(recipient),
    message: `A single-use verification code has been dispatched to ${maskEmail(recipient)}.`
  };
}

export async function verifyRecoveryOtp({ recoverySessionId, otp }) {
  const { rows } = await query(
    `SELECT po.*, u.username, u.is_active, u.deleted_at
     FROM password_reset_otps po
     JOIN users u ON u.id = po.user_id
     WHERE po.session_id = $1 AND po.is_used = FALSE
     ORDER BY po.created_at DESC LIMIT 1`,
    [recoverySessionId]
  );

  const record = rows[0];
  if (!record || record.otp_hash === 'PENDING_METHOD_SELECTION') {
    throw ApiError.badRequest('Invalid or expired verification session. Please request a new code.');
  }

  if (new Date() > new Date(record.expires_at)) {
    throw ApiError.badRequest('Verification code has expired. Please request a new code.');
  }

  if (record.attempts >= record.max_attempts) {
    await query('UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1', [record.id]);
    throw ApiError.badRequest('Maximum verification attempts exceeded. Please request a new code.');
  }

  const matches = await bcrypt.compare(otp, record.otp_hash);
  if (!matches) {
    await query('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    throw ApiError.badRequest('Invalid verification code. Please check and try again.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await query(
    `UPDATE password_reset_otps
     SET reset_token_hash = $2,
         expires_at = now() + interval '10 minutes'
     WHERE id = $1`,
    [record.id, tokenHash]
  );

  return { success: true, resetToken };
}

export async function resetRecoveryPassword({ recoverySessionId, resetToken, newPassword }) {
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  const { rows } = await query(
    `SELECT po.*, u.username, u.full_name, u.is_active, u.deleted_at
     FROM password_reset_otps po
     JOIN users u ON u.id = po.user_id
     WHERE po.session_id = $1 AND po.reset_token_hash = $2 AND po.is_used = FALSE AND po.expires_at > now()
     ORDER BY po.created_at DESC LIMIT 1`,
    [recoverySessionId, tokenHash]
  );

  const record = rows[0];
  if (!record) {
    throw ApiError.badRequest('Invalid or expired reset session. Please request a new code.');
  }

  if (!record.is_active || record.deleted_at) {
    throw ApiError.badRequest('Account is not eligible for password reset.');
  }

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  await withTransaction(async (client) => {
    await usersRepository.updatePasswordHash(record.user_id, newHash, client);
    await client.query('UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = $1', [record.user_id]);

    await logActivity({
      userId: record.user_id,
      actorName: record.full_name,
      action: `Password reset successfully via ${record.delivery_method} for account ${record.username}`,
      activityType: 'auth',
      entityType: 'user',
      entityId: record.user_id
    });
  });

  return {
    success: true,
    username: record.username,
    message: 'Password has been reset successfully. You can now log in with your new password.'
  };
}
