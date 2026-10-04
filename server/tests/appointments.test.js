import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin, loginAsReceptionist } from './helpers.js';

async function findPatientId(token, search) {
  const res = await request(app).get(`/api/patients?search=${search}`).set('Authorization', `Bearer ${token}`);
  return res.body.data[0].id;
}

async function findDoctorId(token, search) {
  const res = await request(app).get(`/api/doctors?search=${search}`).set('Authorization', `Bearer ${token}`);
  return res.body.data[0].id;
}

describe('Appointments API', () => {
  let token;
  let recToken;
  let patientId;
  let patient2Id;
  let doctorId;

  beforeAll(async () => {
    token = await loginAsAdmin();
    recToken = await loginAsReceptionist();
    patientId = await findPatientId(token, 'Ramesh');
    patient2Id = await findPatientId(token, 'Anjali');
    doctorId = await findDoctorId(token, 'Arjun');
  });

  it('books an appointment', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      // Use a well-future date so IST date/time validation never rejects it
      .send({ patientId, doctorId, appointmentDate: '2027-01-15', appointmentTime: '10:00 AM', fee: 500 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Scheduled');
  });

  it('rejects double-booking the same doctor at the same date and time', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: patient2Id, doctorId, appointmentDate: '2027-01-15', appointmentTime: '10:00 AM' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('allows the same doctor at a different time on the same day', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: patient2Id, doctorId, appointmentDate: '2027-01-15', appointmentTime: '10:30 AM' });
    expect(res.status).toBe(201);
  });

  it('transitions status via PATCH /:id/status', async () => {
    const created = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, doctorId, appointmentDate: '2027-01-16', appointmentTime: '09:00 AM' });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/appointments/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
  });

  it('allows receptionist to order an investigation for an appointment', async () => {
    const apt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${recToken}`)
      .send({ patientId, doctorId, appointmentDate: '2027-01-18', appointmentTime: '11:00 AM' });
    expect(apt.status).toBe(201);

    const consRes = await request(app)
      .get(`/api/consultations/appointment/${apt.body.data.id}`)
      .set('Authorization', `Bearer ${recToken}`);
    expect(consRes.status).toBe(200);

    const invRes = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${recToken}`)
      .send({
        consultationId: consRes.body.data.id,
        testName: 'MRI Spine'
      });
    expect(invRes.status).toBe(201);
    expect(invRes.body.data.testName).toBe('MRI Spine');
  });

  it('permanently deletes appointment even when vitals and consultations exist', async () => {
    const created = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, doctorId, appointmentDate: '2027-01-17', appointmentTime: '09:00 AM' });
    const id = created.body.data.id;

    // Attach vitals & consultation
    await request(app)
      .post('/api/consultations/vitals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        appointmentId: id,
        bpSystolic: 120,
        bpDiastolic: 80
      });

    const del = await request(app).delete(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);

    // No longer fetchable — permanently removed from database
    const read = await request(app).get(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(404);
  });
});
