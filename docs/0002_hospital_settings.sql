-- ============================================================================
-- Migration 0002 — Hospital organization settings (singleton row)
-- Backs the Settings page's "Hospital Metadata" tab, which previously had no
-- backend at all (form values lived only in component state and vanished on
-- refresh). Applied after schema.sql; reuses its set_updated_at() trigger fn.
-- ============================================================================

BEGIN;

CREATE TABLE hospital_settings (
  id               SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces a single row
  name             VARCHAR(200) NOT NULL,
  address          TEXT,
  contact_phone    VARCHAR(30),
  license_number   VARCHAR(100),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_hospital_settings_updated_at
  BEFORE UPDATE ON hospital_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO hospital_settings (id, name, address, contact_phone, license_number) VALUES (
  1,
  'Rajahmundry Orthopedic Hospital',
  'Danavaipeta, Tilak Road, Rajahmundry, Andhra Pradesh, 533103',
  '+91 883 244 5566',
  'AP-MED-ROH-2026-981'
);

COMMIT;
