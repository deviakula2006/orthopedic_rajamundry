import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

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
  let patientId;
  let patient2Id;
  let doctorId;

  beforeAll(async () => {
    token = await loginAsAdmin();
    patientId = await findPatientId(token, 'Ramesh');
    patient2Id = await findPatientId(token, 'Anjali');
    doctorId = await findDoctorId(token, 'Arjun');
  });

  it('books an appointment', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, doctorId, appointmentDate: '2026-09-01', appointmentTime: '10:00', fee: 500 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Scheduled');
  });

  it('rejects double-booking the same doctor at the same date and time', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: patient2Id, doctorId, appointmentDate: '2026-09-01', appointmentTime: '10:00' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('allows the same doctor at a different time on the same day', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId: patient2Id, doctorId, appointmentDate: '2026-09-01', appointmentTime: '10:30' });
    expect(res.status).toBe(201);
  });

  it('transitions status via PATCH /:id/status', async () => {
    const created = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, doctorId, appointmentDate: '2026-09-02', appointmentTime: '09:00' });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/appointments/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
  });

  it('permanently deletes appointment via DELETE /:id', async () => {
    const created = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, doctorId, appointmentDate: '2026-09-03', appointmentTime: '09:00' });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);

    // No longer fetchable — permanently removed from database
    const read = await request(app).get(`/api/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(404);
  });
});
