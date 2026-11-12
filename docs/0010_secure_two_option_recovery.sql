-- Migration 0010: Secure Two-Option OTP Password Recovery System & Verified Hospital Recovery Email
BEGIN;

-- 1. Enhance password_reset_otps for two-option recovery challenges
ALTER TABLE password_reset_otps
  ADD COLUMN IF NOT EXISTS session_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(30) DEFAULT 'registered_email',
  ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_session
  ON password_reset_otps(session_id)
  WHERE session_id IS NOT NULL;

-- 2. Add verification state and pending address tracking to hospital_settings
ALTER TABLE hospital_settings
  ADD COLUMN IF NOT EXISTS pending_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS email_verification_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;

