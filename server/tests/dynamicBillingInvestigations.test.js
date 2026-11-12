import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin, loginAsReceptionist } from './helpers.js';
import { query } from '../src/config/db.js';

describe('Dynamic Investigation Orders in Billing', () => {
  let adminToken;
  let receptionistToken;
  let doctorToken;
  let patientAId;
  let patientBId;
  let doctorId;
  let catalogInv1;
  let catalogInv2;
  let catalogInv3;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    receptionistToken = await loginAsReceptionist();

    // Create a doctor with independent username for testing
    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Vikram Sarabhai',
        username: 'doc_vikram',
        email: 'vikram.sarabhai@example.com',
        phone: '9876543210',
        specialization: 'Orthopedic Surgeon',
        consultationFee: 700,
        status: 'Active',
        password: 'Doctor@123'
      });
    doctorId = docRes.body?.data?.id;

    // Login as doctor
    const docLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'doc_vikram', password: 'Doctor@123' });
    doctorToken = docLogin.body?.data?.token;

    // Create Patient A
    const patARes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ananya Sharma',
        age: 32,
        gender: 'Female',
        phone: '9123456780',
        address: 'Main Road, Rajahmundry'
      });
    patientAId = patARes.body.data.id;

    // Create Patient B
    const patBRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bhavani Prasad',
        age: 45,
        gender: 'Male',
        phone: '9123456781',
        address: 'Kotagummam, Rajahmundry'
      });
    patientBId = patBRes.body.data.id;

    // Fetch catalog investigations
    const invRes = await request(app)
      .get('/api/investigations')
      .set('Authorization', `Bearer ${adminToken}`);
    const catalog = invRes.body.data;
    catalogInv1 = catalog[0];
    catalogInv2 = catalog[1] || catalog[0];
    catalogInv3 = catalog[2] || catalog[0];
  });

  let orderAdminId;
  let orderReceptionistId;
  let orderDoctorId;
  let orderPastDateId;

  it('1. Admin creates an investigation and it appears in pending billing', async () => {
    const res = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        investigationId: catalogInv1.id,
        testName: catalogInv1.testName
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Ordered');
    orderAdminId = res.body.data.id;

    // Check pending investigations for Patient A
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const found = pendingRes.body.data.find((o) => o.id === orderAdminId);
    expect(found).toBeDefined();
    expect(found.testName).toBe(catalogInv1.testName);
    expect(found.price).toBe(catalogInv1.price);
  });

  it('2. Receptionist creates an investigation and it appears in pending billing', async () => {
    const res = await request(app)
      .post('/api/investigations/orders')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: patientAId,
        investigationId: catalogInv2.id,
        testName: catalogInv2.testName
      });
    expect(res.status).toBe(201);
    orderReceptionistId = res.body.data.id;

    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${receptionistToken}`);
    expect(pendingRes.status).toBe(200);
    const found = pendingRes.body.data.find((o) => o.id === orderReceptionistId);
    expect(found).toBeDefined();
  });

  it('3. Doctor creates an investigation and it appears in pending billing', async () => {
    const res = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAId,
        investigationId: catalogInv3.id,
        testName: catalogInv3.testName
      });
    expect(res.status).toBe(201);
    orderDoctorId = res.body.data.id;

    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const found = pendingRes.body.data.find((o) => o.id === orderDoctorId);
    expect(found).toBeDefined();
  });

  it('4. An investigation from a previous date appears if still eligible', async () => {
    // Create an order and backdate it by 15 days in PostgreSQL
    const res = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        testName: 'Bone Density Scan (Historical)'
      });
    expect(res.status).toBe(201);
    orderPastDateId = res.body.data.id;

    await query(
      `UPDATE consultation_investigations SET ordered_at = now() - INTERVAL '15 days' WHERE id = $1`,
      [orderPastDateId]
    );

    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const found = pendingRes.body.data.find((o) => o.id === orderPastDateId);
    expect(found).toBeDefined();
    expect(found.testName).toBe('Bone Density Scan (Historical)');
  });

  it('5. Today investigation appears if still eligible', async () => {
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const found = pendingRes.body.data.find((o) => o.id === orderAdminId);
    expect(found).toBeDefined();
  });

  it('6. Investigations belonging to another patient never appear', async () => {
    const pendingResB = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientBId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingResB.status).toBe(200);

    // None of Patient A's orders should be in Patient B's pending list
    const patientAOrderIds = [orderAdminId, orderReceptionistId, orderDoctorId, orderPastDateId];
    for (const order of pendingResB.body.data) {
      expect(patientAOrderIds).not.toContain(order.id);
    }
  });

  it('7. Cancelled investigation orders do not appear', async () => {
    // Create an order and cancel it
    const createRes = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        testName: 'Cancelled Test Order'
      });
    expect(createRes.status).toBe(201);
    const cancelOrderId = createRes.body.data.id;

    // Cancel the order
    const cancelRes = await request(app)
      .delete(`/api/consultations/investigations/${cancelOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelRes.status).toBe(200);

    // Check pending investigations
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const found = pendingRes.body.data.find((o) => o.id === cancelOrderId);
    expect(found).toBeUndefined();
  });

  it('8. Consultation-only billing remains correct and does not include investigations', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        doctorId,
        billType: 'OPD',
        items: [
          {
            description: 'Orthopedic Specialist Consultation',
            itemType: 'Consultation',
            amount: 700
          }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.subTotal).toBe(700);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].type).toBe('Consultation');

    // Patient A's investigation orders should still be pending
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const found = pendingRes.body.data.find((o) => o.id === orderAdminId);
    expect(found).toBeDefined();
  });

  it('9. Lab-investigation-only billing generates invoice and marks investigation as billed', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        billType: 'Lab',
        items: [
          {
            consultationInvestigationId: orderAdminId,
            investigationId: catalogInv1.id,
            description: catalogInv1.testName,
            itemType: 'Investigation',
            amount: catalogInv1.price
          }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.subTotal).toBe(catalogInv1.price);
    expect(res.body.data.items[0].consultationInvestigationId).toBe(orderAdminId);

    // The order must NO LONGER appear in pending investigations
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const found = pendingRes.body.data.find((o) => o.id === orderAdminId);
    expect(found).toBeUndefined();
  });

  it('10. Reject duplicate billing of already-billed investigation (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        billType: 'Lab',
        items: [
          {
            consultationInvestigationId: orderAdminId, // Already billed above
            description: catalogInv1.testName,
            itemType: 'Investigation',
            amount: catalogInv1.price
          }
        ]
      });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('already been billed');
  });

  it('11. Both category billing correctly combines consultation and multiple investigation orders', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        doctorId,
        billType: 'OPD',
        items: [
          {
            description: 'Senior Consultant Follow Up',
            itemType: 'Consultation',
            amount: 500
          },
          {
            consultationInvestigationId: orderReceptionistId,
            investigationId: catalogInv2.id,
            description: catalogInv2.testName,
            itemType: 'Investigation',
            amount: catalogInv2.price
          },
          {
            consultationInvestigationId: orderDoctorId,
            investigationId: catalogInv3.id,
            description: catalogInv3.testName,
            itemType: 'Investigation',
            amount: catalogInv3.price
          }
        ]
      });
    expect(res.status).toBe(201);
    const expectedSubTotal = 500 + catalogInv2.price + catalogInv3.price;
    expect(res.body.data.subTotal).toBe(expectedSubTotal);
    expect(res.body.data.items).toHaveLength(3);

    // Both orders are now billed
    const pendingRes = await request(app)
      .get(`/api/bills/pending-investigations?patientId=${patientAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const found2 = pendingRes.body.data.find((o) => o.id === orderReceptionistId);
    const found3 = pendingRes.body.data.find((o) => o.id === orderDoctorId);
    expect(found2).toBeUndefined();
    expect(found3).toBeUndefined();
  });

  it('12. Rejects billing an investigation belonging to another patient', async () => {
    // Attempt to bill Patient A's past order under Patient B's bill
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientBId,
        billType: 'Lab',
        items: [
          {
            consultationInvestigationId: orderPastDateId, // Belongs to Patient A!
            description: 'Bone Density Scan (Historical)',
            itemType: 'Investigation',
            amount: 1500
          }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('does not belong to the selected patient');
  });

  it('13. Concurrent attempts to bill the same investigation succeed exactly once', async () => {
    // Create an unbilled order for testing concurrency
    const createRes = await request(app)
      .post('/api/consultations/investigations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        testName: 'Concurrency Test Investigation'
      });
    expect(createRes.status).toBe(201);
    const concurrentOrderId = createRes.body.data.id;

    // Dispatch two simultaneous requests to bill the exact same order
    const makeBillRequest = () =>
      request(app)
        .post('/api/bills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId: patientAId,
          billType: 'Lab',
          items: [
            {
              consultationInvestigationId: concurrentOrderId,
              description: 'Concurrency Test Investigation',
              itemType: 'Investigation',
              amount: 1000
            }
          ]
        });

    const [res1, res2] = await Promise.all([makeBillRequest(), makeBillRequest()]);

    const statuses = [res1.status, res2.status].sort();
    // One must succeed (201) and the other must be rejected (409)
    expect(statuses).toEqual([201, 409]);

    // Check database has exactly 1 bill item referencing this investigation order
    const { rows: biRows } = await query(
      `SELECT COUNT(*)::int AS count FROM bill_items WHERE consultation_investigation_id = $1`,
      [concurrentOrderId]
    );
    expect(biRows[0].count).toBe(1);
  });

  it('14. Reports classify Both, Consultation, and Investigation bills accurately', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const repRes = await request(app)
      .get(`/api/reports/revenue?dateFrom=${today}&dateTo=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(repRes.status).toBe(200);

    const categories = repRes.body.data.items.map((r) => r.category);
    expect(categories).toContain('Consultation');
    expect(categories).toContain('Investigation');
    expect(categories).toContain('Both');
  });
});

