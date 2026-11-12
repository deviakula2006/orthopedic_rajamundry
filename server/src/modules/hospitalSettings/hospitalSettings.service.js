import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import * as hospitalSettingsRepository from './hospitalSettings.repository.js';
import { serializeHospitalSettings } from './hospitalSettings.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { sendHospitalEmailVerificationOtp } from '../../services/email.service.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export async function getHospitalSettings() {
  const row = await hospitalSettingsRepository.get();
  if (!row) throw ApiError.internal('Hospital settings row is missing');
  return serializeHospitalSettings(row);
}

export async function updateHospitalSettings(data, actor) {
  // If email was sent in direct update without verification flow, keep existing behavior for backwards compatibility,
  // but ensure audit logging and serialization
  const row = await hospitalSettingsRepository.update(data);
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: 'Updated hospital organization details',
    activityType: 'general',
    entityType: 'hospital_settings',
    entityId: null
  });
  return serializeHospitalSettings(row);
}

export async function requestRecoveryEmailChange({ email }, actor) {
  const normalizedEmail = email.trim().toLowerCase();
  const current = await hospitalSettingsRepository.get();
  if (current && current.email && current.email.toLowerCase() === normalizedEmail) {
    throw ApiError.badRequest('The requested email is already the active recovery address.');
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await hospitalSettingsRepository.setPendingRecoveryEmail({
    pendingEmail: normalizedEmail,
    otpHash,
    expiresAt
  });

  await sendHospitalEmailVerificationOtp({
    to: normalizedEmail,
    otp,
    expiryMinutes: 10
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Initiated verification for new hospital recovery email: ${normalizedEmail}`,
    activityType: 'security',
    entityType: 'hospital_settings',
    entityId: null
  });

  return {
    success: true,
    pendingEmail: normalizedEmail,
    message: `Verification code sent to ${normalizedEmail}. Please enter the code to confirm activation.`
  };
}

export async function verifyRecoveryEmailChange({ otp }, actor) {
  const settings = await hospitalSettingsRepository.getWithVerificationDetails();
  if (!settings || !settings.pending_email || !settings.email_verification_otp_hash) {
    throw ApiError.badRequest('No pending recovery email verification was requested.');
  }

  if (new Date() > new Date(settings.email_verification_expires_at)) {
    throw ApiError.badRequest('Verification code has expired. Please request a new code.');
  }

  const matches = await bcrypt.compare(otp, settings.email_verification_otp_hash);
  if (!matches) {
    throw ApiError.badRequest('Invalid verification code.');
  }

  const updated = await hospitalSettingsRepository.verifyAndApplyRecoveryEmail();

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Verified and activated new hospital recovery email: ${updated.email}`,
    activityType: 'security',
    entityType: 'hospital_settings',
    entityId: null
  });

  return {
    success: true,
    email: updated.email,
    message: 'Hospital recovery email verified and updated successfully.'
  };
}
