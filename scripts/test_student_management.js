// CampusConnect / SmartDept - Student Information Management Verification Suite
// Tests all 22 requirements from Section 33 against the live backend

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');

const PORT = 3000;
let passed = 0;
let failed = 0;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      ...options
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function hodHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-user-role': 'HOD',
    'x-user-id': 'usr-hod-01',
    'x-user-email': 'hod@mitt.ac.in',
    'Authorization': 'Bearer ' + Buffer.from(JSON.stringify({ role: 'HOD', id: 'usr-hod-01' })).toString('base64')
  };
}

function studentHeaders(id, email) {
  return {
    'Content-Type': 'application/json',
    'x-user-role': 'Student',
    'x-user-id': id,
    'x-user-email': email,
    'Authorization': 'Bearer ' + Buffer.from(JSON.stringify({ role: 'Student', id, email })).toString('base64')
  };
}

function teacherHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-user-role': 'Teacher',
    'x-user-id': 'usr-tch-01',
    'x-user-email': 'ananya.iyer@mitt.ac.in',
    'Authorization': 'Bearer ' + Buffer.from(JSON.stringify({ role: 'Teacher', id: 'usr-tch-01' })).toString('base64')
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SMARTDEPT 1st-8th SEMESTER STUDENT MANAGEMENT - 22 TEST SUITE');
  console.log('================================================================\n');

  let serverProcess = null;
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

  let testStudentId = null;
  let testStudentUsn = `4MN24CS999_${Date.now().toString().slice(-4)}`;
  let testStudentStdId = `STD-TEST-${Date.now().toString().slice(-4)}`;
  let testStudentEmail = `test.student.${Date.now().toString().slice(-4)}@mitt.ac.in`;

  // 1. HOD can view all students
  try {
    const res = await request({ path: '/api/students', method: 'GET', headers: hodHeaders() });
    if (res.status === 200 && Array.isArray(res.data.students) && res.data.students.length > 0) {
      console.log(`✅ Test 1 Passed: HOD can view all students (${res.data.students.length} found).`);
      passed++;
    } else {
      console.error(`❌ Test 1 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 1 Error:', e.message); failed++; }

  // 2-9. HOD can filter 1st through 8th semester
  for (let s = 1; s <= 8; s++) {
    try {
      const res = await request({ path: `/api/students?semester=${s}`, method: 'GET', headers: hodHeaders() });
      const valid = res.status === 200 && Array.isArray(res.data.students) && res.data.students.every(std => std.semester === s);
      if (valid) {
        console.log(`✅ Test ${s + 1} Passed: HOD can filter Semester ${s} (${res.data.students.length} students).`);
        passed++;
      } else {
        console.error(`❌ Test ${s + 1} Failed: Semester ${s} filter mismatch`, res.data);
        failed++;
      }
    } catch (e) { console.error(`❌ Test ${s + 1} Error:`, e.message); failed++; }
  }

  // 10. HOD can add student
  try {
    const newStudentPayload = {
      profilePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      name: 'RAKESH K SHETTY',
      gender: 'Male',
      dateOfBirth: '2004-06-20',
      phone: '+91 9988776655',
      personalEmail: 'rakesh.shetty@gmail.com',
      collegeEmail: testStudentEmail,
      bloodGroup: 'B+',
      address: 'Near Ring Road, Kuvempunagar',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570023',
      usn: testStudentUsn,
      studentId: testStudentStdId,
      admissionNumber: 'ADM-2024-999',
      department: 'Computer Science and Engineering',
      semester: 1,
      section: 'A',
      batch: '2024-2028',
      admissionYear: 2024,
      academicYear: '2024-2025',
      status: 'ACTIVE',
      guardian: {
        name: 'Kumaraswamy Shetty',
        relationship: 'Father',
        phone: '+91 9988776600',
        email: 'kumaraswamy@gmail.com',
        occupation: 'Civil Engineer'
      }
    };

    const res = await request({ path: '/api/students', method: 'POST', headers: hodHeaders() }, newStudentPayload);
    if (res.status === 201 && res.data.success && res.data.student) {
      testStudentId = res.data.student._id;
      console.log(`✅ Test 10 Passed: HOD can add student (${res.data.student.name}, USN: ${res.data.student.usn}).`);
      passed++;
    } else {
      console.error(`❌ Test 10 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 10 Error:', e.message); failed++; }

  // 11. HOD can edit student
  try {
    const editPayload = {
      name: 'RAKESH KUMAR SHETTY',
      phone: '+91 9988776644',
      section: 'B'
    };
    const res = await request({ path: `/api/students/${testStudentId}`, method: 'PUT', headers: hodHeaders() }, editPayload);
    if (res.status === 200 && res.data.success && res.data.student.name === 'RAKESH KUMAR SHETTY' && res.data.student.section === 'B') {
      console.log(`✅ Test 11 Passed: HOD can edit student information.`);
      passed++;
    } else {
      console.error(`❌ Test 11 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 11 Error:', e.message); failed++; }

  // 12. HOD can promote student
  try {
    const res = await request({ path: `/api/students/${testStudentId}/semester`, method: 'PATCH', headers: hodHeaders() }, { semester: 2 });
    if (res.status === 200 && res.data.success && res.data.student.semester === 2) {
      console.log(`✅ Test 12 Passed: HOD can promote student (Semester 1 -> 2).`);
      passed++;
    } else {
      console.error(`❌ Test 12 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 12 Error:', e.message); failed++; }

  // 13. Previous semester history remains intact
  try {
    const res = await request({ path: `/api/students/${testStudentId}/academic-history`, method: 'GET', headers: hodHeaders() });
    const hasSem1 = res.status === 200 && Array.isArray(res.data.academicHistory) && res.data.academicHistory.some(h => h.semester === 1);
    if (hasSem1) {
      console.log(`✅ Test 13 Passed: Previous semester history remains intact after promotion (${res.data.academicHistory.length} semester record(s) verified).`);
      passed++;
    } else {
      console.error(`❌ Test 13 Failed: Previous semester history missing`, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 13 Error:', e.message); failed++; }

  // 14. HOD can activate/deactivate student
  try {
    const deactRes = await request({ path: `/api/students/${testStudentId}/status`, method: 'PATCH', headers: hodHeaders() }, { status: 'INACTIVE' });
    const actRes = await request({ path: `/api/students/${testStudentId}/status`, method: 'PATCH', headers: hodHeaders() }, { status: 'ACTIVE' });
    if (deactRes.status === 200 && deactRes.data.student.status === 'INACTIVE' && actRes.status === 200 && actRes.data.student.status === 'ACTIVE') {
      console.log(`✅ Test 14 Passed: HOD can activate and deactivate student.`);
      passed++;
    } else {
      console.error(`❌ Test 14 Failed:`, deactRes.data, actRes.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 14 Error:', e.message); failed++; }

  // 15. Duplicate USN is rejected
  try {
    const dupUsnPayload = {
      profilePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      name: 'DUPLICATE USN TEST',
      usn: testStudentUsn, // duplicate!
      studentId: 'STD-DIFF-999',
      collegeEmail: 'diff.email@mitt.ac.in',
      department: 'Computer Science and Engineering',
      semester: 1,
      section: 'A',
      batch: '2024-2028'
    };
    const res = await request({ path: '/api/students', method: 'POST', headers: hodHeaders() }, dupUsnPayload);
    if (res.status === 409 && res.data.error === 'USN already exists.') {
      console.log(`✅ Test 15 Passed: Duplicate USN rejected with "USN already exists."`);
      passed++;
    } else {
      console.error(`❌ Test 15 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 15 Error:', e.message); failed++; }

  // 16. Duplicate Student ID is rejected
  try {
    const dupIdPayload = {
      profilePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      name: 'DUPLICATE ID TEST',
      usn: '4MN24CS888',
      studentId: testStudentStdId, // duplicate!
      collegeEmail: 'diff2.email@mitt.ac.in',
      department: 'Computer Science and Engineering',
      semester: 1,
      section: 'A',
      batch: '2024-2028'
    };
    const res = await request({ path: '/api/students', method: 'POST', headers: hodHeaders() }, dupIdPayload);
    if (res.status === 409 && res.data.error === 'Student ID already exists.') {
      console.log(`✅ Test 16 Passed: Duplicate Student ID rejected with "Student ID already exists."`);
      passed++;
    } else {
      console.error(`❌ Test 16 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 16 Error:', e.message); failed++; }

  // 17. Duplicate email is rejected
  try {
    const dupEmailPayload = {
      profilePhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      name: 'DUPLICATE EMAIL TEST',
      usn: '4MN24CS777',
      studentId: 'STD-DIFF-777',
      collegeEmail: testStudentEmail, // duplicate!
      department: 'Computer Science and Engineering',
      semester: 1,
      section: 'A',
      batch: '2024-2028'
    };
    const res = await request({ path: '/api/students', method: 'POST', headers: hodHeaders() }, dupEmailPayload);
    if (res.status === 409 && res.data.error === 'College email already exists.') {
      console.log(`✅ Test 17 Passed: Duplicate email rejected with "College email already exists."`);
      passed++;
    } else {
      console.error(`❌ Test 17 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 17 Error:', e.message); failed++; }

  // 18. Student cannot edit official academic information
  try {
    const res = await request({ path: `/api/students/${testStudentId}`, method: 'PUT', headers: studentHeaders(testStudentId, testStudentEmail) }, { semester: 8, usn: '4MN24CSHACK' });
    if (res.status === 403 && res.data.error === 'You do not have permission to manage students.') {
      console.log(`✅ Test 18 Passed: Student cannot edit official academic information (403 Forbidden).`);
      passed++;
    } else {
      console.error(`❌ Test 18 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 18 Error:', e.message); failed++; }

  // 19. Student cannot view another student's private data
  try {
    // Student A attempts to access Student B's profile
    const res = await request({ path: `/api/students/${testStudentId}`, method: 'GET', headers: studentHeaders('other-student-id', 'other@mitt.ac.in') });
    if (res.status === 403 && res.data.error && (res.data.error.includes('You can only access your own student record.') || res.data.error.includes('Students are only authorized to view their own profile.'))) {
      console.log(`✅ Test 19 Passed: Student cannot view another student's private data (403 Forbidden enforced: "${res.data.error}").`);
      passed++;
    } else {
      console.error(`❌ Test 19 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 19 Error:', e.message); failed++; }

  // 20. Teacher cannot access HOD student management
  try {
    const res = await request({ path: '/api/students/stats', method: 'GET', headers: teacherHeaders() });
    if (res.status === 403 && res.data.error === 'You do not have permission to manage students.') {
      console.log(`✅ Test 20 Passed: Teacher cannot access HOD student management (403 Forbidden).`);
      passed++;
    } else {
      console.error(`❌ Test 20 Failed:`, res.status, res.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 20 Error:', e.message); failed++; }

  // 21. Unauthorized API calls return 403
  try {
    const resNoAuth = await request({ path: '/api/students', method: 'POST', headers: { 'Content-Type': 'application/json' } }, {});
    if (resNoAuth.status === 403 && resNoAuth.data.error === 'You do not have permission to manage students.') {
      console.log(`✅ Test 21 Passed: Unauthorized API calls return 403 Forbidden.`);
      passed++;
    } else {
      console.error(`❌ Test 21 Failed:`, resNoAuth.status, resNoAuth.data);
      failed++;
    }
  } catch (e) { console.error('❌ Test 21 Error:', e.message); failed++; }

  // 22. Audit logs are created
  try {
    const auditLogsPath = path.join(__dirname, '..', 'data', 'mongodb', 'audit_logs.json');
    const logs = JSON.parse(fs.readFileSync(auditLogsPath, 'utf8'));
    const actions = logs.map(l => l.action);
    const hasCreate = actions.includes('CREATE_STUDENT');
    const hasEdit = actions.includes('EDIT_STUDENT');
    const hasPromote = actions.includes('PROMOTE_STUDENT');
    const hasStatus = actions.includes('ACTIVATE_STUDENT') || actions.includes('DEACTIVATE_STUDENT');

    if (hasCreate && hasEdit && hasPromote && hasStatus) {
      console.log(`✅ Test 22 Passed: Audit logs verified (CREATE_STUDENT, EDIT_STUDENT, PROMOTE_STUDENT, ACTIVATE/DEACTIVATE recorded).`);
      passed++;
    } else {
      console.error(`❌ Test 22 Failed: Missing some audit log types. Found:`, actions);
      failed++;
    }
  } catch (e) { console.error('❌ Test 22 Error:', e.message); failed++; }

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL 22 TESTS)`);
  console.log('================================================================');

  if (serverProcess) {
    serverProcess.kill();
  }

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
