// CampusConnect / SmartDept Database Seeder
// Seeds data only if the database needs initialization; does NOT duplicate seed data.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'mongodb');
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const HISTORY_FILE = path.join(DATA_DIR, 'semester_history.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function seed() {
  console.log('🌱 CampusConnect / SmartDept Database Seeder\n');

  // 1. Teachers Collection
  if (fs.existsSync(TEACHERS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(TEACHERS_FILE, 'utf8'));
    console.log(`ℹ️  Teachers collection already initialized (${existing.length} records found). Skipping to prevent duplicates.`);
  }

  // 2. Audit Logs Collection
  if (fs.existsSync(AUDIT_FILE)) {
    const existing = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    console.log(`ℹ️  Audit logs collection already initialized (${existing.length} records found). Skipping to prevent duplicates.`);
  }

  // 3. Students Collection (1st to 8th Semester)
  if (fs.existsSync(STUDENTS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf8'));
    console.log(`ℹ️  Students collection already initialized (${existing.length} records found across Semesters 1-8). Skipping to prevent duplicates.`);
  } else {
    require('./seed_students.js');
  }

  // 4. Semester History Collection
  if (fs.existsSync(HISTORY_FILE)) {
    const existing = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    console.log(`ℹ️  Semester History collection already initialized (${existing.length} historical records found). Skipping to prevent duplicates.`);
  }

  console.log('\n✨ Database seeding verification completed.');
}

seed();
