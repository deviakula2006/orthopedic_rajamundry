-- ============================================================================
-- Seed data for local development — mirrors src/constants/mockData.js
-- Run after schema.sql. Uses CTEs to resolve generated UUIDs across FKs
-- without hardcoding them.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Wards (derived from beds[].ward / bedType in mockData.js)
-- ----------------------------------------------------------------------------
INSERT INTO wards (name, bed_type, base_rate) VALUES
  ('General Ward',  'General',        800),
  ('Semi Private',  'Semi-Private',  1800),
  ('Private Room',  'Private Suite', 3500),
  ('ICU',           'Critical Care', 6000);

-- ----------------------------------------------------------------------------
-- Admin user (replaces the hardcoded admin/admin123 check in AuthContext.jsx)
-- DEV ONLY credentials: username "admin", password "Admin@123". The hash
-- below is bcrypt(12) of that password. Never reuse this for a real
-- deployment — rotate it immediately (see server/README.md).
-- ----------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, full_name, role_id, avatar_url)
SELECT 'admin', 'admin@roh.com', '$2a$12$/RSf4tebMg96OSgkU25rJOEkiHZC3F942xBoubp3IXGu9xUohDgOW', 'Admin',
       (SELECT id FROM roles WHERE name = 'Admin'),
       'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

-- ----------------------------------------------------------------------------
-- Doctors
-- ----------------------------------------------------------------------------
INSERT INTO doctors (name, specialization, phone, email, status, availability_note, experience_years) VALUES
  ('Dr. Arjun Kumar',   'Orthopedic Surgeon', '9810543210', 'arjun.kumar@roh.com',  'Active',   '9:00 AM - 1:00 PM', 15),
  ('Dr. Priya Smith',   'Physiotherapist',    '9845123412', 'priya.smith@roh.com',  'Active',   '2:00 PM - 6:00 PM', 8),
  ('Dr. Ravi Teja',     'Anesthesiologist',   '9900112233', 'ravi.teja@roh.com',    'Active',   'On Call',           12),
  ('Dr. Sunitha Devi',  'Radiologist',        '9867708554', 'sunitha.devi@roh.com', 'Inactive', '10:00 AM - 2:00 PM', 10),
  ('Dr. Mahesh Babu',   'General Physician',  '9700334455', 'mahesh.babu@roh.com',  'Active',   '8:00 AM - 12:00 PM', 9);

-- ----------------------------------------------------------------------------
-- Receptionists
-- ----------------------------------------------------------------------------
INSERT INTO receptionists (name, phone, status, shift, email) VALUES
  ('Laxmi Kumari',  '9123456789', 'Active', 'Morning (8 AM - 4 PM)', 'laxmi.k@roh.com'),
  ('Kishore Kumar', '9876543219', 'Active', 'Night (4 PM - 12 AM)',  'kishore.k@roh.com');

-- ----------------------------------------------------------------------------
-- Patients
-- ----------------------------------------------------------------------------
INSERT INTO patients (name, age, gender, phone, address, blood_group, primary_diagnosis, last_visit_date) VALUES
  ('Ramesh Babu',     45, 'Male',   '9876543210', 'Rajahmundry, Danavaipeta', 'O+',  'Osteoarthritis Knee',      '2026-05-12'),
  ('Anjali Kumari',   29, 'Female', '9551224567', 'Rajahmundry, Tilak Road',  'B+',  'Ligament Tear ACL',        '2026-05-11'),
  ('Mohan Rao',       60, 'Male',   '9701122334', 'Kakinada, Bhanugudi',      'A+',  'Hip Fracture',             '2026-05-10'),
  ('Kanya Sree',      38, 'Female', '7034561230', 'Rajahmundry, Lalacheruvu', 'AB+', 'Carpal Tunnel Syndrome',   '2026-05-09'),
  ('Srinivas Reddy',  52, 'Male',   '9911223344', 'Ravulapalem, Main Bazar',  'O-',  'Lumbar Spondylosis',       '2026-05-08'),
  ('Prasad Rao',      47, 'Male',   '9392828282', 'Rajahmundry, Morampudi',   'A-',  'Frozen Shoulder',          '2026-05-06'),
  ('Lalitha Kumari',  34, 'Female', '7282828292', 'Dowleswaram, Temple Rd',   'B-',  'Ankle Sprain',             '2026-05-05');

-- ----------------------------------------------------------------------------
-- Investigations
-- ----------------------------------------------------------------------------
INSERT INTO investigations (test_name, category, price) VALUES
  ('X-Ray - Knee AP/Lateral',        'Radiology',  800),
  ('CBC (Complete Blood Count)',     'Pathology',  450),
  ('ECG',                            'Cardiology', 350),
  ('Blood Sugar (Fasting)',          'Pathology',  150),
  ('MRI - Knee',                     'Radiology', 5500),
  ('CT Scan - Spine',                'Radiology', 4500),
  ('Vitamin D3',                     'Pathology', 1200);

