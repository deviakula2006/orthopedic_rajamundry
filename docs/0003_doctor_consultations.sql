-- ============================================================================
-- Migration 0003 — Doctor Consultations, Vitals, Prescriptions, Investigations
-- Normalized schema for Doctor workstation and EMR timeline
-- ============================================================================

BEGIN;

CREATE SEQUENCE IF NOT EXISTS consultation_code_seq START 1;

CREATE TABLE IF NOT EXISTS consultations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_code VARCHAR(12) UNIQUE NOT NULL DEFAULT generate_code('CNS', 'consultation_code_seq', 6),
  appointment_id    UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  status            VARCHAR(20) NOT NULL DEFAULT 'In Consultation',
  symptoms          TEXT,
  clinical_notes    TEXT,
  diagnosis         VARCHAR(250),
  treatment_plan    TEXT,
  follow_up_advice  TEXT,
  remarks           TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment ON consultations(appointment_id);

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS vitals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id      UUID REFERENCES appointments(id) ON DELETE CASCADE,
  consultation_id     UUID REFERENCES consultations(id) ON DELETE CASCADE,
  recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bp_systolic         INTEGER,
  bp_diastolic        INTEGER,
  bp_text             VARCHAR(20),
  pulse               INTEGER,
  temperature         NUMERIC(4,1),
  weight              NUMERIC(5,2),
  height              NUMERIC(5,2),
  spo2                INTEGER,
  blood_sugar         INTEGER,
  bmi                 NUMERIC(4,1),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_consultation ON vitals(consultation_id);
CREATE INDEX IF NOT EXISTS idx_vitals_appointment ON vitals(appointment_id);

CREATE TABLE IF NOT EXISTS prescriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id  UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  medicine_name    VARCHAR(200) NOT NULL,
  dosage           VARCHAR(100) NOT NULL,
  frequency        VARCHAR(100) NOT NULL,
  duration         VARCHAR(100) NOT NULL,
  instructions     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);

CREATE TABLE IF NOT EXISTS consultation_investigations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id  UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES investigations(id) ON DELETE SET NULL,
  test_name        VARCHAR(200) NOT NULL,
  status           VARCHAR(30) NOT NULL DEFAULT 'Ordered',
  result           TEXT,
  ordered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consultation_investigations_consultation ON consultation_investigations(consultation_id);

COMMIT;
