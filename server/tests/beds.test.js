import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

async function findAvailableBed(token) {
  const res = await request(app).get('/api/beds?status=Available').set('Authorization', `Bearer ${token}`);
  return res.body.data[0].id;
}

async function findPatientId(token, search) {
  const res = await request(app).get(`/api/patients?search=${search}`).set('Authorization', `Bearer ${token}`);
  return res.body.data[0].id;
}

describe('Beds API', () => {
  let token;
  let bedId;
  let patientId;

  beforeAll(async () => {
    token = await loginAsAdmin();
    bedId = await findAvailableBed(token);
    patientId = await findPatientId(token, 'Lalitha');
  });

  it('assigns an available bed to a patient', async () => {
    const res = await request(app)
      .post(`/api/beds/${bedId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Occupied');
    expect(res.body.data.patient.id).toBe(patientId);
  });

  it('rejects assigning an already-occupied bed (409)', async () => {
    const res = await request(app)
      .post(`/api/beds/${bedId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId });
    expect(res.status).toBe(409);
  });

  it('records an open admission with no discharge date', async () => {
    const res = await request(app).get(`/api/beds/${bedId}/admissions`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].dischargedAt).toBeNull();
  });

  it('rejects releasing a bed that is not occupied (409)', async () => {
    const otherBed = (await request(app).get('/api/beds?status=Available').set('Authorization', `Bearer ${token}`))
      .body.data[0].id;
    const res = await request(app).post(`/api/beds/${otherBed}/release`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('releases an occupied bed and closes the admission record', async () => {
    const res = await request(app).post(`/api/beds/${bedId}/release`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Available');
    expect(res.body.data.patient).toBeNull();

    const history = await request(app).get(`/api/beds/${bedId}/admissions`).set('Authorization', `Bearer ${token}`);
    expect(history.body.data[0].dischargedAt).not.toBeNull();
  });
});
