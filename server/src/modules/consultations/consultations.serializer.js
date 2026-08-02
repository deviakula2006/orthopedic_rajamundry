export function serializeVital(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    consultationId: row.consultation_id,
    recordedByUserId: row.recorded_by_user_id,
    recordedByName: row.recorded_by_name || 'Medical Staff',
    bpSystolic: row.bp_systolic,
    bpDiastolic: row.bp_diastolic,
    bp: row.bp_text || (row.bp_systolic && row.bp_diastolic ? `${row.bp_systolic}/${row.bp_diastolic}` : ''),
    pulse: row.pulse,
    temperature: row.temperature != null ? parseFloat(row.temperature) : null,
    temp: row.temperature != null ? parseFloat(row.temperature) : null,
    weight: row.weight != null ? parseFloat(row.weight) : null,
    height: row.height != null ? parseFloat(row.height) : null,
    spo2: row.spo2,
    bloodSugar: row.blood_sugar,
    sugar: row.blood_sugar,
    bmi: row.bmi != null ? parseFloat(row.bmi) : null,
    recordedAt: row.recorded_at,
    time: row.recorded_at ? new Date(row.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    addedBy: row.recorded_by_name || 'Medical Staff'
  };
}

export function serializePrescription(row) {
  if (!row) return null;
  return {
    id: row.id,
    consultationId: row.consultation_id,
    medicineName: row.medicine_name,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    instructions: row.instructions || '',
    notes: row.instructions || '',
    createdAt: row.created_at,
    time: row.created_at ? new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    addedBy: row.doctor_name || 'Doctor'
  };
}

export function serializeConsultationInvestigation(row) {
  if (!row) return null;
  return {
    id: row.id,
    consultationId: row.consultation_id,
    investigationId: row.investigation_id,
    investigationCode: row.investigation_code,
    testName: row.testName || row.test_name,
    category: row.category,
    price: row.price != null ? parseFloat(row.price) : null,
    status: row.status || 'Ordered',
    result: row.result || null,
    orderedAt: row.ordered_at,
    orderedTime: row.ordered_at ? new Date(row.ordered_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    orderedBy: row.doctor_name || 'Doctor',
    completedAt: row.completed_at
  };
}

export function serializeConsultation(row) {
  if (!row) return null;
  return {
    id: row.id,
    consultationCode: row.consultation_code,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    patientCode: row.patient_code,
    patientName: row.patient_name,
    doctorId: row.doctor_id,
    doctorCode: row.doctor_code,
    doctorName: row.doctor_name,
    status: row.status,
    symptoms: row.symptoms || '',
    clinicalNotes: row.clinical_notes || '',
    diagnosis: row.diagnosis || '',
    treatmentPlan: row.treatment_plan || '',
    followUpAdvice: row.follow_up_advice || '',
    remarks: row.remarks || '',
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visitDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
    vitals: row.vitals ? row.vitals.map(serializeVital) : [],
    prescriptions: row.prescriptions ? row.prescriptions.map(serializePrescription) : [],
    investigations: row.investigations ? row.investigations.map(serializeConsultationInvestigation) : [],
    summary: (row.symptoms || row.diagnosis || row.clinical_notes) ? {
      symptoms: row.symptoms || '',
      findings: row.clinical_notes || '',
      diagnosis: row.diagnosis || '',
      advice: row.treatment_plan || '',
      followUp: row.follow_up_advice || '',
      remarks: row.remarks || '',
      time: row.updated_at ? new Date(row.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      addedBy: row.doctor_name || 'Doctor'
    } : null
  };
}
