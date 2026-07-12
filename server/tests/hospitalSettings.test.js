import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('Hospital Settings API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/hospital-settings');
    expect(res.status).toBe(401);
  });

  it('returns the seeded hospital settings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app).get('/api/hospital-settings').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Rajahmundry Orthopedic Hospital');
  });

  it('updates a single field and persists it', async () => {
    const token = await loginAsAdmin();
    const update = await request(app)
      .put('/api/hospital-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ contactPhone: '+91 999 999 9999' });
    expect(update.status).toBe(200);
    expect(update.body.data.contactPhone).toBe('+91 999 999 9999');
    expect(update.body.data.name).toBe('Rajahmundry Orthopedic Hospital'); // untouched fields survive

    const read = await request(app).get('/api/hospital-settings').set('Authorization', `Bearer ${token}`);
    expect(read.body.data.contactPhone).toBe('+91 999 999 9999');
  });

  it('rejects an empty update body', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .put('/api/hospital-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
