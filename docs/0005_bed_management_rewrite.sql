-- ============================================================================
-- Migration 0005 — Bed & Ward Management Complete Rewrite
--
-- Removes the old bed/ward schema entirely and replaces it with a clean
-- schema that uses UUID primary keys, simplified ward structure, and a
-- two-value status enum (Vacant / Occupied).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Drop old tables (CASCADE handles foreign-key dependents)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS bed_admissions CASCADE;
DROP TABLE IF EXISTS beds          CASCADE;
DROP TABLE IF EXISTS wards         CASCADE;

-- ----------------------------------------------------------------------------
-- 2. Drop old enum types that are no longer needed
-- ----------------------------------------------------------------------------
DROP TYPE IF EXISTS bed_type   CASCADE;
DROP TYPE IF EXISTS bed_status CASCADE;

-- ----------------------------------------------------------------------------
-- 3. New enum: only two meaningful states
-- ----------------------------------------------------------------------------
CREATE TYPE bed_status AS ENUM ('Vacant', 'Occupied');

-- ----------------------------------------------------------------------------
-- 4. wards — one row per physical ward area
-- ----------------------------------------------------------------------------
CREATE TABLE wards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) UNIQUE NOT NULL,
  daily_charge NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (daily_charge >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_wards_updated_at
  BEFORE UPDATE ON wards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. beds — each bed belongs to exactly one ward
--    bed_number is unique within the ward (not globally)
-- ----------------------------------------------------------------------------
CREATE TABLE beds (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id            UUID NOT NULL REFERENCES wards(id) ON DELETE RESTRICT,
  bed_number         VARCHAR(30) NOT NULL,
  status             bed_status NOT NULL DEFAULT 'Vacant',
  current_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_bed_number_per_ward UNIQUE (ward_id, bed_number),

  -- Occupancy invariant: occupied ↔ patient is set
  CONSTRAINT chk_bed_occupancy CHECK (
    (status = 'Occupied' AND current_patient_id IS NOT NULL) OR
    (status = 'Vacant'   AND current_patient_id IS NULL)
  )
);

CREATE TRIGGER trg_beds_updated_at
  BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_beds_ward_id ON beds(ward_id);
CREATE INDEX idx_beds_status  ON beds(status);

-- ----------------------------------------------------------------------------
-- 6. bed_admissions — one active record per occupied bed
--    (discharged_at IS NULL means currently active)
-- ----------------------------------------------------------------------------
CREATE TABLE bed_admissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id        UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharged_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (discharged_at IS NULL OR discharged_at >= admitted_at)
);

CREATE TRIGGER trg_bed_admissions_updated_at
  BEFORE UPDATE ON bed_admissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fast lookup for the currently-active admission of a bed
CREATE INDEX idx_bed_admissions_active
  ON bed_admissions(bed_id)
  WHERE discharged_at IS NULL;

-- ----------------------------------------------------------------------------
-- 7. Update the activity_type enum to include 'ward' if not already present
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'activity_type'::regtype
      AND enumlabel = 'ward'
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'ward';
  END IF;
END;
$$;

COMMIT;
