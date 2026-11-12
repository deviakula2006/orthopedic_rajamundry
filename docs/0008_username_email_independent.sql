-- ============================================================================
-- Migration 0008 — Independent Username/Email + Safe Soft-Delete on Users
--
-- Changes:
-- 1. Add deleted_at column to users table.
-- 2. Backfill deleted_at for users linked to soft-deleted doctors/receptionists.
-- 3. Drop unconditional UNIQUE constraints on users.username and users.email.
-- 4. Create partial case-insensitive unique indexes (excluding deleted rows).
-- 5. Drop unconditional UNIQUE constraint on doctors.email and receptionists.email.
-- 6. Create partial unique indexes for doctors.email and receptionists.email.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Add deleted_at column to users (safe, idempotent)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Backfill users.deleted_at for users linked to soft-deleted doctors
-- ----------------------------------------------------------------------------
UPDATE users u
SET deleted_at = d.deleted_at
FROM doctors d
WHERE d.user_id = u.id
  AND d.deleted_at IS NOT NULL
  AND u.deleted_at IS NULL;

-- Backfill for soft-deleted receptionists
UPDATE users u
SET deleted_at = r.deleted_at
FROM receptionists r
WHERE r.user_id = u.id
  AND r.deleted_at IS NOT NULL
  AND u.deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Drop unconditional UNIQUE constraints on users.username and users.email
--    (replace with partial indexes below)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_username_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_email_key;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Create partial case-insensitive unique indexes for users
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uix_users_username_active
  ON users (LOWER(username))
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uix_users_email_active
  ON users (LOWER(email))
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Drop unconditional UNIQUE constraints on doctors.email
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'doctors_email_key'
  ) THEN
    ALTER TABLE doctors DROP CONSTRAINT doctors_email_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uix_doctors_email_active
  ON doctors (LOWER(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. Drop unconditional UNIQUE constraints on receptionists.email
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receptionists_email_key'
  ) THEN
    ALTER TABLE receptionists DROP CONSTRAINT receptionists_email_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uix_receptionists_email_active
  ON receptionists (LOWER(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;

COMMIT;

