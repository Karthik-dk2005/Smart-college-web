const http = require('http');
const assert = require('assert');
const {
  calculateHaversineDistance,
  validateAndRecordAttendance,
  readInstitutionConfig,
  readGeoAttendance
} = require('../src/server/geofenceValidator');

console.log('================================================================');
console.log('🧪 REAL-TIME GPS GEOFENCE ATTENDANCE TEST SUITE');
console.log('================================================================');

let passedTests = 0;
let failedTests = 0;

function pass(name) {
  passedTests++;
  console.log(`✅ PASS: ${name}`);
}

function fail(name, err) {
  failedTests++;
  console.error(`❌ FAIL: ${name}`, err);
}

// 1. Test Haversine formula calculation
try {
  // Thandavapura coordinates: 12.183700, 76.694200
  // Student standing ~10 meters away: 12.183790, 76.694200
  const distMeters = calculateHaversineDistance(12.183700, 76.694200, 12.183790, 76.694200);
  assert(distMeters > 9 && distMeters < 11, `Expected ~10m, got ${distMeters}`);
  pass('Haversine formula calculates distance accurately (~10.0m)');
} catch (e) {
  fail('Haversine formula calculation', e);
}

// 2. Test inside geofence verification
try {
  const config = readInstitutionConfig();
  const res = validateAndRecordAttendance({
    studentId: 'test-std-inside-' + Date.now(),
    studentName: 'Test Student Inside',
    usn: '1NT21CS999',
    latitude: config.latitude + 0.0001, // ~11 meters away
    longitude: config.longitude + 0.0001,
    accuracy: 15,
    clientTimestamp: new Date().toISOString()
  });

  assert.strictEqual(res.success, true, 'Should succeed');
  assert.strictEqual(res.record.status, 'PRESENT', 'Status should be PRESENT');
  assert(res.record.distance <= config.geofenceRadiusMeters, 'Distance must be within radius');
  assert(res.record.verificationHash.startsWith('GEO-VER-'), 'Should produce verification hash');
  pass('Student inside geofence with acceptable accuracy is marked PRESENT');
} catch (e) {
  fail('Inside geofence verification', e);
}

// 3. Test outside geofence verification
try {
  const res = validateAndRecordAttendance({
    studentId: 'test-std-outside-' + Date.now(),
    studentName: 'Test Student Outside',
    usn: '1NT21CS998',
    latitude: 12.3051, // Mysore Palace (~14km away)
    longitude: 76.6551,
    accuracy: 10,
    clientTimestamp: new Date().toISOString()
  });

  assert.strictEqual(res.success, false, 'Should fail');
  assert.strictEqual(res.code, 'OUTSIDE_ATTENDANCE_AREA', 'Code should be OUTSIDE_ATTENDANCE_AREA');
  assert.strictEqual(res.status, 'Outside Attendance Area', 'Status should be Outside Attendance Area');
  assert(res.distance > 5000, 'Distance should be several kilometers');
  pass('Student outside geofence is rejected with "Outside Attendance Area"');
} catch (e) {
  fail('Outside geofence verification', e);
}

// 4. Test anti-spoofing: poor GPS accuracy
try {
  const config = readInstitutionConfig();
  const res = validateAndRecordAttendance({
    studentId: 'test-std-lowacc-' + Date.now(),
    studentName: 'Test Student Low Accuracy',
    usn: '1NT21CS997',
    latitude: config.latitude,
    longitude: config.longitude,
    accuracy: 250, // 250m accuracy is too poor (threshold is 80m)
    clientTimestamp: new Date().toISOString()
  });

  assert.strictEqual(res.success, false, 'Should fail');
  assert.strictEqual(res.code, 'GPS_ACCURACY_TOO_LOW', 'Code should be GPS_ACCURACY_TOO_LOW');
  pass('Anti-spoofing rejects suspiciously low GPS accuracy (accuracy > threshold)');
} catch (e) {
  fail('Anti-spoofing low GPS accuracy test', e);
}

// 5. Test anti-spoofing: invalid coordinates
try {
  const res = validateAndRecordAttendance({
    studentId: 'test-std-invalid-' + Date.now(),
    studentName: 'Test Student Invalid',
    usn: '1NT21CS996',
    latitude: 999, // impossible latitude
    longitude: 76.6942,
    accuracy: 10
  });

  assert.strictEqual(res.success, false, 'Should fail');
  assert.strictEqual(res.code, 'INVALID_COORDINATES');
  pass('Anti-spoofing rejects impossible or forged coordinates');
} catch (e) {
  fail('Anti-spoofing invalid coordinates', e);
}

