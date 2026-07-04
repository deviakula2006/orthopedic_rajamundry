import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('Patients API', () => {
  let token;

  beforeAll(async () => {
    token = await loginAsAdmin();
  });

  it('lists seeded patients', async () => {
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(7);
  });

  it('rejects an invalid gender on create', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Gender', gender: 'Alien', phone: '9000000001' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.gender).toBeDefined();
  });

  it('supports the full create -> read -> update -> delete -> 404 lifecycle', async () => {
    const create = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lifecycle Patient', gender: 'Male', phone: '9000000002', age: 40 });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    expect(create.body.data.code).toMatch(/^PT\d+$/);

    const read = await request(app).get(`/api/patients/${id}`).set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body.data.name).toBe('Lifecycle Patient');

    const update = await request(app)
      .put(`/api/patients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ age: 41 });
    expect(update.status).toBe(200);
    expect(update.body.data.age).toBe(41);
    expect(update.body.data.name).toBe('Lifecycle Patient'); // untouched fields survive partial update

    const del = await request(app).delete(`/api/patients/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const afterDelete = await request(app).get(`/api/patients/${id}`).set('Authorization', `Bearer ${token}`);
    expect(afterDelete.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });
});
