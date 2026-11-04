import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';
import { query } from '../src/config/db.js';

describe('Password Recovery, Staff Profiles & Settings Management', () => {
  let adminToken;
  let doctorToken;
  let receptionistToken;

  const testDoctorEmail = `testdoc.${Date.now()}@example.com`;
  const testRecEmail = `testrec.${Date.now()}@example.com`;
  const initialDoctorPass = 'DocInitial@123';
  const initialRecPass = 'RecInitial@123';

  let doctorId;
  let receptionistId;
  let doctorUsername;
  let recUsername;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    // 1. Create a Doctor via Admin
    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Profile Test',
        specialization: 'Orthopedic Spine Surgery',
        phone: '9888877771',
        email: testDoctorEmail,
        password: initialDoctorPass,
        experienceYears: 12,
        availabilityNote: '10:00 AM - 2:00 PM'
      });
    expect(docRes.status).toBe(201);
    doctorId = docRes.body.data.id;

    // Login as Doctor
    const docLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testDoctorEmail, password: initialDoctorPass });
    expect(docLogin.status).toBe(200);
    doctorToken = docLogin.body.data.token;
    doctorUsername = docLogin.body.data.user.username;

    // 2. Create a Receptionist via Admin
    const recRes = await request(app)
      .post('/api/receptionists')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Receptionist Profile Test',
        phone: '9888877772',
        email: testRecEmail,
        password: initialRecPass,
        shift: 'Evening (4 PM - 12 AM)'
      });
    expect(recRes.status).toBe(201);
    receptionistId = recRes.body.data.id;

    // Login as Receptionist
    const recLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testRecEmail, password: initialRecPass });
    expect(recLogin.status).toBe(200);
    receptionistToken = recLogin.body.data.token;
    recUsername = recLogin.body.data.user.username;
  });

  /* --------------------------------------------------------------------------
     1. USER PROFILES (Admin, Doctor, Receptionist)
  -------------------------------------------------------------------------- */
  describe('Profile retrieval & persistence', () => {
    it('returns Doctor profile with specialization, experience and phone on GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('Doctor');
      expect(res.body.data.email).toBe(testDoctorEmail);
      expect(res.body.data.specialization).toBe('Orthopedic Spine Surgery');
      expect(res.body.data.experienceYears).toBe(12);
      expect(res.body.data.phone).toBe('9888877771');
      expect(res.body.data.doctorCode).toMatch(/^DOC/);
    });

    it('returns Receptionist profile with shift and phone on GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('Receptionist');
      expect(res.body.data.email).toBe(testRecEmail);
      expect(res.body.data.shift).toBe('Evening (4 PM - 12 AM)');
      expect(res.body.data.phone).toBe('9888877772');
      expect(res.body.data.receptionistCode).toMatch(/^REC/);
    });

    it('allows a Doctor to update their own profile and syncs changes to PostgreSQL', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Dr. Profile Updated',
          phone: '9888877779',
          specialization: 'Pediatric Orthopedics',
          experienceYears: 15
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Dr. Profile Updated');
      expect(res.body.data.phone).toBe('9888877779');
      expect(res.body.data.specialization).toBe('Pediatric Orthopedics');
      expect(res.body.data.experienceYears).toBe(15);

      // Verify persistence in doctors table
      const { rows } = await query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
      expect(rows[0].name).toBe('Dr. Profile Updated');
      expect(rows[0].phone).toBe('9888877779');
      expect(rows[0].specialization).toBe('Pediatric Orthopedics');
      expect(rows[0].experience_years).toBe(15);
    });

    it('allows a Receptionist to update their own profile and syncs shift and phone', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          name: 'Receptionist Shift Updated',
          phone: '9999900000',
          shift: 'Night (12 AM - 8 AM)'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Receptionist Shift Updated');
      expect(res.body.data.shift).toBe('Night (12 AM - 8 AM)');

      const { rows } = await query('SELECT * FROM receptionists WHERE id = $1', [receptionistId]);
      expect(rows[0].shift).toBe('Night (12 AM - 8 AM)');
      expect(rows[0].phone).toBe('9999900000');
    });
  });

  /* --------------------------------------------------------------------------
     2. CHANGE OWN PASSWORD (All Roles)
  -------------------------------------------------------------------------- */
  describe('Change own password functionality', () => {
    it('rejects incorrect current password', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'BrandNewPassword@123',
          confirmPassword: 'BrandNewPassword@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Current password is incorrect');
    });

    it('rejects when new password and confirm password do not match', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: initialDoctorPass,
          newPassword: 'BrandNewPassword@123',
          confirmPassword: 'MismatchedPassword@123'
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error)).toContain('match');
    });

    it('successfully changes Doctor password and validates login with new credentials', async () => {
      const newDoctorPass = 'BrandNewPassword@123';

      const res = await request(app)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: initialDoctorPass,
          newPassword: newDoctorPass,
          confirmPassword: newDoctorPass
        });

      expect(res.status).toBe(200);

      // Old password must fail
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorEmail, password: initialDoctorPass });
      expect(oldLogin.status).toBe(401);

      // New password must succeed
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorEmail, password: newDoctorPass });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.data.token).toBeDefined();

      // Update doctorToken for subsequent tests
      doctorToken = newLogin.body.data.token;
    });
  });

  /* --------------------------------------------------------------------------
     3. ADMIN PASSWORD MANAGEMENT FOR DOCTOR & RECEPTIONIST
  -------------------------------------------------------------------------- */
  describe('Admin staff password management', () => {
    it('allows Admin to reset a Doctor password with validation, and old password ceases to work', async () => {
      const adminSetPassword = 'AdminSetDoctorPass@2026';

      const editRes = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Profile Updated',
          phone: '9888877779',
          email: testDoctorEmail,
          specialization: 'Pediatric Orthopedics',
          experienceYears: 15,
          password: adminSetPassword
        });

      expect(editRes.status).toBe(200);

      // Previous password fails
      const prevLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorEmail, password: 'BrandNewPassword@123' });
      expect(prevLogin.status).toBe(401);

      // Admin set password succeeds
      const adminSetLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorEmail, password: adminSetPassword });
      expect(adminSetLogin.status).toBe(200);
      doctorToken = adminSetLogin.body.data.token;
    });

    it('keeps existing password unchanged when Admin leaves password field empty', async () => {
      const editRes = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Profile Name Only Update',
          phone: '9888877779',
          email: testDoctorEmail,
          specialization: 'Pediatric Orthopedics',
          experienceYears: 15,
          password: '' // empty string: keep existing
        });

      expect(editRes.status).toBe(200);

      // Current password still functions
      const loginCheck = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorEmail, password: 'AdminSetDoctorPass@2026' });
      expect(loginCheck.status).toBe(200);
    });
  });

  /* --------------------------------------------------------------------------
     4. FORGOT PASSWORD & OTP RECOVERY FLOW (All Roles)
  -------------------------------------------------------------------------- */
  describe('OTP-based password recovery flow', () => {
    it('returns a generic success message when requesting OTP for an existing or non-existing account', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: doctorUsername });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('recovery email');

      // Check non-existing username
      const nonExistentRes = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: 'nonexistentuser9999' });

      expect(nonExistentRes.status).toBe(200);
      expect(nonExistentRes.body.data.message).toContain('recovery email');
    });

    it('stores hashed OTP in database with 5-minute expiry', async () => {
      const { rows } = await query(
        `SELECT otp_hash, attempts, is_used, expires_at
         FROM password_reset_otps
         WHERE user_id = (SELECT id FROM users WHERE username = $1)
         ORDER BY created_at DESC LIMIT 1`,
        [doctorUsername]
      );

      expect(rows.length).toBe(1);
      expect(rows[0].otp_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash
      expect(rows[0].attempts).toBe(0);
      expect(rows[0].is_used).toBe(false);
      expect(new Date(rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects invalid OTP attempts and increments failed attempt counter', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/verify')
        .send({
          username: doctorUsername,
          otp: '000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid verification code');

      const { rows } = await query(
        `SELECT attempts FROM password_reset_otps
         WHERE user_id = (SELECT id FROM users WHERE username = $1)
         ORDER BY created_at DESC LIMIT 1`,
        [doctorUsername]
      );
      expect(rows[0].attempts).toBe(1);
    });

    it('completes the recovery flow: verifies OTP, issues reset token, and resets password', async () => {
      // 1. Manually insert a known OTP hash for deterministic testing of the verification and reset cycle
      const bcrypt = await import('bcryptjs');
      const testOtp = '765432';
      const testOtpHash = await bcrypt.default.hash(testOtp, 10);

      const { rows: userRows } = await query('SELECT id FROM users WHERE username = $1', [doctorUsername]);
      const userId = userRows[0].id;

      // Invalidate existing
      await query('UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = $1', [userId]);

      await query(
        `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
         VALUES ($1, $2, now() + interval '5 minutes')`,
        [userId, testOtpHash]
      );

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/forgot-password/verify')
        .send({
          username: doctorUsername,
          otp: testOtp
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.resetToken).toBeDefined();
      const resetToken = verifyRes.body.data.resetToken;

      // 3. Reset Password
      const recoveredPassword = 'RecoveredDoctorPassword@2026';
      const resetRes = await request(app)
        .post('/api/auth/forgot-password/reset')
        .send({
          username: doctorUsername,
          resetToken,
          newPassword: recoveredPassword,
          confirmPassword: recoveredPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.data.message).toContain('reset successfully');

      // 4. Verify OTP was marked as used (cannot be replayed)
      const { rows: usedRows } = await query(
        'SELECT is_used FROM password_reset_otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      expect(usedRows[0].is_used).toBe(true);

      // Replay attempt must fail
      const replayRes = await request(app)
        .post('/api/auth/forgot-password/reset')
        .send({
          username: doctorUsername,
          resetToken,
          newPassword: 'AnotherPassword@123',
          confirmPassword: 'AnotherPassword@123'
        });
      expect(replayRes.status).toBe(400);

      // 5. Verify new password allows login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: doctorUsername, password: recoveredPassword });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  /* --------------------------------------------------------------------------
     5. HOSPITAL RECOVERY EMAIL & SETTINGS DYNAMICS
  -------------------------------------------------------------------------- */
  describe('Hospital Settings & dynamic recovery email', () => {
    it('allows Admin to update the hospital recovery email and persists in database', async () => {
      const newRecoveryEmail = 'updated.hospital.inbox@gmail.com';

      const updateRes = await request(app)
        .put('/api/hospital-settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rajahmundry Orthopedic Hospital',
          email: newRecoveryEmail,
          gstRate: 5.5
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.email).toBe(newRecoveryEmail);
      expect(updateRes.body.data.gstRate).toBe(5.5);

      // Verify PostgreSQL persistence
      const { rows } = await query('SELECT email, gst_rate FROM hospital_settings WHERE id = 1');
      expect(rows[0].email).toBe(newRecoveryEmail);
      expect(Number(rows[0].gst_rate)).toBe(5.5);

      // Subsequent settings fetch returns updated email
      const getRes = await request(app)
        .get('/api/hospital-settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.email).toBe(newRecoveryEmail);
    });
  });
});
