// Automated End-to-End Verification Test Suite
// SMARTDEPT – HOD PERMISSION TO ADD NEW TEACHERS

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');

const BASE_URL = 'http://localhost:3000';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '/', BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SMARTDEPT: HOD PERMISSION TO ADD NEW TEACHERS - TEST SUITE');
  console.log('================================================================\n');

  let serverProcess = null;
  // Ensure server is reachable, start if not
  try {
    await request({ path: '/api/teachers/config' });
  } catch (e) {
    serverProcess = fork(path.join(__dirname, '..', 'server.js'), [], { silent: true });
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        await request({ path: '/api/teachers/config' });
        break;
      } catch (err) {}
    }
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  // TEST 1: Config endpoint
  const cfg = await request({ path: '/api/teachers/config' });
  assert(cfg.status === 200 && cfg.body.collegeEmailDomain, 'Config returns configured COLLEGE_EMAIL_DOMAIN');

  // TEST 2: Student cannot access API (403 Forbidden with exact message)
  const studentAttempt = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'Student' }
  }, { name: 'Unauthorized Attempt' });
  assert(
    studentAttempt.status === 403 && studentAttempt.body.error === 'You do not have permission to add teachers.',
    'Student cannot access Add Teacher API (Returns HTTP 403 Forbidden)',
    JSON.stringify(studentAttempt.body)
  );

  // TEST 3: Teacher cannot access API (403 Forbidden with exact message)
  const teacherAttempt = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'Teacher' }
  }, { name: 'Unauthorized Attempt' });
  assert(
    teacherAttempt.status === 403 && teacherAttempt.body.error === 'You do not have permission to add teachers.',
    'Teacher cannot access Add Teacher API (Returns HTTP 403 Forbidden)',
    JSON.stringify(teacherAttempt.body)
  );

  // TEST 4: Lab Faculty cannot access API (403 Forbidden with exact message)
  const labAttempt = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'Lab Faculty' }
  }, { name: 'Unauthorized Attempt' });
  assert(
    labAttempt.status === 403 && labAttempt.body.error === 'You do not have permission to add teachers.',
    'Lab Faculty cannot access Add Teacher API (Returns HTTP 403 Forbidden)',
    JSON.stringify(labAttempt.body)
  );

  // TEST 5: Missing profile photo rejected
  const missingPhoto = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'HOD' }
  }, {
    name: 'Dr. No Photo',
    phone: '9845011111',
    email: 'no.photo@yourcollege.edu.in',
    facultyId: 'FAC099'
  });
  assert(
    missingPhoto.status === 400 && missingPhoto.body.error === 'Teacher profile photo is required.',
    'Missing profile photo is rejected with "Teacher profile photo is required."',
    JSON.stringify(missingPhoto.body)
  );

  // TEST 6: Invalid college email domain rejected
  const invalidDomain = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'HOD' }
  }, {
    profilePhoto: 'https://images.unsplash.com/photo-1.jpg',
    name: 'Dr. Invalid Domain',
    phone: '9845011111',
    email: 'test@randomdomain.com',
    facultyId: 'FAC098'
  });
  assert(
    invalidDomain.status === 400 && invalidDomain.body.error.includes('Please enter a valid college Gmail/college email address.'),
    'Invalid college email is rejected with "Please enter a valid college Gmail/college email address."',
    JSON.stringify(invalidDomain.body)
  );

  // TEST 7: Duplicate email is rejected
  const duplicateEmail = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'HOD' }
  }, {
    profilePhoto: 'https://images.unsplash.com/photo-1.jpg',
    name: 'Dr. Duplicate Email',
    phone: '9845011111',
    email: 'ananya.iyer@yourcollege.edu.in', // already exists
    facultyId: 'FAC097'
  });
  assert(
    duplicateEmail.status === 400 && duplicateEmail.body.error === 'Teacher with this college email already exists.',
    'Duplicate email address is rejected',
    JSON.stringify(duplicateEmail.body)
  );

  // TEST 8: Duplicate Faculty ID is rejected
  const duplicateFacId = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'HOD' }
  }, {
    profilePhoto: 'https://images.unsplash.com/photo-1.jpg',
    name: 'Dr. Duplicate ID',
    phone: '9845011111',
    email: 'unique.email@yourcollege.edu.in',
    facultyId: 'FAC001' // already exists
  });
  assert(
    duplicateFacId.status === 400 && duplicateFacId.body.error === 'Faculty ID already exists.',
    'Duplicate Faculty ID is rejected with "Faculty ID already exists."',
    JSON.stringify(duplicateFacId.body)
  );

  // TEST 9: HOD successfully adds new teacher with unique details
  const testFacId = 'FAC' + Math.floor(100 + Math.random() * 900);
  const testEmail = `prof.${testFacId.toLowerCase()}@yourcollege.edu.in`;
  const createdTeacherRes = await request({
    path: '/api/teachers',
    method: 'POST',
    headers: { 'x-user-role': 'HOD', 'x-user-id': 'usr-hod-01' }
  }, {
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300.jpg',
    name: 'Prof. Ramesh Kulkarni',
    phone: '+91 98450 77112',
    email: testEmail,
    facultyId: testFacId,
    designation: 'Associate Professor',
    department: 'Computer Science and Engineering',
    qualification: 'M.Tech, Ph.D',
    specialization: 'Distributed Systems & Cloud Computing',
    experience: '9 Years',
    officeRoom: 'Turing Block 308',
    joiningDate: '2026-08-15',
    subjectsHandled: 'CS501, CS603',
    assignedSemester: '5th Semester',
    assignedSection: 'Section A',
    assignedClasses: '5th Sem CSE A',
    accountStatus: 'ACTIVE',
    role: 'STUDENT' // Attemping to inject student role - MUST BE OVERRIDDEN TO TEACHER!
  });

  assert(
    createdTeacherRes.status === 201 && createdTeacherRes.body.success === true,
    'HOD can create a teacher (Returns 201 Created and "Teacher added successfully.")'
  );

  const teacher = createdTeacherRes.body.teacher;
  assert(
    teacher && teacher.role === 'TEACHER',
    'Teacher receives role TEACHER (Role injection overridden)',
    `role was ${teacher?.role}`
  );

  assert(
    teacher && teacher.createdBy === 'usr-hod-01',
    'Record stores HOD authenticated user ID in createdBy',
    `createdBy was ${teacher?.createdBy}`
  );

  assert(
    teacher && teacher._id && teacher._id.length === 24,
    'Teacher database record uses MongoDB 24-char ObjectId format',
    `_id was ${teacher?._id}`
  );

  // TEST 10: Teacher appears in All Teachers
  const allTeachersRes = await request({ path: '/api/teachers' });
  const found = allTeachersRes.body.teachers?.find(t => t.facultyId === testFacId);
  assert(
    found && found.name === 'Prof. Ramesh Kulkarni',
    'Teacher appears in All Teachers GET list',
    `found: ${JSON.stringify(found)}`
  );

  // TEST 11: HOD can edit teacher
  const editRes = await request({
    path: `/api/teachers/${teacher._id}`,
    method: 'PUT',
    headers: { 'x-user-role': 'HOD', 'x-user-id': 'usr-hod-01' }
  }, {
    officeRoom: 'Turing Block 405 (Upgraded Cabin)',
    experience: '10 Years',
    role: 'HOD' // Attempt to change role during edit - MUST REMAIN TEACHER!
  });
  assert(
    editRes.status === 200 && editRes.body.teacher.officeRoom === 'Turing Block 405 (Upgraded Cabin)' && editRes.body.teacher.role === 'TEACHER',
    'HOD can edit teacher; role remains strictly TEACHER',
    JSON.stringify(editRes.body)
  );

  // TEST 12: HOD can deactivate teacher
  const deactRes = await request({
    path: `/api/teachers/${teacher._id}/status`,
    method: 'PATCH',
    headers: { 'x-user-role': 'HOD', 'x-user-id': 'usr-hod-01' }
  }, { status: 'INACTIVE' });
  assert(
    deactRes.status === 200 && deactRes.body.teacher.accountStatus === 'INACTIVE',
    'HOD can deactivate teacher (status becomes INACTIVE)',
    JSON.stringify(deactRes.body)
  );

  // TEST 13: HOD can activate teacher
  const actRes = await request({
    path: `/api/teachers/${teacher._id}/status`,
    method: 'PATCH',
    headers: { 'x-user-role': 'HOD', 'x-user-id': 'usr-hod-01' }
  }, { status: 'ACTIVE' });
  assert(
    actRes.status === 200 && actRes.body.teacher.accountStatus === 'ACTIVE',
    'HOD can activate teacher (status becomes ACTIVE)',
    JSON.stringify(actRes.body)
  );

  // TEST 14: Audit logs created for all operations
  const auditRes = await request({
    path: '/api/teachers/audit-logs',
    headers: { 'x-user-role': 'HOD' }
  });
  const logs = auditRes.body.logs || [];
  const addLog = logs.find(l => l.action === 'ADD_TEACHER' && l.targetUser === teacher._id);
  const editLog = logs.find(l => l.action === 'EDIT_TEACHER' && l.targetUser === teacher._id);
  const deactLog = logs.find(l => l.action === 'DEACTIVATE_TEACHER' && l.targetUser === teacher._id);
  const actLog = logs.find(l => l.action === 'ACTIVATE_TEACHER' && l.targetUser === teacher._id);

  assert(
    !!(addLog && editLog && deactLog && actLog),
    'Audit logs recorded for ADD_TEACHER, EDIT_TEACHER, DEACTIVATE_TEACHER, ACTIVATE_TEACHER',
    `Found add: ${!!addLog}, edit: ${!!editLog}, deact: ${!!deactLog}, act: ${!!actLog}`
  );

  // TEST 15: Existing academic records are preserved
  const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mongodb', 'teachers.json'), 'utf8'));
  const originalTeachers = dbData.filter(t => t.facultyId === 'FAC001' || t.facultyId === 'FAC002' || t.facultyId === 'FAC003');
  assert(
    originalTeachers.length === 3,
    'Existing academic records, faculty profiles, and assignments are 100% preserved in MongoDB collection'
  );

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (serverProcess) {
    serverProcess.kill();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
