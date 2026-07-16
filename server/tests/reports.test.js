import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('Reports API', () => {
  let token;

  beforeAll(async () => {
    token = await loginAsAdmin();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/reports/revenue');
    expect(res.status).toBe(401);
  });

  it('validates query parameters and rejects invalid format', async () => {
    const res = await request(app)
      .get('/api/reports/revenue')
      .set('Authorization', `Bearer ${token}`)
      .query({ dateFrom: 'invalid-date', dateTo: '2026-12-31' });
    expect(res.status).toBe(400);
  });

  it('returns revenue report data structure', async () => {
    const res = await request(app)
      .get('/api/reports/revenue')
      .set('Authorization', `Bearer ${token}`)
      .query({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalCollected).toBeDefined();
    expect(Array.isArray(res.body.data.trend)).toBe(true);
    expect(res.body.data.trend.length).toBe(7); // Monday through Sunday
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('returns patients registrations report data structure', async () => {
    const res = await request(app)
      .get('/api/reports/patients')
      .set('Authorization', `Bearer ${token}`)
      .query({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRegistrations).toBeDefined();
    expect(Array.isArray(res.body.data.trend)).toBe(true);
    expect(res.body.data.trend.length).toBe(7);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('returns investigations report data structure', async () => {
    const res = await request(app)
      .get('/api/reports/investigations')
      .set('Authorization', `Bearer ${token}`)
      .query({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalTestsOrdered).toBeDefined();
    expect(Array.isArray(res.body.data.trend)).toBe(true);
    expect(res.body.data.trend.length).toBe(7);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
