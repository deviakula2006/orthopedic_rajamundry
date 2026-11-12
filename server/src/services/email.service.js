import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

let transporter = null;

function getMissingSmtpConfig() {
  const missing = [];
  if (!env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!env.SMTP_PORT) missing.push('SMTP_PORT');
  if (!env.SMTP_USER) missing.push('SMTP_USER');
  if (!env.SMTP_PASS) missing.push('SMTP_PASS');
  return missing;
}

export function isSmtpConfigured() {
  return getMissingSmtpConfig().length === 0;
}

export function getTransporter() {
  if (transporter) return transporter;

  const missing = getMissingSmtpConfig();
  if (missing.length > 0) {
    throw ApiError.internal(
      `Email delivery service is unconfigured. Missing environment variables: ${missing.join(', ')}. Please configure SMTP settings.`
    );
  }

  const port = Number(env.SMTP_PORT);
  const isSecure = port === 465;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return transporter;
}

/**
 * Sends a password recovery OTP email to either the user's registered email
 * or the official hospital recovery email.
 */
export async function sendOtpRecoveryEmail({
  to,
  username,
  role,
  otp,
  deliveryMethod = 'registered_email',
  expiryMinutes = 5
}) {
  if (env.isTest) {
    logger.info({ to, username, role, deliveryMethod }, '[TEST MODE] Simulating OTP email dispatch');
    return { success: true, messageId: 'test-mock-message-id' };
  }

  const missing = getMissingSmtpConfig();
  if (missing.length > 0) {
    logger.warn({ missing }, 'SMTP configuration is incomplete');
    throw ApiError.badRequest(
      `SMTP email delivery is not configured on this server. Missing environment variables: ${missing.join(', ')}.`
    );
  }

  const transport = getTransporter();
  const fromAddress = env.SMTP_FROM || env.SMTP_USER;

  const isHospitalFallback = deliveryMethod === 'hospital_email';
  const subject = isHospitalFallback
    ? `[Hospital Inbox] Password Recovery Code for ${username} (${role}) - Rajahmundry Orthopedic Hospital`
    : `Password Reset Verification Code - Rajahmundry Orthopedic Hospital`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2278e8;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Rajahmundry Orthopedic Hospital</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Authorized Password Recovery Service</p>
      </div>

      <div style="padding: 24px 0;">
        <p style="color: #1e293b; font-size: 14px; line-height: 1.6;">
          A password reset request was initiated for an account in the hospital management system.
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #2278e8; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
          <p style="margin: 4px 0; color: #334155; font-size: 13px;">
            <strong>Account Username:</strong> <span style="font-family: monospace; font-size: 14px; color: #0f172a;">${username}</span>
          </p>
          <p style="margin: 4px 0; color: #334155; font-size: 13px;">
            <strong>Account Role:</strong> <span style="color: #2278e8; font-weight: 600;">${role}</span>
          </p>
          <p style="margin: 4px 0; color: #334155; font-size: 13px;">
            <strong>Delivery Destination:</strong> ${isHospitalFallback ? 'Official Hospital Recovery Inbox' : 'Registered Staff Email'}
          </p>
          <p style="margin: 4px 0; color: #334155; font-size: 13px;">
            <strong>Valid For:</strong> ${expiryMinutes} minutes
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Expires in ${expiryMinutes} minutes. Single-use only.
          </p>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; margin-top: 20px;">
          <h4 style="margin: 0 0 6px 0; color: #b45309; font-size: 13px;">Security Notice:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 12px; line-height: 1.6;">
            ${
              isHospitalFallback
                ? '<li>This code was routed to the shared hospital recovery inbox via the fallback option. Authorized personnel must verify staff identity before disclosing it.</li>'
                : '<li>This code was routed to the email address registered with this specific staff account.</li>'
            }
            <li>Never disclose this verification code to unauthorized parties or phone callers.</li>
            <li>If you did not request this recovery, verify your account credentials immediately.</li>
          </ul>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; ${new Date().getFullYear()} Rajahmundry Orthopedic Hospital Management System. All rights reserved.
      </div>
    </div>
  `;

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html: htmlContent,
      text: `Password Reset Verification Code: ${otp}\nAccount: ${username} (${role})\nMethod: ${deliveryMethod}\nExpires in ${expiryMinutes} minutes.\nRecipient: ${to}`
    });

    logger.info({ messageId: info.messageId, to, deliveryMethod }, 'Password reset OTP email dispatched successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to deliver OTP email via SMTP');
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw ApiError.internal(
        'SMTP authentication failed (535 Bad Credentials). The configured Google App Password in server/.env is invalid or expired. Please update SMTP_PASS in server/.env.'
      );
    }
    throw ApiError.internal(`Failed to deliver OTP email: ${error.message}`);
  }
}

/**
 * Sends an email verification OTP when Admin updates the Hospital Recovery Email.
 */
export async function sendHospitalEmailVerificationOtp({
  to,
  otp,
  expiryMinutes = 10
}) {
  if (env.isTest) {
    logger.info({ to }, '[TEST MODE] Simulating Hospital Recovery Email verification OTP');
    return { success: true, messageId: 'test-mock-verify-id' };
  }

  const missing = getMissingSmtpConfig();
  if (missing.length > 0) {
    logger.warn({ missing }, 'SMTP configuration is incomplete');
    throw ApiError.badRequest(
      `SMTP email delivery is not configured on this server. Missing environment variables: ${missing.join(', ')}.`
    );
  }

  const transport = getTransporter();
  const fromAddress = env.SMTP_FROM || env.SMTP_USER;
  const subject = `Verify Hospital Recovery Email - Rajahmundry Orthopedic Hospital`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2278e8;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Rajahmundry Orthopedic Hospital</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Hospital Settings Verification</p>
      </div>

      <div style="padding: 24px 0;">
        <p style="color: #1e293b; font-size: 14px; line-height: 1.6;">
          An administrator has requested to configure this email address as the <strong>Official Hospital Recovery Email</strong> for password recovery fallback.
        </p>

        <p style="color: #334155; font-size: 13px; line-height: 1.6;">
          To activate this recipient and ensure password recovery codes can be securely delivered here, enter the verification code below in the Hospital Settings page:
        </p>

        <div style="text-align: center; margin: 26px 0;">
          <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; padding: 14px 32px;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Code valid for ${expiryMinutes} minutes.
          </p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
          If you did not request this configuration change, no action is needed. The existing recovery address will remain active.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; ${new Date().getFullYear()} Rajahmundry Orthopedic Hospital Management System. All rights reserved.
      </div>
    </div>
  `;

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      html: htmlContent,
      text: `Hospital Recovery Email Verification Code: ${otp}\nValid for ${expiryMinutes} minutes.`
    });

    logger.info({ messageId: info.messageId, to }, 'Hospital Recovery Email verification OTP sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send Hospital Recovery Email verification OTP');
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw ApiError.internal(
        'SMTP authentication failed (535 Bad Credentials). The configured Google App Password in server/.env is invalid or expired. Please update SMTP_PASS in server/.env.'
      );
    }
    throw ApiError.internal(`Failed to deliver verification email: ${error.message}`);
  }
}
