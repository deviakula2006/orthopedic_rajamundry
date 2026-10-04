import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('Investigations Catalog API', () => {
  let adminToken;
  let testInvId;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  it('lists existing investigations from catalog', async () => {
    const res = await request(app)
      .get('/api/investigations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].category).toBeDefined();
  });

  it('rejects creating an investigation when category is missing', async () => {
    const res = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        testName: 'Bone Mineral Density Scan',
        price: 2500
      });

    expect(res.status).toBe(400);
    expect(res.body.error.details.category).toBeDefined();
  });

  it('creates an investigation with required category', async () => {
    const res = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        testName: 'Bone Mineral Density Scan (DEXA)',
        category: 'Orthopedic',
        price: 2500
      });

    expect(res.status).toBe(201);
    expect(res.body.data.testName).toBe('Bone Mineral Density Scan (DEXA)');
    expect(res.body.data.category).toBe('Orthopedic');
    expect(res.body.data.price).toBe(2500);
    testInvId = res.body.data.id;
  });

  it('updates the investigation details including category and price', async () => {
    const res = await request(app)
      .put(`/api/investigations/${testInvId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        testName: 'Bone Mineral Density Scan (DEXA) - Dual Hip',
        category: 'Orthopedic',
        price: 2800
      });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(2800);
    expect(res.body.data.testName).toContain('Dual Hip');
  });

  it('deactivates/removes the investigation', async () => {
    const res = await request(app)
      .delete(`/api/investigations/${testInvId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
