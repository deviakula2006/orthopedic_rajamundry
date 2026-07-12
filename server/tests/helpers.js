import request from 'supertest';
import { createApp } from '../src/app.js';

export const app = createApp();

export async function loginAsAdmin() {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@123' });
  return res.body.data.token;
}
