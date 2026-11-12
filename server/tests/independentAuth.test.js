import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, loginAsAdmin } from './helpers.js';
import { query } from '../src/config/db.js';

describe('Independent Username & Email Management with Safe Account Deletion and Reuse', () => {
  let adminToken;
  const ts = Date.now();

  const doctor1Email = `doctor1_${ts}@roh-hospital.com`;
  const doctor1Username = `doc_unique_${ts}`;
  const rec1Email = `rec1_${ts}@roh-hospital.com`;
  const rec1Username = `rec_unique_${ts}`;
  const defaultPass = 'SecurePass@123';

  let doctor1Id;
  let doctor1UserId;
  let rec1Id;
  let rec1UserId;
  let newDoctorUsername;
  let newRecUsername;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  /* ==========================================================================
     PHASE 9: REGISTRATION TESTS (1 - 10)
  ========================================================================== */
  describe('Registration Tests', () => {
    it('1. Register a Doctor with a new username and new email — success', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Test One',
          username: doctor1Username,
          email: doctor1Email,
          phone: '9876543211',
          specialization: 'Joint Replacement',
          experienceYears: 8,
          availabilityNote: '09:00 AM – 02:00 PM',
          status: 'Active',
          password: defaultPass
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(doctor1Username);
      expect(res.body.data.email).toBe(doctor1Email);

      doctor1Id = res.body.data.id;

      const { rows } = await query('SELECT user_id FROM doctors WHERE id = $1', [doctor1Id]);
      doctor1UserId = rows[0].user_id;
      expect(doctor1UserId).toBeDefined();
    });

    it('2. Register a Receptionist with a new username and new email — success', async () => {
      const res = await request(app)
        .post('/api/receptionists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Receptionist Test One',
          username: rec1Username,
          email: rec1Email,
          phone: '9876543212',
          shift: '08:00 AM – 04:00 PM',
          status: 'Active',
          password: defaultPass
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(rec1Username);
      expect(res.body.data.email).toBe(rec1Email);

      rec1Id = res.body.data.id;

      const { rows } = await query('SELECT user_id FROM receptionists WHERE id = $1', [rec1Id]);
      rec1UserId = rows[0].user_id;
      expect(rec1UserId).toBeDefined();
    });

    it('3. Register another account with an existing active Doctor email — rejected', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Duplicate Email',
          username: `doc_new_${Date.now()}`,
          email: doctor1Email,
          phone: '9876543213',
          specialization: 'Orthopedics',
          password: defaultPass
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Email is already registered/i);
    });

    it('4. Register another account with an existing inactive Doctor email — rejected', async () => {
      // Create an inactive doctor
      const inactiveEmail = `inactive_doc_${Date.now()}@roh-hospital.com`;
      const inactiveUser = `inactive_doc_${Date.now()}`;
      const createRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Inactive Test',
          username: inactiveUser,
          email: inactiveEmail,
          phone: '9876543214',
          specialization: 'Trauma',
          status: 'Inactive',
          password: defaultPass
        });
      expect(createRes.status).toBe(201);

      // Attempt registering with the inactive doctor's email
      const dupRes = await request(app)
        .post('/api/receptionists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rec Using Inactive Doctor Email',
          username: `rec_attempt_${Date.now()}`,
          email: inactiveEmail,
          phone: '9876543215',
          password: defaultPass
        });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.error.message).toMatch(/Email is already registered/i);
    });

    it('5. Register another account with an existing active Receptionist email — rejected', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Attempt Rec Email',
          username: `doc_attempt_${Date.now()}`,
          email: rec1Email,
          phone: '9876543216',
          specialization: 'Spine',
          password: defaultPass
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Email is already registered/i);
    });

    it('6. Register another account with an existing inactive Receptionist email — rejected', async () => {
      // Create an inactive receptionist
      const inactiveRecEmail = `inactive_rec_${Date.now()}@roh-hospital.com`;
      const inactiveRecUser = `inactive_rec_${Date.now()}`;
      const createRes = await request(app)
        .post('/api/receptionists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rec Inactive Test',
          username: inactiveRecUser,
          email: inactiveRecEmail,
          phone: '9876543217',
          status: 'Inactive',
          password: defaultPass
        });
      expect(createRes.status).toBe(201);

      // Attempt registering with the inactive receptionist's email
      const dupRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Doc Attempt Inactive Rec Email',
          username: `doc_attempt_rec_${Date.now()}`,
          email: inactiveRecEmail,
          phone: '9876543218',
          specialization: 'General',
          password: defaultPass
        });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.error.message).toMatch(/Email is already registered/i);
    });

    it('7. Register using a genuinely deleted Doctor email — success', async () => {
      const deleteDocEmail = `to_delete_doc_${Date.now()}@roh-hospital.com`;
      const deleteDocUser = `to_delete_doc_${Date.now()}`;

      // 1. Create doctor
      const createRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. To Delete',
          username: deleteDocUser,
          email: deleteDocEmail,
          phone: '9876543219',
          specialization: 'Pediatrics',
          password: defaultPass
        });
      expect(createRes.status).toBe(201);
      const toDeleteId = createRes.body.data.id;

      // 2. Soft-delete doctor
      const delRes = await request(app)
        .delete(`/api/doctors/${toDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(200);

      // 3. Register a new account reusing the deleted email and username
      const reuseRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Reused Account',
          username: deleteDocUser, // Reusing deleted username
          email: deleteDocEmail,   // Reusing deleted email
          phone: '9876543220',
          specialization: 'Sports Medicine',
          password: defaultPass
        });

      expect(reuseRes.status).toBe(201);
      expect(reuseRes.body.data.email).toBe(deleteDocEmail.toLowerCase());
      expect(reuseRes.body.data.username).toBe(deleteDocUser);
    });

    it('8. Register using a genuinely deleted Receptionist email — success', async () => {
      const deleteRecEmail = `to_delete_rec_${Date.now()}@roh-hospital.com`;
      const deleteRecUser = `to_delete_rec_${Date.now()}`;

      // 1. Create receptionist
      const createRes = await request(app)
        .post('/api/receptionists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rec To Delete',
          username: deleteRecUser,
          email: deleteRecEmail,
          phone: '9876543221',
          password: defaultPass
        });
      expect(createRes.status).toBe(201);
      const toDeleteRecId = createRes.body.data.id;

      // 2. Soft-delete receptionist
      const delRes = await request(app)
        .delete(`/api/receptionists/${toDeleteRecId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(200);

      // 3. Register a new account reusing the deleted receptionist email
      const reuseRes = await request(app)
        .post('/api/receptionists')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rec Reused Account',
          username: deleteRecUser,
          email: deleteRecEmail,
          phone: '9876543222',
          password: defaultPass
        });

      expect(reuseRes.status).toBe(201);
      expect(reuseRes.body.data.email).toBe(deleteRecEmail.toLowerCase());
    });

    it('9. Register using an existing username — rejected', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Duplicate Username Test',
          username: doctor1Username, // Already registered
          email: `brand_new_email_${Date.now()}@roh-hospital.com`,
          phone: '9876543223',
          specialization: 'Orthopedics',
          password: defaultPass
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Username is already taken/i);
    });

    it('10. Test duplicate checks with different email and username letter casing', async () => {
      // Uppercase variant of existing username
      const upperUserRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Casing Test User',
          username: doctor1Username.toUpperCase(),
          email: `case_test_${Date.now()}@roh-hospital.com`,
          phone: '9876543224',
          specialization: 'Orthopedics',
          password: defaultPass
        });
      expect(upperUserRes.status).toBe(400);
      expect(upperUserRes.body.error.message).toMatch(/Username is already taken/i);

      // Uppercase variant of existing email
      const upperEmailRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Casing Test Email',
          username: `casing_user_${Date.now()}`,
          email: doctor1Email.toUpperCase(),
          phone: '9876543225',
          specialization: 'Orthopedics',
          password: defaultPass
        });
      expect(upperEmailRes.status).toBe(400);
      expect(upperEmailRes.body.error.message).toMatch(/Email is already registered/i);
    });
  });

  /* ==========================================================================
     PHASE 9: LOGIN TESTS (11 - 15)
  ========================================================================== */
  describe('Login Tests', () => {
    it('11. Doctor login using username and password — success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: doctor1Username,
          password: defaultPass
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('Doctor');
      expect(res.body.data.user.username).toBe(doctor1Username);
      expect(res.body.data.token).toBeDefined();
    });

    it('12. Receptionist login using username and password — success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: rec1Username,
          password: defaultPass
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('Receptionist');
      expect(res.body.data.user.username).toBe(rec1Username);
      expect(res.body.data.token).toBeDefined();
    });

    it('13. Login using email instead of username — must not authenticate as an email-based login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: doctor1Email, // Attempt email as username
          password: defaultPass
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Invalid username or password/i);
    });

    it('14. Existing Admin login must continue working', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('Admin');
      expect(res.body.data.user.username).toBe('admin');
      expect(res.body.data.token).toBeDefined();
    });

    it('15. Inactive and deleted account authentication must follow existing security rules', async () => {
      // Inactive account: create inactive doctor
      const inactDocUser = `inact_sec_${Date.now()}`;
      const inactDocRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Inactive Sec',
          username: inactDocUser,
          email: `inact_sec_${Date.now()}@roh.com`,
          phone: '9876543226',
          specialization: 'Oncology',
          status: 'Inactive',
          password: defaultPass
        });
      expect(inactDocRes.status).toBe(201);

      const inactLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: inactDocUser, password: defaultPass });
      expect(inactLogin.status).toBe(403);
      expect(inactLogin.body.error.message).toMatch(/This account has been deactivated/i);

      // Deleted account: delete the doctor
      await request(app)
        .delete(`/api/doctors/${inactDocRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const deletedLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: inactDocUser, password: defaultPass });
      expect(deletedLogin.status).toBe(401); // Excluded by deleted_at IS NULL
    });
  });

  /* ==========================================================================
     PHASE 9: EDITING TESTS (16 - 23)
  ========================================================================== */
  describe('Editing Tests', () => {
    it('16. Admin changes a Doctor username — new username works', async () => {
      newDoctorUsername = `dr_renamed_${Date.now()}`;

      const res = await request(app)
        .put(`/api/doctors/${doctor1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Test One Renamed',
          username: newDoctorUsername,
          email: doctor1Email,
          phone: '9876543211',
          specialization: 'Joint Replacement',
          password: '' // Keep password unchanged
        });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(newDoctorUsername);

      // Old username fails login
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: doctor1Username, password: defaultPass });
      expect(oldLogin.status).toBe(401);

      // New username succeeds login
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: newDoctorUsername, password: defaultPass });
      expect(newLogin.status).toBe(200);
    });

    it('17. Admin changes a Receptionist username — new username works', async () => {
      newRecUsername = `rec_renamed_${Date.now()}`;

      const res = await request(app)
        .put(`/api/receptionists/${rec1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Receptionist Renamed',
          username: newRecUsername,
          email: rec1Email,
          phone: '9876543212',
          shift: '08:00 AM – 04:00 PM',
          password: ''
        });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(newRecUsername);

      // Old username fails login
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: rec1Username, password: defaultPass });
      expect(oldLogin.status).toBe(401);

      // New username succeeds login
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: newRecUsername, password: defaultPass });
      expect(newLogin.status).toBe(200);
    });

    it('18. Doctor changes their own username — new username works', async () => {
      // 1. Login as doctor to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: newDoctorUsername, password: defaultPass });
      const doctorToken = loginRes.body.data.token;

      // 2. Doctor updates own username via PATCH /api/auth/profile
      const selfUpdatedUser = `dr_self_${Date.now()}`;
      const patchRes = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Dr. Self Updated',
          username: selfUpdatedUser
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.username).toBe(selfUpdatedUser);

      // Verify login with self-updated username
      const selfLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: selfUpdatedUser, password: defaultPass });
      expect(selfLogin.status).toBe(200);

      newDoctorUsername = selfUpdatedUser;
    });

    it('19. Email changes without username changes', async () => {
      const newEmail = `updated_email_${Date.now()}@roh-hospital.com`;

      const res = await request(app)
        .put(`/api/doctors/${doctor1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Email Updated',
          username: newDoctorUsername, // Kept identical
          email: newEmail,             // Updated
          phone: '9876543211',
          specialization: 'Joint Replacement',
          password: ''
        });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(newEmail.toLowerCase());
      expect(res.body.data.username).toBe(newDoctorUsername);

      // Username login continues working
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: newDoctorUsername, password: defaultPass });
      expect(loginRes.status).toBe(200);
    });

    it('20. Changing username does not change the password', async () => {
      const anotherUsername = `dr_pwd_check_${Date.now()}`;

      await request(app)
        .put(`/api/doctors/${doctor1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Password Check',
          username: anotherUsername,
          password: '' // empty: keep existing
        });

      // Verify original password still authenticates
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: anotherUsername, password: defaultPass });
      expect(loginRes.status).toBe(200);

      newDoctorUsername = anotherUsername;
    });

    it('21. Changing email does not change the password', async () => {
      const anotherEmail = `email_pwd_check_${Date.now()}@roh.com`;

      await request(app)
        .put(`/api/doctors/${doctor1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Password Check',
          username: newDoctorUsername,
          email: anotherEmail,
          password: ''
        });

      // Verify original password still authenticates
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: newDoctorUsername, password: defaultPass });
      expect(loginRes.status).toBe(200);
    });

    it('22. Duplicate username and email updates are rejected', async () => {
      // Create a second doctor
      const secondDocUser = `doc_second_${Date.now()}`;
      const secondDocEmail = `doc_second_${Date.now()}@roh.com`;
      const createRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Second',
          username: secondDocUser,
          email: secondDocEmail,
          phone: '9876543230',
          specialization: 'Trauma',
          password: defaultPass
        });
      expect(createRes.status).toBe(201);
      const secondDocId = createRes.body.data.id;

      // Attempt updating second doctor to use doctor 1's username
      const dupUserRes = await request(app)
        .put(`/api/doctors/${secondDocId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: newDoctorUsername // Already taken by doctor 1
        });
      expect(dupUserRes.status).toBe(400);
      expect(dupUserRes.body.error.message).toMatch(/Username is already taken/i);

      // Attempt updating second doctor to use receptionist 1's email
      const dupEmailRes = await request(app)
        .put(`/api/doctors/${secondDocId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: rec1Email // Already taken by receptionist 1
        });
      expect(dupEmailRes.status).toBe(400);
      expect(dupEmailRes.body.error.message).toMatch(/Email is already registered/i);
    });

    it('23. Existing account IDs and historical relationships remain unchanged', async () => {
      const { rows: docRows } = await query('SELECT user_id FROM doctors WHERE id = $1', [doctor1Id]);
      expect(docRows[0].user_id).toBe(doctor1UserId); // user_id is immutable across updates

      const { rows: recRows } = await query('SELECT user_id FROM receptionists WHERE id = $1', [rec1Id]);
      expect(recRows[0].user_id).toBe(rec1UserId);
    });
  });

  /* ==========================================================================
     PHASE 9: PASSWORD RECOVERY TESTS (24 - 26)
  ========================================================================== */
  describe('Password Recovery Tests', () => {
    it('24. OTP recovery works with the updated username/email mapping', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('recovery email');

      // Check OTP record created
      const { rows } = await query(
        `SELECT otp_hash FROM password_reset_otps
         WHERE user_id = (SELECT id FROM users WHERE username = 'admin')
         ORDER BY created_at DESC LIMIT 1`
      );
      expect(rows.length).toBe(1);
    });

    it('25. Password reset updates the correct account', async () => {
      const bcrypt = await import('bcryptjs');
      const testOtp = '888999';
      const testOtpHash = await bcrypt.default.hash(testOtp, 10);

      const currentRecUsername = newRecUsername || rec1Username;
      const { rows: userRows } = await query('SELECT id FROM users WHERE username = $1', [currentRecUsername]);
      const userId = userRows[0].id;

      // Insert known test OTP
      await query('UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = $1', [userId]);
      await query(
        `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
         VALUES ($1, $2, now() + interval '5 minutes')`,
        [userId, testOtpHash]
      );

      // Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/forgot-password/verify')
        .send({ username: currentRecUsername, otp: testOtp });
      expect(verifyRes.status).toBe(200);
      const resetToken = verifyRes.body.data.resetToken;

      // Reset Password
      const brandNewPass = 'BrandNewRecPass@2026';
      const resetRes = await request(app)
        .post('/api/auth/forgot-password/reset')
        .send({
          username: currentRecUsername,
          resetToken,
          newPassword: brandNewPass,
          confirmPassword: brandNewPass
        });
      expect(resetRes.status).toBe(200);

      // Verify new password logs in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: currentRecUsername, password: brandNewPass });
      expect(loginRes.status).toBe(200);

      // Verify other accounts (like admin) were not affected
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'Admin@123' });
      expect(adminLogin.status).toBe(200);
    });

    it('26. Existing Admin, Doctor and Receptionist password recovery continues working', async () => {
      // Admin request
      const adminReq = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: 'admin' });
      expect(adminReq.status).toBe(200);

      // Doctor request
      const docReq = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: 'krishna' });
      expect(docReq.status).toBe(200);

      // Receptionist request
      const recReq = await request(app)
        .post('/api/auth/forgot-password/request')
        .send({ username: 'Rukmini' });
      expect(recReq.status).toBe(200);
    });
  });
});
