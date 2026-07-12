import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

describe('POST /api/auth/login', () => {
  it('rejects an unknown username', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects a missing password with a 400 validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('logs in with correct credentials and returns a token + user', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.username).toBe('admin');
    
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const token = await loginAsAdmin();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('admin');
  });
});

describe('PATCH /api/auth/password', () => {
  it('rejects when the current password is wrong', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword123' });
    expect(res.status).toBe(400);
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Admin@123', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('changes the password so the old one stops working and the new one logs in', async () => {
    const token = await loginAsAdmin();
    const changeRes = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Admin@123', newPassword: 'TempPassword456' });
    expect(changeRes.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'TempPassword456' });
    expect(newLogin.status).toBe(200);

    // Restore the original password so later test files' loginAsAdmin() helper keeps working.
    const newToken = newLogin.body.data.token;
    const restoreRes = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${newToken}`)
      .send({ currentPassword: 'TempPassword456', newPassword: 'Admin@123' });
    expect(restoreRes.status).toBe(200);
  });
});
