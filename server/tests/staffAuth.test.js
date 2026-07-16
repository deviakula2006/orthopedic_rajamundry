import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';
import { query } from '../src/config/db.js';

describe('Staff Auth and Registration Lifecycles', () => {
  let adminToken;
  const uniqueDoctorEmail = `doc.${Date.now()}@example.com`;
  const uniqueRecEmail = `rec.${Date.now()}@example.com`;
  const testPassword = 'Password@123';

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  it('allows Admin to register a Doctor, hashes password, and creates DB links', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Ravi Test',
        specialization: 'Orthopedics',
        phone: '9000000010',
        email: uniqueDoctorEmail,
        password: testPassword,
        experienceYears: 10,
        availabilityNote: '9:00 AM - 1:00 PM'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify database links
    const { rows: docRows } = await query('SELECT * FROM doctors WHERE email = $1', [uniqueDoctorEmail]);
    expect(docRows.length).toBe(1);
    expect(docRows[0].user_id).not.toBeNull();

    const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [docRows[0].user_id]);
    expect(userRows.length).toBe(1);
    expect(userRows[0].email).toBe(uniqueDoctorEmail);
    expect(userRows[0].password_hash).not.toBe(testPassword); // Confirm hashed
  });

  it('allows the registered Doctor to log in and returns correct role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueDoctorEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('Doctor');
    expect(res.body.data.token).toBeDefined();
  });

  it('prevents non-admins (e.g. Doctor) from accessing Admin-only creation routes', async () => {
    // 1. Log in as Doctor to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueDoctorEmail,
        password: testPassword
      });
    const docToken = loginRes.body.data.token;

    // 2. Try to create another doctor
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        name: 'Dr. Copycat',
        specialization: 'Orthopedics',
        phone: '9000000011',
        email: `copycat.${Date.now()}@example.com`,
        password: testPassword
      });

    expect(res.status).toBe(403); // Forbidden
  });

  it('allows Admin to register a Receptionist, hashes password, and creates DB links', async () => {
    const res = await request(app)
      .post('/api/receptionists')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Receptionist Test',
        phone: '9000000012',
        email: uniqueRecEmail,
        password: testPassword,
        shift: 'Morning'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const { rows: recRows } = await query('SELECT * FROM receptionists WHERE email = $1', [uniqueRecEmail]);
    expect(recRows.length).toBe(1);
    expect(recRows[0].user_id).not.toBeNull();

    const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [recRows[0].user_id]);
    expect(userRows.length).toBe(1);
    expect(userRows[0].email).toBe(uniqueRecEmail);
    expect(userRows[0].password_hash).not.toBe(testPassword);
  });

  it('allows the registered Receptionist to log in and returns correct role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueRecEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('Receptionist');
    expect(res.body.data.token).toBeDefined();
  });

  it('prevents duplicate email registrations across tables', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Duplicate',
        specialization: 'Cardiology',
        phone: '9000000013',
        email: uniqueDoctorEmail, // already registered
        password: testPassword
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Email is already registered');
  });

  it('correctly deactivates linked user account and blocks login upon deactivation or soft-delete', async () => {
    const { rows: docRows } = await query('SELECT id, user_id FROM doctors WHERE email = $1', [uniqueDoctorEmail]);
    const docId = docRows[0].id;
    const userId = docRows[0].user_id;

    // 1. Deactivate doctor status
    const deactivateRes = await request(app)
      .patch(`/api/doctors/${docId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivateRes.status).toBe(200);

    // Verify user is_active is false
    const { rows: userRows1 } = await query('SELECT is_active FROM users WHERE id = $1', [userId]);
    expect(userRows1[0].is_active).toBe(false);

    // Confirm login attempt fails
    const loginFail1 = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueDoctorEmail,
        password: testPassword
      });
    expect(loginFail1.status).toBe(403);
    expect(loginFail1.body.error.message).toBe('This account has been deactivated');

    // 2. Reactivate doctor status
    const reactivateRes = await request(app)
      .patch(`/api/doctors/${docId}/status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reactivateRes.status).toBe(200);

    // Verify user is_active is true again
    const { rows: userRows2 } = await query('SELECT is_active FROM users WHERE id = $1', [userId]);
    expect(userRows2[0].is_active).toBe(true);

    // Confirm login succeeds again
    const loginSuccess = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueDoctorEmail,
        password: testPassword
      });
    expect(loginSuccess.status).toBe(200);

    // 3. Soft-delete doctor
    const deleteRes = await request(app)
      .delete(`/api/doctors/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);

    // Verify user is_active is false
    const { rows: userRows3 } = await query('SELECT is_active FROM users WHERE id = $1', [userId]);
    expect(userRows3[0].is_active).toBe(false);

    // Confirm login attempt fails
    const loginFail2 = await request(app)
      .post('/api/auth/login')
      .send({
        username: uniqueDoctorEmail,
        password: testPassword
      });
    expect(loginFail2.status).toBe(403);
  });

  it('preserves the old password when edited with an empty password, and updates it when a new password is provided', async () => {
    // 1. Create a doctor to edit
    const editDocEmail = `edit.${Date.now()}@example.com`;
    const initialPassword = 'Password@Initial';
    const updatedPassword = 'Password@Updated';

    const createRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Editable',
        specialization: 'Orthopedics',
        phone: '9000000088',
        email: editDocEmail,
        password: initialPassword,
        experienceYears: 5
      });
    expect(createRes.status).toBe(201);
    const docId = createRes.body.data.id;

    // 2. Edit doctor fields but keep password empty/blank
    const editBlankRes = await request(app)
      .put(`/api/doctors/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Editable Updated Name',
        specialization: 'Orthopedics',
        phone: '9000000088',
        email: editDocEmail,
        experienceYears: 5,
        password: '' // empty string to keep existing password
      });
    expect(editBlankRes.status).toBe(200);

    // Verify initial password still works
    const loginInitial = await request(app)
      .post('/api/auth/login')
      .send({
        username: editDocEmail,
        password: initialPassword
      });
    expect(loginInitial.status).toBe(200);

    // 3. Edit doctor with a new password
    const editPasswordRes = await request(app)
      .put(`/api/doctors/${docId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Editable Updated Name',
        specialization: 'Orthopedics',
        phone: '9000000088',
        email: editDocEmail,
        experienceYears: 5,
        password: updatedPassword // new password
      });
    expect(editPasswordRes.status).toBe(200);

    // Verify old password fails
    const loginOld = await request(app)
      .post('/api/auth/login')
      .send({
        username: editDocEmail,
        password: initialPassword
      });
    expect(loginOld.status).toBe(401);

    // Verify new password succeeds
    const loginNew = await request(app)
      .post('/api/auth/login')
      .send({
        username: editDocEmail,
        password: updatedPassword
      });
    expect(loginNew.status).toBe(200);
  });

  it('rolls back user account creation if doctor profile creation fails due to validation/DB constraints', async () => {
    const errorEmail = `fail.${Date.now()}@example.com`;
    
    // Call service directly to bypass route Zod validation and trigger database check constraint
    const doctorsService = await import('../src/modules/doctors/doctors.service.js');
    
    let errorThrown = null;
    try {
      await doctorsService.createDoctor({
        name: 'Dr. Fail Transaction',
        specialization: 'Orthopedics',
        phone: '9000000015',
        email: errorEmail,
        password: testPassword,
        experienceYears: -5 // Violates DB CHECK (experience_years >= 0)
      }, { id: '00000000-0000-0000-0000-000000000000', name: 'Admin' });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.message).toMatch(/violates check constraint/i);

    // Verify neither user nor doctor was created in the database
    const { rows: userRows } = await query('SELECT * FROM users WHERE email = $1', [errorEmail]);
    expect(userRows.length).toBe(0);

    const { rows: docRows } = await query('SELECT * FROM doctors WHERE email = $1', [errorEmail]);
    expect(docRows.length).toBe(0);
  });
});
