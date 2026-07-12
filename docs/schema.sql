-- ============================================================================
-- Rajahmundry Orthopedic Hospital (ROH) — PostgreSQL Schema
-- Requires PostgreSQL 13+ (gen_random_uuid() is core as of v13).
-- See DATABASE_SCHEMA.md for the full design rationale and data dictionary.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- fallback for gen_random_uuid() on PG < 13

-- ----------------------------------------------------------------------------
-- 1. Enum types
-- ----------------------------------------------------------------------------
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE staff_status AS ENUM ('Active', 'Inactive');
CREATE TYPE appointment_type AS ENUM ('Consultation', 'Therapy', 'Follow Up', 'Surgery', 'Emergency');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'No Show');
CREATE TYPE bed_type AS ENUM ('General', 'Semi-Private', 'Private Suite', 'Critical Care');
CREATE TYPE bed_status AS ENUM ('Available', 'Occupied', 'Maintenance');
CREATE TYPE bill_type AS ENUM ('OPD', 'IPD', 'Pharmacy', 'Lab');
CREATE TYPE payment_mode AS ENUM ('Cash', 'Card', 'UPI', 'Insurance', 'Net Banking');
CREATE TYPE payment_status AS ENUM ('Paid', 'Pending', 'Partially Paid', 'Refunded');
CREATE TYPE bill_item_type AS ENUM ('Consultation', 'Investigation', 'Therapy', 'Pharmacy', 'Room Rent', 'Procedure', 'Other');
CREATE TYPE activity_type AS ENUM ('appointment', 'patient', 'billing', 'medical', 'bed', 'doctor', 'receptionist', 'auth', 'general');

-- ----------------------------------------------------------------------------
-- 2. Shared helper functions
-- ----------------------------------------------------------------------------

-- Generates display codes like 'PT001246', 'DOC003', 'APT012' from a sequence.
CREATE OR REPLACE FUNCTION generate_code(prefix TEXT, seq_name TEXT, pad_len INT DEFAULT 3)
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || lpad(nextval(seq_name)::text, pad_len, '0');
END;
$$ LANGUAGE plpgsql;

-- Keeps `updated_at` current on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Roles & Users (auth)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  id   SMALLSERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES  ('Admin'), ('Doctor'), ('Receptionist');

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       VARCHAR(50) UNIQUE NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      VARCHAR(150) NOT NULL,
  role_id        SMALLINT NOT NULL REFERENCES roles(id),
  avatar_url     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Doctors
-- ----------------------------------------------------------------------------
CREATE SEQUENCE doctor_code_seq START 1;

CREATE TABLE doctors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_code        VARCHAR(10) UNIQUE NOT NULL DEFAULT generate_code('DOC', 'doctor_code_seq', 3),
  user_id            UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name               VARCHAR(150) NOT NULL,
  specialization     VARCHAR(100) NOT NULL,
  phone              VARCHAR(15) NOT NULL,
  email              VARCHAR(150) UNIQUE,
  status             staff_status NOT NULL DEFAULT 'Active',
  availability_note  VARCHAR(100),
  experience_years   SMALLINT CHECK (experience_years >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);

CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Receptionists
-- ----------------------------------------------------------------------------
CREATE SEQUENCE receptionist_code_seq START 1;

