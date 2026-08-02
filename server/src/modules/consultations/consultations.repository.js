import { query, withTransaction } from '../../config/db.js';
import { buildSetClause } from '../../utils/sqlUpdate.js';
import { logActivity } from '../activities/activities.repository.js';

const BASE_CONSULTATION_SELECT = `
  c.id, c.consultation_code, c.appointment_id, c.patient_id, c.doctor_id,
  c.status, c.symptoms, c.clinical_notes, c.diagnosis, c.treatment_plan,
  c.follow_up_advice, c.remarks, c.completed_at, c.created_at, c.updated_at,
  p.patient_code, p.name AS patient_name, p.age AS patient_age, p.gender AS patient_gender,
  d.doctor_code, d.name AS doctor_name
`;

const BASE_CONSULTATION_FROM = `
  FROM consultations c
  JOIN patients p ON p.id = c.patient_id
  JOIN doctors d ON d.id = c.doctor_id
`;

export async function findByAppointmentId(appointmentId, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${BASE_CONSULTATION_SELECT} ${BASE_CONSULTATION_FROM} WHERE c.appointment_id = $1`,
    [appointmentId]
  );
  if (!rows[0]) return null;
  return await attachChildRecords(rows[0], client);
}

export async function findById(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `SELECT ${BASE_CONSULTATION_SELECT} ${BASE_CONSULTATION_FROM} WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  return await attachChildRecords(rows[0], client);
}

export async function getOrCreateForAppointment(appointmentId, client) {
  const existing = await findByAppointmentId(appointmentId, client);
  if (existing) return existing;

  const q = client ? client.query.bind(client) : query;
  // Get appointment details to find patient_id and doctor_id
  const { rows: aptRows } = await q(
    `SELECT id, patient_id, doctor_id, notes FROM appointments WHERE id = $1`,
    [appointmentId]
  );
  if (!aptRows[0]) return null;

  const { patient_id, doctor_id, notes } = aptRows[0];

  const { rows } = await q(
    `INSERT INTO consultations (appointment_id, patient_id, doctor_id, symptoms)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (appointment_id) DO UPDATE SET updated_at = now()
     RETURNING id`,
    [appointmentId, patient_id, doctor_id, notes || null]
  );

  return findById(rows[0].id, client);
}

async function attachChildRecords(consultation, client) {
  const q = client ? client.query.bind(client) : query;

  const [vitalsRes, rxRes, invRes] = await Promise.all([
    q(
      `SELECT v.id, v.patient_id, v.appointment_id, v.consultation_id, v.recorded_by_user_id,
              v.bp_systolic, v.bp_diastolic, v.bp_text, v.pulse, v.temperature,
              v.weight, v.height, v.spo2, v.blood_sugar, v.bmi, v.recorded_at,
              COALESCE(u.full_name, 'Medical Staff') AS recorded_by_name
       FROM vitals v
       LEFT JOIN users u ON u.id = v.recorded_by_user_id
       WHERE v.consultation_id = $1 OR v.appointment_id = $2
       ORDER BY v.recorded_at ASC`,
      [consultation.id, consultation.appointment_id]
    ),
    q(
      `SELECT rx.id, rx.consultation_id, rx.medicine_name, rx.dosage, rx.frequency,
              rx.duration, rx.instructions, rx.created_at,
              d.name AS doctor_name
       FROM prescriptions rx
       JOIN consultations c ON c.id = rx.consultation_id
       JOIN doctors d ON d.id = c.doctor_id
       WHERE rx.consultation_id = $1
       ORDER BY rx.created_at ASC`,
      [consultation.id]
    ),
    q(
      `SELECT ci.id, ci.consultation_id, ci.investigation_id, ci.test_name, ci.status,
              ci.result, ci.ordered_at, ci.completed_at,
              inv.investigation_code, inv.category, inv.price,
              d.name AS doctor_name
       FROM consultation_investigations ci
       JOIN consultations c ON c.id = ci.consultation_id
       JOIN doctors d ON d.id = c.doctor_id
       LEFT JOIN investigations inv ON inv.id = ci.investigation_id
       WHERE ci.consultation_id = $1
       ORDER BY ci.ordered_at ASC`,
      [consultation.id]
    )
  ]);

  return {
    ...consultation,
    vitals: vitalsRes.rows,
    prescriptions: rxRes.rows,
    investigations: invRes.rows
  };
}

export async function getPatientDoctorEMRHistory({ patientId, doctorId }, client) {
  const q = client ? client.query.bind(client) : query;
  const conditions = ['c.patient_id = $1'];
  const params = [patientId];

  if (doctorId) {
    params.push(doctorId);
    conditions.push(`c.doctor_id = $${params.length}`);
  }

  const whereSql = conditions.join(' AND ');

  const { rows } = await q(
    `SELECT ${BASE_CONSULTATION_SELECT} ${BASE_CONSULTATION_FROM}
     WHERE ${whereSql}
     ORDER BY c.created_at DESC`,
    params
  );

  const fullConsultations = await Promise.all(
    rows.map((row) => attachChildRecords(row, client))
  );

  return fullConsultations;
}

