import request from 'supertest';
import { createApp } from '../src/app.js';

export const app = createApp();

export async function loginAsAdmin() {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@123' });
  return res.body.data.token;
}

export async function loginAsReceptionist() {
  const adminToken = await loginAsAdmin();
  const recUsername = 'receptionist_test';
  const recEmail = 'receptionist.test@example.com';
  const password = 'Reception@123';

  // Try login
  const loginRes = await request(app).post('/api/auth/login').send({ username: recUsername, password });
  if (loginRes.body?.data?.token) {
    return loginRes.body.data.token;
  }

  // Create receptionist account
  await request(app)
    .post('/api/receptionists')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Receptionist',
      username: recUsername,
      phone: '9000000099',
      email: recEmail,
      password,
      shift: 'Morning'
    });

  const res = await request(app).post('/api/auth/login').send({ username: recUsername, password });
  return res.body.data.token;
}
