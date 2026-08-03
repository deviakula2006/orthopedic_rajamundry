import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

async function resetToProduction() {
  console.log('=========================================================');
  console.log('PHASE 6: PRODUCTION ENVIRONMENT DATABASE RESET');
  console.log('=========================================================\n');

  // 1. Truncate all business/transactional tables
  console.log('Cleaning all business data tables...');
  await query(`
    TRUNCATE TABLE 
      activities,
      bill_items,
      bills,
      bed_admissions,
      consultation_investigations,
      prescriptions,
      vitals,
      consultations,
      appointments,
      patients,
      receptionists,
      doctors,
      users
    RESTART IDENTITY CASCADE;
  `);

  // 2. Reset identity sequences for generated codes if needed
  await query(`
    ALTER SEQUENCE IF EXISTS patient_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS doctor_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS receptionist_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS appointment_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS consultation_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS bill_code_seq RESTART WITH 1;
  `);

  // 3. Reset all bed statuses to 'Available'
  await query(`UPDATE beds SET status = 'Available'::bed_status;`);

  // 4. Ensure Admin role exists
  const { rows: roleRows } = await query(`SELECT id FROM roles WHERE name = 'Admin';`);
  if (roleRows.length === 0) {
    throw new Error('Admin role not found in database roles table');
  }
  const adminRoleId = roleRows[0].id;

  // 5. Create the single Admin account (username: admin, password: admin@123)
  const passwordHash = await bcrypt.hash('admin@123', env.BCRYPT_SALT_ROUNDS || 12);
  
  const { rows: adminRows } = await query(`
    INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING id, username, email, full_name;
  `, ['admin', 'admin@roh.com', passwordHash, 'System Administrator', adminRoleId]);

  const adminUser = adminRows[0];
  console.log('  ✓ Created single system Administrator account:');
  console.log(`    - Username: ${adminUser.username}`);
  console.log(`    - Email:    ${adminUser.email}`);
  console.log(`    - Password: admin@123`);

  // 6. Verify zero transactional records remain
  const { rows: userCount } = await query(`SELECT COUNT(*)::int FROM users;`);
  const { rows: docCount } = await query(`SELECT COUNT(*)::int FROM doctors;`);
  const { rows: recCount } = await query(`SELECT COUNT(*)::int FROM receptionists;`);
  const { rows: patCount } = await query(`SELECT COUNT(*)::int FROM patients;`);
  const { rows: aptCount } = await query(`SELECT COUNT(*)::int FROM appointments;`);
  const { rows: consCount } = await query(`SELECT COUNT(*)::int FROM consultations;`);
  const { rows: vitalsCount } = await query(`SELECT COUNT(*)::int FROM vitals;`);
  const { rows: prescCount } = await query(`SELECT COUNT(*)::int FROM prescriptions;`);
  const { rows: ciCount } = await query(`SELECT COUNT(*)::int FROM consultation_investigations;`);
  const { rows: billsCount } = await query(`SELECT COUNT(*)::int FROM bills;`);
  const { rows: actCount } = await query(`SELECT COUNT(*)::int FROM activities;`);

  console.log('\n--- VERIFICATION OF PRODUCTION RESET RECORD COUNTS ---');
  console.log({
    users: userCount[0].count,
    doctors: docCount[0].count,
    receptionists: recCount[0].count,
    patients: patCount[0].count,
    appointments: aptCount[0].count,
    consultations: consCount[0].count,
    vitals: vitalsCount[0].count,
    prescriptions: prescCount[0].count,
    consultation_investigations: ciCount[0].count,
    bills: billsCount[0].count,
    activities: actCount[0].count
  });

  console.log('\n  ✓ DATABASE IS NOW 100% CLEAN AND READY FOR PRODUCTION TESTING.');
  process.exit(0);
}

resetToProduction().catch(err => {
  console.error('Production reset failed:', err);
  process.exit(1);
});
