import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('Doctor Consultations & EMR API', () => {
  let token;
  let patientId;
  let doctorId;
  let appointmentId;
  let consultationId;

  beforeAll(async () => {
    token = await loginAsAdmin();
    const patRes = await request(app).get('/api/patients?search=Ramesh').set('Authorization', `Bearer ${token}`);
    patientId = patRes.body.data[0].id;

    const docRes = await request(app).get('/api/doctors?search=Arjun').set('Authorization', `Bearer ${token}`);
    doctorId = docRes.body.data[0].id;

    const aptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        doctorId,
        appointmentDate: new Date().toISOString().slice(0, 10),
        appointmentTime: '16:00',
        fee: 500,
        notes: 'Severe knee stiffness'
      });
    appointmentId = aptRes.body.data.id;
  });

  it('initializes or retrieves consultation for an appointment', async () => {
    const res = await request(app)
      .get(`/api/consultations/appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.appointmentId).toBe(appointmentId);
    expect(res.body.data.status).toBe('In Consultation');
    expect(res.body.data.symptoms).toBe('Severe knee stiffness');
    consultationId = res.body.data.id;
  });

  it('records vitals for the consultation', async () => {
    const res = await request(app)
      .post('/api/consultations/vitals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        appointmentId,
        consultationId,
        bpSystolic: 120,
        bpDiastolic: 80,
        pulse: 72,
        temperature: 98.6,
        weight: 70,
        height: 175,
        spo2: 99,
        bloodSugar: 110,
        bmi: 22.9
      });

    expect(res.status).toBe(201);
    expect(res.body.data.bp).toBe('120/80');
    expect(res.body.data.recordedByName).toBeDefined();
  });

  it('orders an investigation test', async () => {
    const res = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        consultationId,
        testName: 'X-Ray Knee AP/Lateral'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.testName).toBe('X-Ray Knee AP/Lateral');
    expect(res.body.data.status).toBe('Ordered');
  });

  it('adds prescriptions to the consultation', async () => {
    const res = await request(app)
      .post('/api/consultations/prescriptions/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        consultationId,
        prescriptions: [
          { medicineName: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', instructions: 'After meal' },
          { medicineName: 'Glucosamine', dosage: '500mg', frequency: '1-0-0', duration: '30 days', instructions: 'With water' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].medicineName).toBe('Paracetamol 650mg');
  });

  it('updates consultation summary notes', async () => {
    const res = await request(app)
      .put(`/api/consultations/${consultationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        symptoms: 'Knee joint pain and swelling',
        clinicalNotes: 'Mild effusion observed',
        diagnosis: 'Grade 2 Osteoarthritis Knee',
        treatmentPlan: 'Physiotherapy and prescribed oral medication',
        followUpAdvice: 'Review after 2 weeks'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.diagnosis).toBe('Grade 2 Osteoarthritis Knee');
  });

  it('completes consultation atomically in a transaction', async () => {
    const res = await request(app)
      .post(`/api/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        diagnosis: 'Grade 2 Osteoarthritis Knee'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');

    // Check appointment status updated to Completed
    const aptRes = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(aptRes.body.data.status).toBe('Completed');
  });

  it('fetches patient EMR visit timeline', async () => {
    const res = await request(app)
      .get(`/api/consultations/patient/${patientId}/history?doctorId=${doctorId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const latest = res.body.data[0];
    expect(latest.vitals).toHaveLength(1);
    expect(latest.prescriptions).toHaveLength(2);
    expect(latest.investigations).toHaveLength(1);
  });

  it('fetches live doctor dashboard summary and queue', async () => {
    const res = await request(app)
      .get(`/api/doctors/dashboard?doctorId=${doctorId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.queue).toBeDefined();
  });
});