-- ----------------------------------------------------------------------------
-- Appointments (resolved via patient_code / doctor_code lookups)
-- ----------------------------------------------------------------------------
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, fee)
SELECT p.id, d.id, v.appointment_date, v.appointment_time, v.type::appointment_type, v.status::appointment_status, v.fee
FROM (VALUES
  ('Ramesh Babu',    'Dr. Arjun Kumar',  DATE '2026-05-22', TIME '10:30', 'Consultation', 'Scheduled', 500),
  ('Anjali Kumari',  'Dr. Priya Smith',  DATE '2026-05-22', TIME '11:00', 'Therapy',      'Scheduled', 600),
  ('Mohan Rao',      'Dr. Arjun Kumar',  DATE '2026-05-21', TIME '09:30', 'Consultation', 'Completed', 500),
  ('Kanya Sree',     'Dr. Mahesh Babu',  DATE '2026-05-21', TIME '10:00', 'Follow Up',    'Completed', 300),
  ('Srinivas Reddy', 'Dr. Arjun Kumar',  DATE '2026-05-23', TIME '11:30', 'Consultation', 'Scheduled', 500)
) AS v(patient_name, doctor_name, appointment_date, appointment_time, type, status, fee)
JOIN patients p ON p.name = v.patient_name
JOIN doctors d ON d.name = v.doctor_name;

-- ----------------------------------------------------------------------------
-- Beds + initial admissions
-- ----------------------------------------------------------------------------
-- Inserted as 'Available' first: chk_bed_occupancy requires status and
-- current_patient_id to agree within a single row, so the occupied beds
-- below get both columns set together in one UPDATE rather than split
-- across INSERT + a later patient-only UPDATE.
INSERT INTO beds (bed_no, ward_id, status)
SELECT v.bed_no, w.id, 'Available'
FROM (VALUES
  ('101', 'General Ward'),
  ('102', 'General Ward'),
  ('103', 'General Ward'),
  ('104', 'General Ward'),
  ('105', 'General Ward'),
  ('201', 'Semi Private'),
  ('202', 'Semi Private'),
  ('203', 'Semi Private'),
  ('301', 'Private Room'),
  ('302', 'Private Room'),
  ('401', 'ICU'),
  ('402', 'ICU')
) AS v(bed_no, ward_name)
JOIN wards w ON w.name = v.ward_name;

-- Occupied beds: status and current_patient_id set together to satisfy chk_bed_occupancy.
UPDATE beds b SET status = 'Occupied', current_patient_id = p.id
FROM (VALUES ('101', 'Ramesh Babu'), ('103', 'Kanya Sree'), ('203', 'Anjali Kumari'), ('301', 'Mohan Rao')) AS v(bed_no, patient_name)
JOIN patients p ON p.name = v.patient_name
WHERE b.bed_no = v.bed_no;

-- Matching admission history rows for the occupied beds above
INSERT INTO bed_admissions (bed_id, patient_id)
SELECT b.id, b.current_patient_id FROM beds b WHERE b.current_patient_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Bills + line items
-- ----------------------------------------------------------------------------
WITH bill_1 AS (
  INSERT INTO bills (patient_id, doctor_id, bill_date, bill_type, payment_mode, payment_status, sub_total, discount, tax, total)
  SELECT p.id, d.id, DATE '2026-05-20', 'OPD', 'Cash', 'Paid', 2250, 100, 112.5, 2262.5
  FROM patients p, doctors d
  WHERE p.name = 'Ramesh Babu' AND d.name = 'Dr. Arjun Kumar'
  RETURNING id
)
INSERT INTO bill_items (bill_id, description, item_type, amount)
SELECT id, 'Consultation - Dr. Arjun Kumar', 'Consultation'::bill_item_type, 500 FROM bill_1
UNION ALL
SELECT id, 'X-Ray - Knee AP/Lateral', 'Investigation'::bill_item_type, 800 FROM bill_1
UNION ALL
SELECT id, 'Physiotherapy Session', 'Therapy'::bill_item_type, 600 FROM bill_1
UNION ALL
SELECT id, 'Medicine Kit', 'Pharmacy'::bill_item_type, 350 FROM bill_1;

WITH bill_2 AS (
  INSERT INTO bills (patient_id, doctor_id, bill_date, bill_type, payment_mode, payment_status, sub_total, discount, tax, total)
  SELECT p.id, d.id, DATE '2026-05-21', 'OPD', 'UPI', 'Paid', 1050, 50, 50, 1050
  FROM patients p, doctors d
  WHERE p.name = 'Anjali Kumari' AND d.name = 'Dr. Priya Smith'
  RETURNING id
)
INSERT INTO bill_items (bill_id, description, item_type, amount)
SELECT id, 'Consultation - Dr. Priya Smith', 'Consultation'::bill_item_type, 600 FROM bill_2
UNION ALL
SELECT id, 'CBC (Complete Blood Count)', 'Investigation'::bill_item_type, 450 FROM bill_2;

-- ----------------------------------------------------------------------------
-- Activities
-- ----------------------------------------------------------------------------
INSERT INTO activities (actor_name, action, activity_type, created_at) VALUES
  ('Admin',                'Approved appointment for Ramesh Babu',          'appointment', now() - interval '10 minutes'),
  ('Receptionist Laxmi',   'Registered new patient Anjali Kumari',          'patient',     now() - interval '45 minutes'),
  ('Admin',                'Generated invoice INV-2026-002',                'billing',     now() - interval '2 hours'),
  ('Dr. Arjun Kumar',      'Marked Mohan Rao checkup as complete',          'medical',     now() - interval '3 hours'),
  ('Admin',                'Assigned bed 101 to Ramesh Babu',               'bed',         now() - interval '4 hours');

COMMIT;
