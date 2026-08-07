-- ============================================================================
-- Migration 0004 — Appointment Conflict Fix & Partial Unique Index
-- Ensures Cancelled and Deleted appointments immediately free their slot.
-- ============================================================================

BEGIN;

-- 1. Drop existing rigid unique constraint if exists
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_appointment_date_appointment_time_key;

-- 2. Create partial unique index on active scheduled appointments only
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_doctor_appointment
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status = 'Scheduled';

COMMIT;