CREATE TABLE receptionists (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receptionist_code   VARCHAR(10) UNIQUE NOT NULL DEFAULT generate_code('REC', 'receptionist_code_seq', 3),
  user_id             UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name                VARCHAR(150) NOT NULL,
  phone               VARCHAR(15) NOT NULL,
  email               VARCHAR(150) UNIQUE,
  status              staff_status NOT NULL DEFAULT 'Active',
  shift               VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE TRIGGER trg_receptionists_updated_at
  BEFORE UPDATE ON receptionists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Patients
-- ----------------------------------------------------------------------------
CREATE SEQUENCE patient_code_seq START 1246; -- continues after mock data's PT001245

CREATE TABLE patients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code       VARCHAR(12) UNIQUE NOT NULL DEFAULT generate_code('PT', 'patient_code_seq', 6),
  name               VARCHAR(150) NOT NULL,
  age                SMALLINT CHECK (age >= 0 AND age <= 150),
  date_of_birth      DATE,
  gender             gender_type NOT NULL,
  phone              VARCHAR(15) NOT NULL,
  address            TEXT,
  blood_group        blood_group_type,
  primary_diagnosis  VARCHAR(200),
  last_visit_date    DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX idx_patients_phone ON patients(phone);

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Investigations (lab/radiology test catalog)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE investigation_code_seq START 8; -- continues after mock data's INV007

CREATE TABLE investigations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_code  VARCHAR(10) UNIQUE NOT NULL DEFAULT generate_code('INV', 'investigation_code_seq', 3),
  test_name           VARCHAR(150) NOT NULL,
  category            VARCHAR(60) NOT NULL,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_investigations_updated_at
  BEFORE UPDATE ON investigations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Appointments
-- ----------------------------------------------------------------------------
CREATE SEQUENCE appointment_code_seq START 6; -- continues after mock data's APT005

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_code  VARCHAR(10) UNIQUE NOT NULL DEFAULT generate_code('APT', 'appointment_code_seq', 3),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  appointment_date  DATE NOT NULL,
  appointment_time  TIME NOT NULL,
  type              appointment_type NOT NULL DEFAULT 'Consultation',
  status            appointment_status NOT NULL DEFAULT 'Scheduled',
  fee               NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, appointment_date, appointment_time)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Wards & Beds
-- ----------------------------------------------------------------------------
CREATE TABLE wards (
  id          SMALLSERIAL PRIMARY KEY,
  name        VARCHAR(60) UNIQUE NOT NULL,
  bed_type    bed_type NOT NULL,
  base_rate   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (base_rate >= 0)
);

CREATE TABLE beds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_no              VARCHAR(10) UNIQUE NOT NULL,
  ward_id             SMALLINT NOT NULL REFERENCES wards(id),
  status              bed_status NOT NULL DEFAULT 'Available',
  current_patient_id  UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_bed_occupancy CHECK (
    (status = 'Occupied' AND current_patient_id IS NOT NULL) OR
    (status <> 'Occupied' AND current_patient_id IS NULL)
  )
);

CREATE TRIGGER trg_beds_updated_at
  BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE bed_admissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id         UUID NOT NULL REFERENCES beds(id),
  patient_id     UUID NOT NULL REFERENCES patients(id),
  admitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharged_at  TIMESTAMPTZ,
  CHECK (discharged_at IS NULL OR discharged_at >= admitted_at)
);

-- Fast "who currently occupies this bed" lookups.
CREATE INDEX idx_bed_admissions_active ON bed_admissions(bed_id) WHERE discharged_at IS NULL;

-- ----------------------------------------------------------------------------
-- 10. Bills & Bill Items
-- ----------------------------------------------------------------------------
CREATE SEQUENCE bill_invoice_seq START 3; -- continues after mock data's INV-2026-002

CREATE TABLE bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no      VARCHAR(20) UNIQUE NOT NULL
                    DEFAULT ('INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('bill_invoice_seq')::text, 3, '0')),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id       UUID REFERENCES doctors(id) ON DELETE SET NULL,
  bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  bill_type       bill_type NOT NULL,
  payment_mode    payment_mode,
  payment_status  payment_status NOT NULL DEFAULT 'Pending',
  sub_total       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sub_total >= 0),
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE bill_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id           UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  investigation_id  UUID REFERENCES investigations(id),
  description       VARCHAR(200) NOT NULL,
  item_type         bill_item_type NOT NULL,
  quantity          SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount            NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);

-- ----------------------------------------------------------------------------
-- 11. Activities (audit / dashboard feed)
-- ----------------------------------------------------------------------------
CREATE TABLE activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name     VARCHAR(150) NOT NULL,
  action         TEXT NOT NULL,
  activity_type  activity_type NOT NULL DEFAULT 'general',
  entity_type    VARCHAR(50),
  entity_id      UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

COMMIT;