export async function updateConsultation(id, fields, client) {
  const q = client ? client.query.bind(client) : query;
  const clause = buildSetClause({
    symptoms: fields.symptoms,
    clinical_notes: fields.clinicalNotes,
    diagnosis: fields.diagnosis,
    treatment_plan: fields.treatmentPlan,
    follow_up_advice: fields.followUpAdvice,
    remarks: fields.remarks
  });

  if (!clause) return findById(id, client);

  await q(
    `UPDATE consultations SET ${clause.setSql}, updated_at = now()
     WHERE id = $${clause.values.length + 1}`,
    [...clause.values, id]
  );

  return findById(id, client);
}

export async function completeConsultationTx(consultationId, fields, actor) {
  return await withTransaction(async (client) => {
    const current = await findById(consultationId, client);
    if (!current) throw new Error('Consultation not found');

    // 1. Update consultation details and status to Completed
    const clause = buildSetClause({
      symptoms: fields?.symptoms ?? current.symptoms,
      clinical_notes: fields?.clinicalNotes ?? current.clinical_notes,
      diagnosis: fields?.diagnosis ?? current.diagnosis,
      treatment_plan: fields?.treatmentPlan ?? current.treatment_plan,
      follow_up_advice: fields?.followUpAdvice ?? current.follow_up_advice,
      remarks: fields?.remarks ?? current.remarks,
      status: 'Completed'
    });

    if (clause) {
      await client.query(
        `UPDATE consultations SET ${clause.setSql}, completed_at = now(), updated_at = now()
         WHERE id = $${clause.values.length + 1}`,
        [...clause.values, consultationId]
      );
    } else {
      await client.query(
        `UPDATE consultations SET status = 'Completed', completed_at = now(), updated_at = now()
         WHERE id = $1`,
        [consultationId]
      );
    }

    // 2. Update appointment status to Completed
    await client.query(
      `UPDATE appointments SET status = 'Completed', updated_at = now() WHERE id = $1`,
      [current.appointment_id]
    );

    // 3. Update patient last visit date and primary diagnosis
    const finalDiagnosis = fields?.diagnosis || current.diagnosis;
    await client.query(
      `UPDATE patients
       SET last_visit_date = CURRENT_DATE,
           primary_diagnosis = COALESCE(NULLIF($2, ''), primary_diagnosis),
           updated_at = now()
       WHERE id = $1`,
      [current.patient_id, finalDiagnosis || '']
    );

    // 4. Log activity
    await logActivity({
      userId: actor?.id,
      actorName: actor?.name || 'Doctor',
      action: `Completed consultation for patient ${current.patient_name}`,
      activityType: 'medical',
      entityType: 'consultation',
      entityId: consultationId
    }, client);

    return findById(consultationId, client);
  });
}

export async function addVital(data, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO vitals (
       patient_id, appointment_id, consultation_id, recorded_by_user_id,
       bp_systolic, bp_diastolic, bp_text, pulse, temperature, weight, height, spo2, blood_sugar, bmi
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      data.patientId,
      data.appointmentId || null,
      data.consultationId || null,
      data.recordedByUserId || null,
      data.bpSystolic || null,
      data.bpDiastolic || null,
      data.bpText || null,
      data.pulse || null,
      data.temperature || null,
      data.weight || null,
      data.height || null,
      data.spo2 || null,
      data.bloodSugar || null,
      data.bmi || null
    ]
  );

  const { rows: vitalRows } = await q(
    `SELECT v.id, v.patient_id, v.appointment_id, v.consultation_id, v.recorded_by_user_id,
            v.bp_systolic, v.bp_diastolic, v.bp_text, v.pulse, v.temperature,
            v.weight, v.height, v.spo2, v.blood_sugar, v.bmi, v.recorded_at,
            COALESCE(u.full_name, 'Medical Staff') AS recorded_by_name
     FROM vitals v
     LEFT JOIN users u ON u.id = v.recorded_by_user_id
     WHERE v.id = $1`,
    [rows[0].id]
  );

  return vitalRows[0];
}

export async function addPrescription(data, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO prescriptions (consultation_id, medicine_name, dosage, frequency, duration, instructions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      data.consultationId,
      data.medicineName,
      data.dosage,
      data.frequency,
      data.duration,
      data.instructions || null
    ]
  );

  const { rows: rxRows } = await q(
    `SELECT rx.id, rx.consultation_id, rx.medicine_name, rx.dosage, rx.frequency,
            rx.duration, rx.instructions, rx.created_at,
            d.name AS doctor_name
     FROM prescriptions rx
     JOIN consultations c ON c.id = rx.consultation_id
     JOIN doctors d ON d.id = c.doctor_id
     WHERE rx.id = $1`,
    [rows[0].id]
  );

  return rxRows[0];
}

export async function orderInvestigation(data, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    `INSERT INTO consultation_investigations (consultation_id, investigation_id, test_name, status)
     VALUES ($1, $2, $3, 'Ordered')
     RETURNING id`,
    [
      data.consultationId,
      data.investigationId || null,
      data.testName
    ]
  );

  const { rows: invRows } = await q(
    `SELECT ci.id, ci.consultation_id, ci.investigation_id, ci.test_name, ci.status,
            ci.result, ci.ordered_at, ci.completed_at,
            inv.investigation_code, inv.category, inv.price,
            d.name AS doctor_name
     FROM consultation_investigations ci
     JOIN consultations c ON c.id = ci.consultation_id
     JOIN doctors d ON d.id = c.doctor_id
     LEFT JOIN investigations inv ON inv.id = ci.investigation_id
     WHERE ci.id = $1`,
    [rows[0].id]
  );

  return invRows[0];
}
