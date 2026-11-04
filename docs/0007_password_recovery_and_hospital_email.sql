-- ============================================================================
-- Migration 0007 — Password Recovery OTPs and Hospital Recovery Email
--
-- 1. Adds email (recovery email) column to hospital_settings with default
-- 2. Creates password_reset_otps table for secure, time-limited, role-agnostic OTP recovery
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Add email column to hospital_settings if not present
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_settings' AND column_name = 'email'
  ) THEN
    ALTER TABLE hospital_settings
      ADD COLUMN email VARCHAR(150) NOT NULL DEFAULT 'akuladevigangabhavani@gmail.com';
  END IF;
END $$;

-- Update existing singleton row if email is missing or empty
UPDATE hospital_settings
SET email = 'akuladevigangabhavani@gmail.com'
WHERE id = 1 AND (email IS NULL OR email = '');

-- ----------------------------------------------------------------------------
-- 2. Create password_reset_otps table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash          TEXT NOT NULL,
  reset_token_hash  TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  attempts          SMALLINT NOT NULL DEFAULT 0,
  max_attempts      SMALLINT NOT NULL DEFAULT 5,
  is_used           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user ON password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_token ON password_reset_otps(reset_token_hash) WHERE reset_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_active ON password_reset_otps(user_id, expires_at) WHERE is_used = FALSE;

COMMIT;
