import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app, loginAsAdmin } from './helpers.js';
import { query } from '../src/config/db.js';

describe('Secure Two-Option OTP Password Recovery System', () => {
  let adminToken;
  let doctorToken;
  let receptionistToken;

  const timestamp = Date.now();
  const testDoctorUsername = `dr_two_opt_${timestamp}`;
  const testDoctorEmail = `doctor.opt.${timestamp}@hospital.com`;
  const initialDoctorPass = 'DocPassword@2026';

  const testRecUsername = `rec_two_opt_${timestamp}`;
  const testRecEmail = `rec.opt.${timestamp}@hospital.com`;
  const initialRecPass = 'RecPassword@2026';

  let doctorUserId;
  let recUserId;
  let adminEmail;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    // Fetch admin email from DB
    const adminUserRes = await query(
      `SELECT u.id, u.email FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'Admin' AND u.deleted_at IS NULL
       ORDER BY u.created_at ASC LIMIT 1`
    );
    adminEmail = adminUserRes.rows[0]?.email || 'admin@hospital.com';

    // 1. Create a Doctor
    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Two Option Doctor',
        username: testDoctorUsername,
        specialization: 'Orthopedic Trauma',
        phone: '9876543210',
        email: testDoctorEmail,
        password: initialDoctorPass,
        experienceYears: 10,
        availabilityNote: 'Daily 9 AM - 1 PM'
      });
    expect(docRes.status).toBe(201);

    const docLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testDoctorUsername, password: initialDoctorPass });
    expect(docLogin.status).toBe(200);
    doctorToken = docLogin.body.data.token;
    doctorUserId = docLogin.body.data.user.id;

    // 2. Create a Receptionist
    const recRes = await request(app)
      .post('/api/receptionists')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Two Option Receptionist',
        username: testRecUsername,
        phone: '9876543211',
        email: testRecEmail,
        password: initialRecPass,
        shift: 'Morning (8 AM - 4 PM)'
      });
    expect(recRes.status).toBe(201);

    const recLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testRecUsername, password: initialRecPass });
    expect(recLogin.status).toBe(200);
    receptionistToken = recLogin.body.data.token;
    recUserId = recLogin.body.data.user.id;
  });

  /* --------------------------------------------------------------------------
     1. INITIATION & ANTI-ENUMERATION
  -------------------------------------------------------------------------- */
  describe('Phase 1: Initiation and Options Generation', () => {
    it('returns accountFound true for registered Doctor email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.accountFound).toBe(true);
    });

    it('returns accountFound false for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: 'nobody.here.999@nowhere.org' });

      expect(res.status).toBe(200);
      expect(res.body.data.accountFound).toBe(false);
    });

    it('generates two distinct recovery options for registered Doctor email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.recoverySessionId).toBeDefined();

      const options = res.body.data.options;
      expect(options).toHaveLength(2);

      const regOpt = options.find((o) => o.id === 'registered_email');
      expect(regOpt).toBeDefined();
      expect(regOpt.label).toContain('registered email');
      expect(regOpt.maskedDestination).toMatch(/^d\*{4,}[^@]*@hospital\.com$/);

      const hospOpt = options.find((o) => o.id === 'hospital_email');
      expect(hospOpt).toBeDefined();
      expect(hospOpt.label).toContain('Hospital Email');
      expect(hospOpt.available).toBe(true);
      expect(hospOpt.maskedDestination).toContain('@');
    });

    it('handles email case-insensitively', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail.toUpperCase() });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.recoverySessionId).toBeDefined();
    });

    it('returns generic response for unregistered email without leaking non-existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: 'nonexistent.staff.999@randomhospital.org' });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.recoverySessionId).toBeDefined();
      // accountFound must be false so the frontend stays on step 1
      expect(res.body.data.accountFound).toBe(false);
      expect(res.body.data.options).toHaveLength(2);
    });

    it('rejects invalid email formats', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  /* --------------------------------------------------------------------------
     2. OPTION A: REGISTERED EMAIL RECOVERY
  -------------------------------------------------------------------------- */
  describe('Phase 2: Option A - Registered Email Password Reset Flow', () => {
    let sessionId;
    const testOtp = '112233';
    const newDocPassword = 'NewDocPassword@2026';

    it('dispatches OTP to registered email', async () => {
      const initRes = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail });

      sessionId = initRes.body.data.recoverySessionId;

      const sendRes = await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({
          recoverySessionId: sessionId,
          method: 'registered_email'
        });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.data.deliveryMethod).toBe('registered_email');
      expect(sendRes.body.data.maskedRecipient).toContain('@hospital.com');

      // Update the OTP hash in DB with our deterministic testOtp
      const hashedOtp = await bcrypt.hash(testOtp, 10);
      await query(
        `UPDATE password_reset_otps SET otp_hash = $1 WHERE session_id = $2`,
        [hashedOtp, sessionId]
      );
    });

    it('rejects verification with incorrect OTP', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/verify-otp')
        .send({
          recoverySessionId: sessionId,
          otp: '999999'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid verification code');
    });

    it('verifies valid OTP and issues single-use reset token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/verify-otp')
        .send({
          recoverySessionId: sessionId,
          otp: testOtp
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();

      const resetToken = res.body.data.resetToken;

      // Reset password with token
      const resetRes = await request(app)
        .post('/api/auth/forgot-password/reset-password')
        .send({
          recoverySessionId: sessionId,
          resetToken,
          newPassword: newDocPassword,
          confirmPassword: newDocPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.data.success).toBe(true);
      expect(resetRes.body.data.username).toBe(testDoctorUsername);

      // Verify that old password fails
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorUsername, password: initialDoctorPass });
      expect(oldLogin.status).toBe(401);

      // Verify that new password succeeds with username login
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: testDoctorUsername, password: newDocPassword });
      expect(newLogin.status).toBe(200);
    });

    it('prevents replay attack with consumed reset token', async () => {
      const replayRes = await request(app)
        .post('/api/auth/forgot-password/reset-password')
        .send({
          recoverySessionId: sessionId,
          resetToken: 'someTokenReplayAttempt',
          newPassword: 'AnotherPassword@2026',
          confirmPassword: 'AnotherPassword@2026'
        });

      expect(replayRes.status).toBe(400);
    });
  });

  /* --------------------------------------------------------------------------
     3. OPTION B: HOSPITAL FALLBACK EMAIL RECOVERY
  -------------------------------------------------------------------------- */
  describe('Phase 3: Option B - Hospital Email Password Reset Flow (Receptionist)', () => {
    let sessionId;
    const testOtp = '445566';
    const newRecPassword = 'NewRecPassword@2026';

    it('dispatches OTP to hospital fallback email and resets receptionist password', async () => {
      const initRes = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testRecEmail });

      sessionId = initRes.body.data.recoverySessionId;

      const sendRes = await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({
          recoverySessionId: sessionId,
          method: 'hospital_email'
        });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.data.deliveryMethod).toBe('hospital_email');

      // Update OTP hash in DB for test
      const hashedOtp = await bcrypt.hash(testOtp, 10);
      await query(
        `UPDATE password_reset_otps SET otp_hash = $1 WHERE session_id = $2`,
        [hashedOtp, sessionId]
      );

      // Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/forgot-password/verify-otp')
        .send({
          recoverySessionId: sessionId,
          otp: testOtp
        });

      expect(verifyRes.status).toBe(200);
      const resetToken = verifyRes.body.data.resetToken;

      // Reset password
      const resetRes = await request(app)
        .post('/api/auth/forgot-password/reset-password')
        .send({
          recoverySessionId: sessionId,
          resetToken,
          newPassword: newRecPassword,
          confirmPassword: newRecPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.data.username).toBe(testRecUsername);

      // Login succeeds with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: testRecUsername, password: newRecPassword });
      expect(loginRes.status).toBe(200);
    });
  });

  /* --------------------------------------------------------------------------
     4. ATTEMPT LIMITS & SECURITY CONTROLS
  -------------------------------------------------------------------------- */
  describe('Phase 4: Security Protections & Attempt Limits', () => {
    it('invalidates the session after 5 failed OTP verification attempts', async () => {
      const initRes = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail });

      const sessionId = initRes.body.data.recoverySessionId;

      await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({
          recoverySessionId: sessionId,
          method: 'registered_email'
        });

      // Submit 5 wrong attempts
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/auth/forgot-password/verify-otp')
          .send({ recoverySessionId: sessionId, otp: '000000' });
        expect(res.status).toBe(400);
      }

      // 5th attempt exhausts limit
      const fifthRes = await request(app)
        .post('/api/auth/forgot-password/verify-otp')
        .send({ recoverySessionId: sessionId, otp: '000000' });
      expect(fifthRes.status).toBe(400);
      expect(fifthRes.body.error.message).toMatch(/Maximum verification attempts exceeded|Invalid verification code/);

      // Subsequent attempt even with correct OTP is rejected
      const sixthRes = await request(app)
        .post('/api/auth/forgot-password/verify-otp')
        .send({ recoverySessionId: sessionId, otp: '123456' });
      expect(sixthRes.status).toBe(400);
    });

    it('enforces rate limiting when requesting successive OTP dispatches too quickly', async () => {
      const initRes = await request(app)
        .post('/api/auth/forgot-password/initiate')
        .send({ email: testDoctorEmail });

      const sessionId = initRes.body.data.recoverySessionId;

      const firstSend = await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({ recoverySessionId: sessionId, method: 'registered_email' });
      expect(firstSend.status).toBe(200);

      // Immediate second send should be blocked by 30s cooldown
      const secondSend = await request(app)
        .post('/api/auth/forgot-password/send-otp')
        .send({ recoverySessionId: sessionId, method: 'registered_email' });
      expect(secondSend.status).toBe(429);
      expect(secondSend.body.error.message).toContain('Please wait a moment');
    });
  });

  /* --------------------------------------------------------------------------
     5. HOSPITAL RECOVERY EMAIL VERIFICATION & UPDATE
  -------------------------------------------------------------------------- */
  describe('Phase 5: Hospital Recovery Email Settings Verification', () => {
    const newHospitalEmail = `verified.inbox.${Date.now()}@hospital.org`;
    const emailOtp = '987123';

    it('forbids non-admin users from requesting recovery email update', async () => {
      const res = await request(app)
        .post('/api/hospital-settings/recovery-email/request')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ email: newHospitalEmail });

      expect(res.status).toBe(403);
    });

    it('initiates recovery email update with pending verification details', async () => {
      const res = await request(app)
        .post('/api/hospital-settings/recovery-email/request')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: newHospitalEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.pendingEmail).toBe(newHospitalEmail);

      // Check that active email is STILL unchanged in database
      const settings = await query('SELECT email, pending_email FROM hospital_settings LIMIT 1');
      expect(settings.rows[0].email).not.toBe(newHospitalEmail);
      expect(settings.rows[0].pending_email).toBe(newHospitalEmail);
    });

    it('rejects incorrect OTP for hospital email update', async () => {
      const res = await request(app)
        .post('/api/hospital-settings/recovery-email/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid verification code');
    });

    it('activates new hospital recovery email upon correct OTP verification', async () => {
      // Set test OTP hash in DB
      const hash = await bcrypt.hash(emailOtp, 10);
      await query(
        `UPDATE hospital_settings
         SET email_verification_otp_hash = $1,
             email_verification_expires_at = now() + interval '10 minutes'`,
        [hash]
      );

      const res = await request(app)
        .post('/api/hospital-settings/recovery-email/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ otp: emailOtp });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.email).toBe(newHospitalEmail);

      // Verify that database row has been updated
      const settings = await query('SELECT email, pending_email, is_email_verified FROM hospital_settings LIMIT 1');
      expect(settings.rows[0].email).toBe(newHospitalEmail);
      expect(settings.rows[0].pending_email).toBeNull();
      expect(settings.rows[0].is_email_verified).toBe(true);
    });
  });
});
