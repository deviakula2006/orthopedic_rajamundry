import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';

async function findPatientId(token, search) {
  const res = await request(app).get(`/api/patients?search=${search}`).set('Authorization', `Bearer ${token}`);
  return res.body.data[0].id;
}

describe('Bills API', () => {
  let token;
  let patientId;

  beforeAll(async () => {
    token = await loginAsAdmin();
    patientId = await findPatientId(token, 'Mohan');
  });

  it('rejects a bill with no line items', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, billType: 'OPD', items: [] });
    expect(res.status).toBe(400);
  });

  it('computes subTotal and total server-side from line items, ignoring any client-sent total', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        billType: 'OPD',
        discount: 50,
        tax: 25,
        total: 999999, // must be ignored — server recomputes from items
        items: [
          { description: 'Consultation', itemType: 'Consultation', amount: 500 },
          { description: 'Bandage', itemType: 'Pharmacy', amount: 100, quantity: 2 }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.subTotal).toBe(700); // 500 + 100*2
    expect(res.body.data.total).toBe(675); // 700 - 50 + 25
    expect(res.body.data.items).toHaveLength(2);
  });

  it('rejects a discount that would make the total negative', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        billType: 'OPD',
        discount: 100000,
        items: [{ description: 'Consultation', itemType: 'Consultation', amount: 500 }]
      });
    expect(res.status).toBe(400);
  });

  it('updates payment status', async () => {
    const created = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({ patientId, billType: 'OPD', items: [{ description: 'X', itemType: 'Other', amount: 100 }] });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/bills/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentStatus: 'Paid', paymentMode: 'Cash' });
    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('Paid');
  });
});