// 6. Test configuration persistence
try {
  const config = readInstitutionConfig();
  assert(config.latitude === 12.183700, 'Latitude should be 12.183700');
  assert(config.longitude === 76.694200, 'Longitude should be 76.694200');
  assert(config.address.includes('Thandavapura'), 'Address should contain Thandavapura');
  assert(config.geofenceRadiusMeters === 300, 'Default radius should be 300m');
  pass('Institution configuration loads Thandavapura address and configurable coordinates');
} catch (e) {
  fail('Configuration persistence test', e);
}

// HTTP API Integration Tests
const path = require('path');
const { fork } = require('child_process');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
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

async function runHttpTests() {
  let serverProcess = null;
  try {
    await request({ path: '/api/geofence/config', method: 'GET' });
  } catch (e) {
    serverProcess = fork(path.join(__dirname, '..', 'server.js'), [], { silent: true });
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        await request({ path: '/api/geofence/config', method: 'GET' });
        break;
      } catch (err) {}
    }
  }

  // 7. Test HTTP GET /api/geofence/config
  try {
    const res = await request({ path: '/api/geofence/config', method: 'GET' });
    assert.strictEqual(res.status, 200);
    assert(res.data.config && res.data.config.campusName.includes('Thandavapura'));
    pass('HTTP GET /api/geofence/config returns 200 with Thandavapura campus parameters');
  } catch (e) {
    fail('HTTP GET /api/geofence/config', e);
  }

  // 8. Test HTTP PUT /api/geofence/config permission check (403 for student/public)
  try {
    const res = await request({
      path: '/api/geofence/config',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT' }
    }, { geofenceRadiusMeters: 500 });
    assert.strictEqual(res.status, 403);
    pass('HTTP PUT /api/geofence/config correctly rejects unauthorized roles with 403 Forbidden');
  } catch (e) {
    fail('HTTP PUT /api/geofence/config permission check', e);
  }

  // 9. Test HTTP POST /api/attendance/geofence/verify
  const testStudentId = 'std-api-test-' + Date.now();
  try {
    const configRes = await request({ path: '/api/geofence/config', method: 'GET' });
    const config = configRes.data.config;
    const res = await request({
      path: '/api/attendance/geofence/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT', 'x-user-id': testStudentId }
    }, {
      studentId: testStudentId,
      studentName: 'API Geofence Test Student',
      usn: '1NT21CS888',
      latitude: config.latitude + 0.0001,
      longitude: config.longitude + 0.0001,
      accuracy: 20,
      clientTimestamp: new Date().toISOString()
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.record.status, 'PRESENT');
    pass('HTTP POST /api/attendance/geofence/verify accurately validates coordinates and saves check-in');
  } catch (e) {
    fail('HTTP POST /api/attendance/geofence/verify', e);
  }

  // 10. Test HTTP GET /api/attendance/geofence/today/:studentId
  try {
    const res = await request({
      path: `/api/attendance/geofence/today/${testStudentId}`,
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.hasMarkedToday, true);
    assert(res.data.record && res.data.record.studentId === testStudentId);
    pass('HTTP GET /api/attendance/geofence/today/:studentId returns today record with hasMarkedToday: true');
  } catch (e) {
    fail('HTTP GET /api/attendance/geofence/today/:studentId', e);
  }

  // 11. Test HTTP GET /api/attendance/geofence/records FERPA Scoping
  try {
    const res = await request({
      path: '/api/attendance/geofence/records',
      method: 'GET',
      headers: { 'x-user-role': 'STUDENT', 'x-user-id': testStudentId }
    });
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.records));
    assert(res.data.records.every(r => r.studentId === testStudentId));
    pass('HTTP GET /api/attendance/geofence/records enforces FERPA data scoping (student sees only own data)');
  } catch (e) {
    fail('HTTP GET /api/attendance/geofence/records FERPA test', e);
  }

  if (serverProcess) {
    serverProcess.kill();
  }

  console.log('================================================================');
  console.log(`📊 GEOFENCE TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHttpTests().catch(err => {
  console.error(err);
  process.exit(1);
});
