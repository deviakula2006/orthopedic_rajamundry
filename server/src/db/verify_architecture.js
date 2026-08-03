import { query } from '../config/db.js';

async function auditDatabase() {
  console.log('=========================================================');
  console.log('PHASE 1 & 2: ARCHITECTURE & DATABASE VALIDATION REPORT');
  console.log('=========================================================\n');

  // 1. Applied Migrations
  const { rows: migrations } = await query(`SELECT name, applied_at FROM schema_migrations ORDER BY id ASC;`);
  console.log('--- 1. APPLIED MIGRATIONS ---');
  migrations.forEach(m => console.log(`  ✓ ${m.name} (Applied at: ${m.applied_at})`));

  // 2. Public Tables
  const { rows: tables } = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    ORDER BY table_name;
  `);
  console.log('\n--- 2. PUBLIC SCHEMA TABLES ---');
  const tableNames = tables.map(t => t.table_name);
  console.log(tableNames.map(t => `  - ${t}`).join('\n'));

  // 3. Required Doctor Module Tables Validation
  const requiredTables = ['consultations', 'vitals', 'prescriptions', 'consultation_investigations'];
  const missingTables = requiredTables.filter(t => !tableNames.includes(t));
  console.log('\n--- 3. DOCTOR MODULE TABLES VALIDATION ---');
  if (missingTables.length === 0) {
    console.log('  ✓ ALL REQUIRED DOCTOR TABLES EXIST IN POSTGRESQL');
  } else {
    console.error('  ❌ MISSING TABLES:', missingTables);
  }

  // 4. Foreign Keys Validation
  const { rows: fkRows } = await query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('consultations', 'vitals', 'prescriptions', 'consultation_investigations')
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log('\n--- 4. DOCTOR MODULE FOREIGN KEYS ---');
  fkRows.forEach(fk => {
    console.log(`  ✓ ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });

  process.exit(0);
}

auditDatabase().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
