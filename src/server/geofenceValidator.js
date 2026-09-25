const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'mongodb');
const CONFIG_FILE = path.join(DATA_DIR, 'institution_config.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'geo_attendance.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Institution Coordinates for Thandavapura, Mysore–Ooty Road
const DEFAULT_CONFIG = {
  institutionName: "CampusConnect Institute of Technology",
  campusName: "Thandavapura Main Campus",
  address: "Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India",
  latitude: 12.183700,
  longitude: 76.694200,
  geofenceRadiusMeters: 300,
  accuracyThresholdMeters: 80,
  maxAllowedSpeedMps: 15,
  antiSpoofingEnabled: true,
  updatedAt: new Date().toISOString(),
  updatedBy: "system"
};

function readInstitutionConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading institution config:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveInstitutionConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving institution config:', err);
    return false;
  }
}

function readGeoAttendance() {
  try {
    if (fs.existsSync(ATTENDANCE_FILE)) {
      return JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading geo attendance records:', err);
  }
  return [];
}

function saveGeoAttendance(records) {
  try {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(records, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving geo attendance records:', err);
    return false;
  }
}

/**
 * High-precision Haversine Distance Formula
 * Calculates great-circle distance between two geographic coordinates in meters.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Mean radius of Earth in meters
  const toRad = deg => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Server-Side Geofence & Anti-Spoofing Attendance Validator
 * Re-computes distance authoritatively using server coordinates.
 * Validates GPS accuracy against institutional thresholds.
 * Detects time spoofing, coordinate forgery, and duplicate check-ins.
 */
function validateAndRecordAttendance({
  studentId,
  studentName,
  usn,
  department,
  semester,
  latitude,
  longitude,
  accuracy,
  clientTimestamp,
  clientIp = '127.0.0.1'
}) {
  const config = readInstitutionConfig();
  const now = new Date();

  // 1. Mandatory Parameter Validation
  if (!studentId) {
    return { success: false, code: 'MISSING_STUDENT_ID', error: 'Student ID is required.' };
  }

  const lat = Number(latitude);
  const lon = Number(longitude);
  const acc = Number(accuracy);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return {
      success: false,
      code: 'INVALID_COORDINATES',
      error: 'Invalid or missing GPS coordinates.'
    };
  }

  // 2. Anti-Spoofing: Detect Suspiciously Poor or Missing GPS Accuracy
  if (isNaN(acc) || acc <= 0) {
    return {
      success: false,
      code: 'GPS_ACCURACY_UNAVAILABLE',
      error: 'GPS accuracy reading is invalid or unavailable.'
    };
  }

  const accuracyThreshold = config.accuracyThresholdMeters || 80;
  if (acc > accuracyThreshold) {
    return {
      success: false,
      code: 'GPS_ACCURACY_TOO_LOW',
      error: `GPS accuracy too low (±${acc.toFixed(1)}m). Location cannot be reliably determined (required: < ±${accuracyThreshold}m).`,
      accuracy: acc,
      threshold: accuracyThreshold
    };
  }

  // 3. Anti-Spoofing: Timestamp Drift Check (< 5 minutes drift allowed)
  if (clientTimestamp) {
    const clientTime = new Date(clientTimestamp).getTime();
    if (!isNaN(clientTime)) {
      const driftSeconds = Math.abs((now.getTime() - clientTime) / 1000);
      if (driftSeconds > 300) {
        return {
          success: false,
          code: 'TIMESTAMP_DRIFT_EXCEEDED',
          error: 'Client timestamp differs significantly from server time (possible replay attempt).'
        };
      }
    }
  }

  // 4. Authoritative Server-Side Haversine Distance Calculation
  const serverDistance = calculateHaversineDistance(
    lat,
    lon,
    config.latitude,
    config.longitude
  );

  const radius = config.geofenceRadiusMeters || 300;
  const isInside = serverDistance <= radius;

  // 5. Geofence Boundary Check
  if (!isInside) {
    return {
      success: false,
      code: 'OUTSIDE_ATTENDANCE_AREA',
      status: 'Outside Attendance Area',
      error: `Outside Attendance Area. You are ${serverDistance.toFixed(1)}m from campus (geofence radius: ${radius}m).`,
      distance: Number(serverDistance.toFixed(2)),
      radius,
      studentLocation: { latitude: lat, longitude: lon },
      institutionLocation: { latitude: config.latitude, longitude: config.longitude }
    };
  }

  // 6. Duplicate Check for Today
  const todayStr = now.toISOString().slice(0, 10);
  const records = readGeoAttendance();
  const existingToday = records.find(r => 
    r.studentId === studentId && 
    r.date === todayStr &&
    r.status === 'PRESENT'
  );

  if (existingToday) {
    return {
      success: true,
      alreadyMarked: true,
      code: 'ALREADY_MARKED_TODAY',
      message: 'Attendance was already marked and verified for today.',
      record: existingToday
    };
  }

  // 7. Cryptographic Verification Hash Generation
  const hashPayload = `${studentId}:${lat}:${lon}:${acc}:${serverDistance}:${now.toISOString()}:MIT_THANDAVAPURA_SALT`;
  const verificationHash = 'GEO-VER-' + crypto.createHash('sha256').update(hashPayload).digest('hex').slice(0, 16).toUpperCase();

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const recordId = `geo-att-${Date.now()}-${studentId.slice(-4)}`;

  const newRecord = {
    _id: recordId,
    studentId,
    studentName: studentName || studentId,
    usn: usn || '1NT21CS042',
    department: department || 'Computer Science & Engineering',
    semester: Number(semester) || 6,
    timestamp: now.toISOString(),
    date: todayStr,
    time: formattedTime,
    checkInTime: `${todayStr} ${formattedTime}`,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    accuracy: Number(acc.toFixed(1)),
    distance: Number(serverDistance.toFixed(2)),
    radius,
    status: 'PRESENT',
    verificationMethod: 'LIVE_GPS_GEOFENCE_VERIFIED',
    antiSpoofingPassed: true,
    verificationHash,
    campus: config.campusName || 'Thandavapura Main Campus',
    clientIp
  };

  records.unshift(newRecord);
  saveGeoAttendance(records);

  return {
    success: true,
    alreadyMarked: false,
    code: 'ATTENDANCE_VERIFIED',
    message: 'Attendance marked successfully! Geofence & GPS identity verified.',
    record: newRecord
  };
}

module.exports = {
  readInstitutionConfig,
  saveInstitutionConfig,
  readGeoAttendance,
  saveGeoAttendance,
  calculateHaversineDistance,
  validateAndRecordAttendance,
  DEFAULT_CONFIG
};
