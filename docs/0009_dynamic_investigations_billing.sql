-- Migration 0009: Dynamic Investigation Orders in Billing & Duplicate Prevention
BEGIN;

-- 1. Add patient reference directly to consultation_investigations
ALTER TABLE consultation_investigations
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- Backfill patient_id from consultations
UPDATE consultation_investigations ci
SET patient_id = c.patient_id
FROM consultations c
WHERE ci.consultation_id = c.id
  AND ci.patient_id IS NULL;

-- 2. Allow consultation_id to be nullable for direct patient investigation orders
ALTER TABLE consultation_investigations
  ALTER COLUMN consultation_id DROP NOT NULL;

-- 3. Billing tracking fields on consultation_investigations
ALTER TABLE consultation_investigations
  ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_status VARCHAR(20) NOT NULL DEFAULT 'Unbilled',
  ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ordered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ordered_by_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Traceability link from bill_items back to consultation_investigations
ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS consultation_investigation_id UUID REFERENCES consultation_investigations(id) ON DELETE SET NULL;

-- 5. Database-level protection against duplicate billing
CREATE UNIQUE INDEX IF NOT EXISTS uix_bill_items_consultation_investigation
  ON bill_items(consultation_investigation_id)
  WHERE consultation_investigation_id IS NOT NULL;

-- 6. Indexes for fast patient pending lookups
CREATE INDEX IF NOT EXISTS idx_ci_patient_unbilled
  ON consultation_investigations(patient_id, billing_status)
  WHERE billing_status = 'Unbilled' AND deleted_at IS NULL;

COMMIT;

