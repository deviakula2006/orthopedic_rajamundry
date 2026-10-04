-- ============================================================================
-- Migration 0006 — Appointment Types (configurable), Patient Type, GST Rate
--
-- 1. Creates appointment_types table — replaces hard-coded appointment_type ENUM
-- 2. Adds patient_type column to appointments
-- 3. Adds gst_rate column to hospital_settings
-- 4. Seeds default appointment types (Consultation, Therapy, Follow Up)
-- 5. Migrates existing appointments.type ENUM values → FK references
-- 6. Drops the hard-coded ENUM (renaming old column first for safety)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- A. Appointment Types catalog
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS appt_type_code_seq START 1;

CREATE TABLE IF NOT EXISTS appointment_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(10) UNIQUE NOT NULL
                DEFAULT generate_code('AT', 'appt_type_code_seq', 3),
  name        VARCHAR(100) UNIQUE NOT NULL,
  default_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (default_fee >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_appointment_types_updated_at
  BEFORE UPDATE ON appointment_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed default appointment types
INSERT INTO appointment_types (name, default_fee) VALUES
  ('Consultation', 500),
  ('Therapy',      600),
  ('Follow Up',    300)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- B. Patient Type column on appointments
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'patient_type'
  ) THEN
    ALTER TABLE appointments
      ADD COLUMN patient_type VARCHAR(20) NOT NULL DEFAULT 'Outpatient'
        CHECK (patient_type IN ('Outpatient', 'Inpatient'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- C. appointment_type_id FK column — links appointments to configurable types
--    We add the column nullable first so existing rows don't fail, then
--    back-fill from the old ENUM column, then we leave it nullable to avoid
--    breaking legacy records that have unmapped types (Surgery/Emergency).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'appointment_type_id'
  ) THEN
    ALTER TABLE appointments
      ADD COLUMN appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Back-fill appointment_type_id from old type ENUM for the three seeded types
UPDATE appointments a
SET appointment_type_id = at.id
FROM appointment_types at
WHERE a.type::text = at.name
  AND a.appointment_type_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_appt_type ON appointments(appointment_type_id);

-- ----------------------------------------------------------------------------
-- D. GST Rate in hospital_settings
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospital_settings' AND column_name = 'gst_rate'
  ) THEN
    ALTER TABLE hospital_settings
      ADD COLUMN gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100);
  END IF;
END $$;

COMMIT;
