const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const COLLEGE_EMAIL_DOMAIN = process.env.COLLEGE_EMAIL_DOMAIN || 'yourcollege.edu.in,mitt.ac.in,college.edu';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Database file paths (MongoDB JSON Document Store)
const DATA_DIR = path.join(__dirname, 'data', 'mongodb');
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const SEMESTER_HISTORY_FILE = path.join(DATA_DIR, 'semester_history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Geofence & GPS Attendance Validator
const {
  readInstitutionConfig,
  saveInstitutionConfig,
  readGeoAttendance,
  saveGeoAttendance,
  calculateHaversineDistance,
  validateAndRecordAttendance
} = require('./src/server/geofenceValidator');

// Helper: generate Mongo-like 24-character hexadecimal ObjectId
function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

// Helpers for reading/writing MongoDB collections
function readStudents() {
  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading students collection:', err);
  }
  return [];
}

function saveStudents(students) {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving students collection:', err);
    return false;
  }
}

function readSemesterHistory() {
  try {
    if (fs.existsSync(SEMESTER_HISTORY_FILE)) {
      const data = fs.readFileSync(SEMESTER_HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading semester history collection:', err);
  }
  return [];
}

function saveSemesterHistory(history) {
  try {
    fs.writeFileSync(SEMESTER_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving semester history collection:', err);
    return false;
  }
}

const DEFAULT_SEMESTER_COURSES = {
  1: ['CS101 (Programming in C)', 'MA101 (Calculus)', 'PH101 (Physics)', 'EE101 (Basic Electrical)'],
  2: ['CS201 (Data Structures)', 'MA201 (Linear Algebra)', 'CH201 (Chemistry)', 'EC201 (Electronics)'],
  3: ['CS301 (Object-Oriented Java)', 'CS302 (Digital Logic)', 'MA301 (Discrete Math)', 'CS303 (Data Structures Lab)'],
  4: ['CS401 (Algorithms Design)', 'CS402 (Microprocessors)', 'CS403 (OS Fundamentals)', 'CS404 (Algorithm Lab)'],
  5: ['CS501 (Software Engineering)', 'CS502 (Computer Networks)', 'CS503 (Theory of Computation)', 'CS504 (DBMS)'],
  6: ['CS601 (Distributed Systems)', 'CS602 (Machine Learning)', 'CS603 (Cloud Architecture)', 'CS604 (Compiler Design)'],
  7: ['CS701 (AI & Deep Learning)', 'CS702 (Cyber Security)', 'CS703 (Big Data Analytics)', 'CS704 (Elective III)'],
  8: ['CS801 (Major Capstone Project)', 'CS802 (Industrial Internship)', 'CS803 (Cloud & DevOps Practicum)']
};
function readTeachers() {
  try {
    if (fs.existsSync(TEACHERS_FILE)) {
      const data = fs.readFileSync(TEACHERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading teachers collection:', err);
  }
  return [];
}

function saveTeachers(teachers) {
  try {
    fs.writeFileSync(TEACHERS_FILE, JSON.stringify(teachers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving teachers collection:', err);
    return false;
  }
}

function readAuditLogs() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading audit logs:', err);
  }
  return [];
}

function saveAuditLogs(logs) {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving audit logs:', err);
    return false;
  }
}

function addAuditLog(performedBy, action, targetUser, details) {
  const logs = readAuditLogs();
  const newLog = {
    _id: 'aud-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
    performedBy: performedBy || 'usr-hod-01',
    action, // ADD_TEACHER, EDIT_TEACHER, ACTIVATE_TEACHER, DEACTIVATE_TEACHER
    targetUser,
    details: details || '',
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  saveAuditLogs(logs);
  return newLog;
}

// Authentication & Role Extraction Middleware
function extractAuth(req) {
  // Extract from custom headers or Authorization header
  const authHeader = req.headers['authorization'] || '';
  const xRole = req.headers['x-user-role'] || '';
  const xUserId = req.headers['x-user-id'] || '';
  const xUserEmail = req.headers['x-user-email'] || '';

  let role = xRole;
  let userId = xUserId;
  let email = xUserEmail;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      // Token may be a base64 JSON payload or encoded user object
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      if (decoded.role) role = decoded.role;
      if (decoded.id || decoded._id) userId = decoded.id || decoded._id;
      if (decoded.email) email = decoded.email;
    } catch (e) {
      // Plain token fallback
      if (!role) {
        if (token.toLowerCase().includes('hod')) role = 'HOD';
        else if (token.toLowerCase().includes('admin')) role = 'Admin';
        else if (token.toLowerCase().includes('teacher')) role = 'Teacher';
        else if (token.toLowerCase().includes('student')) role = 'Student';
      }
    }
  }

  // Normalize role
  const normalizedRole = (role || '').trim().toUpperCase();
  return {
    isAuthenticated: !!(role || userId || email),
    role: normalizedRole,
    rawRole: role,
    userId: userId || 'usr-hod-01',
    email
  };
}

// Validate email domain against configured COLLEGE_EMAIL_DOMAIN
function validateCollegeEmail(email) {
  if (!email || !email.includes('@')) {
    return false;
  }
  const emailDomain = email.split('@')[1].toLowerCase().trim();
  const allowedDomains = COLLEGE_EMAIL_DOMAIN.split(',').map(d => d.trim().toLowerCase());
  
  return allowedDomains.some(d => {
    return emailDomain === d || emailDomain.endsWith('.' + d);
  });
}

// Validate Profile Photo (JPG, JPEG, PNG, WEBP)
function validateProfilePhoto(photo) {
  if (!photo || typeof photo !== 'string' || photo.trim().length === 0) {
    return false;
  }
  const clean = photo.trim();
  // Check for base64 data URI
  const dataUriMatch = clean.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
  if (dataUriMatch) return true;

  // Check for valid image URL or path ending in supported extension
  const cleanUrl = clean.split('?')[0].toLowerCase();
  if (/\.(jpg|jpeg|png|webp)$/i.test(cleanUrl)) return true;

  // Accept Unsplash or trusted image URLs
  if (clean.startsWith('http://') || clean.startsWith('https://')) return true;

  return false;
}

// Send JSON Response helper
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role, x-user-id, x-user-email'
  });
  res.end(JSON.stringify(data));
}

// Parse request body helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protect against overly massive payloads (> 20MB)
      if (body.length > 20 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role, x-user-id, x-user-email'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // ==========================================================
  // REST API ROUTING
  // ==========================================================

  // --- GEOFENCE & LIVE GPS ATTENDANCE APIS ---
  // A. GET /api/geofence/config (Fetch configurable institution location & radius)
  if (pathname === '/api/geofence/config' && req.method === 'GET') {
    const config = readInstitutionConfig();
    return sendJSON(res, 200, {
      success: true,
      config
    });
  }

  // B. PUT /api/geofence/config (Update institution location, geofence radius, or threshold - HOD/Admin)
  if (pathname === '/api/geofence/config' && req.method === 'PUT') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to modify geofence configuration." });
    }
    try {
      const data = await parseBody(req);
      const config = readInstitutionConfig();
      if (data.latitude !== undefined) config.latitude = Number(data.latitude);
      if (data.longitude !== undefined) config.longitude = Number(data.longitude);
      if (data.geofenceRadiusMeters !== undefined) config.geofenceRadiusMeters = Number(data.geofenceRadiusMeters);
      if (data.accuracyThresholdMeters !== undefined) config.accuracyThresholdMeters = Number(data.accuracyThresholdMeters);
      if (data.address !== undefined) config.address = data.address;
      if (data.institutionName !== undefined) config.institutionName = data.institutionName;
      config.updatedAt = new Date().toISOString();
      config.updatedBy = auth.userId || auth.email || 'admin@campus.edu';

      saveInstitutionConfig(config);
      addAuditLog(auth.userId || 'admin', 'UPDATE_GEOFENCE_CONFIG', 'INSTITUTION_GEOFENCE', `Updated geofence radius to ${config.geofenceRadiusMeters}m at [${config.latitude}, ${config.longitude}]`);
      return sendJSON(res, 200, { success: true, message: "Geofence configuration updated.", config });
    } catch (err) {
      console.error('Error updating geofence config:', err);
      return sendJSON(res, 500, { error: "Failed to update geofence configuration." });
    }
  }

  // C. POST /api/attendance/geofence/verify (Server-Side GPS & Geofence Validation)
  if (pathname === '/api/attendance/geofence/verify' && req.method === 'POST') {
    const auth = extractAuth(req);
    try {
      const data = await parseBody(req);
      const studentId = data.studentId || auth.userId;
      
      const validationResult = validateAndRecordAttendance({
        studentId,
        studentName: data.studentName,
        usn: data.usn,
        department: data.department,
        semester: data.semester,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        clientTimestamp: data.clientTimestamp,
        clientIp: req.socket.remoteAddress || '127.0.0.1'
      });

      if (!validationResult.success) {
        return sendJSON(res, 400, validationResult);
      }

      if (!validationResult.alreadyMarked) {
        addAuditLog(
          studentId,
          'GEOFENCE_ATTENDANCE_MARKED',
          validationResult.record._id,
          `Verified GPS Geofence Attendance for ${validationResult.record.studentName} (${validationResult.record.usn}): ${validationResult.record.distance}m from campus (accuracy: ±${validationResult.record.accuracy}m)`
        );
      }

      return sendJSON(res, 200, validationResult);
    } catch (err) {
      console.error('Error verifying geofence attendance:', err);
      return sendJSON(res, 500, { success: false, error: "Internal server error validating geofence attendance." });
    }
  }

  // D. GET /api/attendance/geofence/records (List attendance records with FERPA scoping)
  if (pathname === '/api/attendance/geofence/records' && req.method === 'GET') {
    const auth = extractAuth(req);
    const filterStudentId = parsedUrl.searchParams.get('studentId');
    const filterDate = parsedUrl.searchParams.get('date');
    let records = readGeoAttendance();

    // FERPA Data Privacy: Students can only retrieve their own attendance records
    if (auth.role === 'STUDENT' && auth.userId) {
      records = records.filter(r => r.studentId === auth.userId);
    } else if (filterStudentId) {
      records = records.filter(r => r.studentId === filterStudentId);
    }

    if (filterDate) {
      records = records.filter(r => r.date === filterDate);
    }

    return sendJSON(res, 200, {
      success: true,
      count: records.length,
      records
    });
  }

  // E. GET /api/attendance/geofence/today/:studentId (Check today's check-in status)
  const todayCheckMatch = pathname.match(/^\/api\/attendance\/geofence\/today\/([a-zA-Z0-9_-]+)$/);
  if (todayCheckMatch && req.method === 'GET') {
    const studentId = todayCheckMatch[1];
    const todayStr = new Date().toISOString().slice(0, 10);
    const records = readGeoAttendance();
    const todayRecord = records.find(r => r.studentId === studentId && r.date === todayStr && r.status === 'PRESENT');
    return sendJSON(res, 200, {
      success: true,
      hasMarkedToday: !!todayRecord,
      record: todayRecord || null
    });
  }

  // 1. GET /api/teachers/config (public config)
  if (pathname === '/api/teachers/config' && req.method === 'GET') {
    return sendJSON(res, 200, {
      collegeEmailDomain: COLLEGE_EMAIL_DOMAIN,
      allowedDomains: COLLEGE_EMAIL_DOMAIN.split(',').map(d => d.trim())
    });
  }

  // 2. GET /api/teachers/audit-logs (HOD & Admin only)
  if (pathname === '/api/teachers/audit-logs' && req.method === 'GET') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, {
        error: "You do not have permission to add teachers."
      });
    }
    const logs = readAuditLogs();
    return sendJSON(res, 200, { success: true, count: logs.length, logs });
  }

  // 3. POST /api/teachers (HOD & ADMIN ONLY - Section 1, 3, 4, 5, 6, 7, 8, 9)
  if (pathname === '/api/teachers' && req.method === 'POST') {
    const auth = extractAuth(req);

    // Strict Backend Role Verification (Section 1 & 9)
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, {
        error: "You do not have permission to add teachers."
      });
    }

    try {
      const data = await parseBody(req);
      const teachers = readTeachers();

      // Field 1: Profile Photo Validation (Section 4)
      if (!validateProfilePhoto(data.profilePhoto)) {
        return sendJSON(res, 400, {
          error: "Teacher profile photo is required."
        });
      }

      // Field 2: Full Name
      if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        return sendJSON(res, 400, {
          error: "Full name is required."
        });
      }

      // Field 3: Phone Number
      if (!data.phone || typeof data.phone !== 'string' || !data.phone.trim()) {
        return sendJSON(res, 400, {
          error: "Phone number is required."
        });
      }

      // Field 4: College Email Validation (Section 5)
      const email = (data.email || '').trim().toLowerCase();
      if (!validateCollegeEmail(email)) {
        return sendJSON(res, 400, {
          error: "Please enter a valid college Gmail/college email address."
        });
      }

      // Duplicate Email Check (Section 5)
      const emailExists = teachers.some(t => t.email && t.email.toLowerCase() === email);
      if (emailExists) {
        return sendJSON(res, 400, {
          error: "Teacher with this college email already exists."
        });
      }

      // Field 5: Faculty ID Validation (Section 6)
      const facultyId = (data.facultyId || '').trim().toUpperCase();
      if (!facultyId) {
        return sendJSON(res, 400, {
          error: "Faculty ID is required."
        });
      }

      // Unique Faculty ID Check (Section 6)
      const facultyIdExists = teachers.some(t => t.facultyId && t.facultyId.toUpperCase() === facultyId);
      if (facultyIdExists) {
        return sendJSON(res, 400, {
          error: "Faculty ID already exists."
        });
      }

      const now = new Date().toISOString();

      // Construct MongoDB Teacher Document (Section 7)
      const newTeacher = {
        _id: generateObjectId(),
        name: data.name.trim(),
        profilePhoto: data.profilePhoto.trim(),
        email: email,
        phone: data.phone.trim(),

        // Role must always automatically be TEACHER (Section 3 & 7)
        role: "TEACHER",

        facultyId: facultyId,
        designation: (data.designation || 'Assistant Professor').trim(),
        department: (data.department || 'Computer Science and Engineering').trim(),
        qualification: (data.qualification || '').trim(),
        specialization: (data.specialization || '').trim(),
        experience: (data.experience || '').trim(),
        officeRoom: (data.officeRoom || '').trim(),
        joiningDate: data.joiningDate || now.split('T')[0],

        subjectsHandled: data.subjectsHandled || 'CS501',
        assignedSemester: data.assignedSemester || '5th Semester',
        assignedSection: data.assignedSection || 'Section A',
        assignedClasses: data.assignedClasses || '5th Sem CSE A',

        // Account Status: ACTIVE / INACTIVE (default: ACTIVE) (Section 3 & 7)
        accountStatus: (data.accountStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),

        // Created by authenticated HOD/Admin (Section 8)
        createdBy: auth.userId || 'usr-hod-01',
        createdAt: now,
        updatedAt: now
      };

      teachers.unshift(newTeacher);
      saveTeachers(teachers);

      // Audit Log Record (Section 14)
      addAuditLog(
        auth.userId || 'usr-hod-01',
        'ADD_TEACHER',
        newTeacher._id,
        `HOD registered new teacher: ${newTeacher.name} (${newTeacher.facultyId})`
      );

      return sendJSON(res, 201, {
        success: true,
        message: "Teacher added successfully.",
        teacher: newTeacher
      });
    } catch (err) {
      console.error('Error creating teacher:', err);
      return sendJSON(res, 500, {
        error: "Internal server error creating teacher account."
      });
    }
  }

  // 4. GET /api/teachers (List all teachers - Section 11)
  if (pathname === '/api/teachers' && req.method === 'GET') {
    const teachers = readTeachers();
    return sendJSON(res, 200, {
      success: true,
      count: teachers.length,
      teachers
    });
  }

  // 5. PUT /api/teachers/:id (Edit teacher - Section 12)
  const editMatch = pathname.match(/^\/api\/teachers\/([a-zA-Z0-9_-]+)$/);
  if (editMatch && req.method === 'PUT') {
    const auth = extractAuth(req);

    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, {
        error: "You do not have permission to add teachers."
      });
    }

    const teacherId = editMatch[1];
    const teachers = readTeachers();
    const index = teachers.findIndex(t => t._id === teacherId || t.facultyId === teacherId);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Teacher not found." });
    }

    try {
      const data = await parseBody(req);
      const existing = teachers[index];

      // Validate email if changed
      if (data.email && data.email.toLowerCase().trim() !== existing.email.toLowerCase()) {
        const newEmail = data.email.toLowerCase().trim();
        if (!validateCollegeEmail(newEmail)) {
          return sendJSON(res, 400, {
            error: "Please enter a valid college Gmail/college email address."
          });
        }
        const dup = teachers.some((t, i) => i !== index && t.email.toLowerCase() === newEmail);
        if (dup) {
          return sendJSON(res, 400, {
            error: "Teacher with this college email already exists."
          });
        }
        existing.email = newEmail;
      }

      // Validate facultyId if changed
      if (data.facultyId && data.facultyId.toUpperCase().trim() !== existing.facultyId.toUpperCase()) {
        const newFacId = data.facultyId.toUpperCase().trim();
        const dup = teachers.some((t, i) => i !== index && t.facultyId.toUpperCase() === newFacId);
        if (dup) {
          return sendJSON(res, 400, {
            error: "Faculty ID already exists."
          });
        }
        existing.facultyId = newFacId;
      }

      if (data.profilePhoto && validateProfilePhoto(data.profilePhoto)) {
        existing.profilePhoto = data.profilePhoto.trim();
      }

      if (data.name) existing.name = data.name.trim();
      if (data.phone) existing.phone = data.phone.trim();
      if (data.designation) existing.designation = data.designation.trim();
      if (data.department) existing.department = data.department.trim();
      if (data.qualification !== undefined) existing.qualification = data.qualification.trim();
      if (data.specialization !== undefined) existing.specialization = data.specialization.trim();
      if (data.experience !== undefined) existing.experience = data.experience.trim();
      if (data.officeRoom !== undefined) existing.officeRoom = data.officeRoom.trim();
      if (data.joiningDate) existing.joiningDate = data.joiningDate;
      if (data.subjectsHandled !== undefined) existing.subjectsHandled = data.subjectsHandled;
      if (data.assignedSemester !== undefined) existing.assignedSemester = data.assignedSemester;
      if (data.assignedSection !== undefined) existing.assignedSection = data.assignedSection;
      if (data.assignedClasses !== undefined) existing.assignedClasses = data.assignedClasses;
      if (data.accountStatus) existing.accountStatus = data.accountStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

      // Role must strictly remain TEACHER (Section 12)
      existing.role = "TEACHER";
      existing.updatedAt = new Date().toISOString();

      teachers[index] = existing;
      saveTeachers(teachers);

      // Audit Log Record (Section 14)
      addAuditLog(
        auth.userId || 'usr-hod-01',
        'EDIT_TEACHER',
        existing._id,
        `HOD edited details for teacher: ${existing.name} (${existing.facultyId})`
      );

      return sendJSON(res, 200, {
        success: true,
        message: "Teacher updated successfully.",
        teacher: existing
      });
    } catch (err) {
      console.error('Error updating teacher:', err);
      return sendJSON(res, 500, { error: "Failed to update teacher." });
    }
  }

  // 6. PATCH /api/teachers/:id/status (Activate / Deactivate - Section 13)
  const statusMatch = pathname.match(/^\/api\/teachers\/([a-zA-Z0-9_-]+)\/status$/);
  if (statusMatch && req.method === 'PATCH') {
    const auth = extractAuth(req);

    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, {
        error: "You do not have permission to add teachers."
      });
    }

    const teacherId = statusMatch[1];
    const teachers = readTeachers();
    const index = teachers.findIndex(t => t._id === teacherId || t.facultyId === teacherId);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Teacher not found." });
    }

    try {
      const data = await parseBody(req);
      const newStatus = data.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const teacher = teachers[index];

      teacher.accountStatus = newStatus;
      teacher.updatedAt = new Date().toISOString();
      teachers[index] = teacher;
      saveTeachers(teachers);

      // Audit Log Record (Section 14)
      const action = newStatus === 'ACTIVE' ? 'ACTIVATE_TEACHER' : 'DEACTIVATE_TEACHER';
      addAuditLog(
        auth.userId || 'usr-hod-01',
        action,
        teacher._id,
        `HOD changed account status to ${newStatus} for teacher: ${teacher.name} (${teacher.facultyId})`
      );

      return sendJSON(res, 200, {
        success: true,
        message: `Teacher ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
        teacher
      });
    } catch (err) {
      console.error('Error updating teacher status:', err);
      return sendJSON(res, 500, { error: "Failed to update teacher status." });
    }
  }

  // ==========================================================
  // SMARTDEPT: 1st TO 8th SEMESTER STUDENT INFORMATION MANAGEMENT API
  // (Requirements 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 30, 31)
  // ==========================================================

  // 7. GET /api/students/stats (Summary statistics for dashboard)
  if (pathname === '/api/students/stats' && req.method === 'GET') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    const students = readStudents();
    const semCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    const secCounts = {};
    let active = 0, inactive = 0, graduated = 0, suspended = 0;

    students.forEach(s => {
      const sem = parseInt(s.semester) || 1;
      if (semCounts[sem] !== undefined) semCounts[sem]++;
      
      const secKey = `${sem}-${s.section || 'A'}`;
      secCounts[secKey] = (secCounts[secKey] || 0) + 1;

      const st = (s.status || 'ACTIVE').toUpperCase();
      if (st === 'ACTIVE') active++;
      else if (st === 'INACTIVE') inactive++;
      else if (st === 'GRADUATED') graduated++;
      else if (st === 'SUSPENDED') suspended++;
    });

    return sendJSON(res, 200, {
      success: true,
      totalStudents: students.length,
      activeStudents: active,
      inactiveStudents: inactive,
      graduatedStudents: graduated,
      suspendedStudents: suspended,
      semesters: semCounts,
      sectionCounts: secCounts
    });
  }

  // 8. GET /api/students/export (CSV export of filtered students)
  if (pathname === '/api/students/export' && req.method === 'GET') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    const students = readStudents();
    const semParam = parsedUrl.searchParams.get('semester');
    const secParam = parsedUrl.searchParams.get('section');
    const statusParam = parsedUrl.searchParams.get('status');

    let filtered = students;
    if (semParam && semParam !== 'All') {
      filtered = filtered.filter(s => String(s.semester) === String(semParam));
    }
    if (secParam && secParam !== 'All') {
      filtered = filtered.filter(s => (s.section || '').toUpperCase() === secParam.toUpperCase());
    }
    if (statusParam && statusParam !== 'All') {
      filtered = filtered.filter(s => (s.status || 'ACTIVE').toUpperCase() === statusParam.toUpperCase());
    }

    const headers = ['USN', 'StudentName', 'CollegeEmail', 'Phone', 'Department', 'Semester', 'Section', 'Batch', 'Status'];
    const rows = filtered.map(s => [
      `"${s.usn || ''}"`,
      `"${s.name || ''}"`,
      `"${s.collegeEmail || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.department || 'CSE'}"`,
      `"${s.semester || 1}"`,
      `"${s.section || 'A'}"`,
      `"${s.batch || '2022-2026'}"`,
      `"${s.status || 'ACTIVE'}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="smartdept_students_export.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(csvContent);
    return;
  }

  // 9. POST /api/students/import (Bulk student import with validation)
  if (pathname === '/api/students/import' && req.method === 'POST') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    try {
      const data = await parseBody(req);
      const incomingList = Array.isArray(data.students) ? data.students : (Array.isArray(data) ? data : []);
      const existingStudents = readStudents();
      const existingHistory = readSemesterHistory();

      const existingUSNs = new Set(existingStudents.map(s => (s.usn || '').toUpperCase()));
      const existingEmails = new Set(existingStudents.map(s => (s.collegeEmail || '').toLowerCase()));
      const existingIds = new Set(existingStudents.map(s => (s.studentId || '').toUpperCase()));

      let validRecords = [];
      let invalidRecords = [];
      let duplicateRecords = [];
      const now = new Date().toISOString();

      incomingList.forEach((item, idx) => {
        const usn = (item.usn || '').trim().toUpperCase();
        const name = (item.name || item.studentName || '').trim();
        const email = (item.collegeEmail || item.email || '').trim().toLowerCase();
        const sem = parseInt(item.semester) || 1;
        const sec = (item.section || 'A').trim().toUpperCase();

        if (!usn || !name || !email) {
          invalidRecords.push({ row: idx + 1, item, reason: 'Missing USN, Name, or Email' });
          return;
        }

        if (sem < 1 || sem > 8) {
          invalidRecords.push({ row: idx + 1, item, reason: `Invalid semester: ${sem} (must be 1 to 8)` });
          return;
        }

        if (existingUSNs.has(usn) || existingEmails.has(email)) {
          duplicateRecords.push({ row: idx + 1, item, reason: existingUSNs.has(usn) ? 'Duplicate USN' : 'Duplicate Email' });
          return;
        }

        existingUSNs.add(usn);
        existingEmails.add(email);

        const newId = generateObjectId();
        const studentDoc = {
          _id: newId,
          userId: `usr-import-${Date.now()}-${idx}`,
          profilePhoto: item.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`,
          name: name,
          gender: item.gender || 'Not Specified',
          phone: item.phone || '+91 98450 00000',
          collegeEmail: email,
          personalEmail: item.personalEmail || '',
          bloodGroup: item.bloodGroup || 'O+',
          studentId: item.studentId || `STD-IMP-${usn}`,
          usn: usn,
          admissionNumber: item.admissionNumber || `ADM-${usn}`,
          department: item.department || 'Computer Science and Engineering',
          semester: sem,
          section: sec,
          batch: item.batch || '2024-2028',
          status: 'ACTIVE',
          role: 'STUDENT',
          skills: item.skills || '',
          interests: item.interests || '',
          bio: item.bio || '',
          guardian: item.guardian || { name: 'Guardian', relationship: 'Parent', phone: '', email: '' },
          createdBy: auth.userId || 'usr-hod-01',
          createdAt: now,
          updatedAt: now
        };

        validRecords.push(studentDoc);

        // Initial semester history
        existingHistory.push({
          _id: generateObjectId(),
          studentId: newId,
          usn: usn,
          studentName: name,
          semester: sem,
          academicYear: '2024-2025',
          department: studentDoc.department,
          section: sec,
          subjects: DEFAULT_SEMESTER_COURSES[sem] || DEFAULT_SEMESTER_COURSES[1],
          attendance: 85,
          internalMarks: { ia1: 20, ia2: 21, assignment: 9, total: 50 },
          examinationRecords: { grade: 'A', sgpa: '8.00', resultStatus: 'PASS' },
          createdAt: now
        });
      });

      if (validRecords.length > 0) {
        existingStudents.push(...validRecords);
        saveStudents(existingStudents);
        saveSemesterHistory(existingHistory);
        addAuditLog(auth.userId || 'usr-hod-01', 'IMPORT_STUDENTS', 'MULTIPLE', `Imported ${validRecords.length} student records.`);
      }

      return sendJSON(res, 200, {
        success: true,
        validCount: validRecords.length,
        invalidCount: invalidRecords.length,
        duplicateCount: duplicateRecords.length,
        insertedCount: validRecords.length,
        errors: [...invalidRecords, ...duplicateRecords]
      });
    } catch (err) {
      console.error('Import students error:', err);
      return sendJSON(res, 500, { error: 'Failed to process student import.' });
    }
  }

  // 10. GET /api/students/semester/:semester
  const semRouteMatch = pathname.match(/^\/api\/students\/semester\/([1-8])$/);
  if (semRouteMatch && req.method === 'GET') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN', 'TEACHER'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }
    const sem = parseInt(semRouteMatch[1]);
    const students = readStudents().filter(s => parseInt(s.semester) === sem);
    return sendJSON(res, 200, { success: true, count: students.length, semester: sem, students });
  }

  // 11. GET /api/students/section/:section
  const secRouteMatch = pathname.match(/^\/api\/students\/section\/([A-Za-z0-9_-]+)$/);
  if (secRouteMatch && req.method === 'GET') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN', 'TEACHER'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }
    const sec = secRouteMatch[1].toUpperCase();
    const students = readStudents().filter(s => (s.section || '').toUpperCase() === sec);
    return sendJSON(res, 200, { success: true, count: students.length, section: sec, students });
  }

  // 12. GET /api/students/:id/academic-history
  const histMatch = pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)\/academic-history$/);
  if (histMatch && req.method === 'GET') {
    const studentId = histMatch[1];
    const history = readSemesterHistory().filter(h => h.studentId === studentId || h.usn === studentId);
    return sendJSON(res, 200, { success: true, count: history.length, history, academicHistory: history });
  }

  // 13. POST /api/students (Register New Student - Section 7, 8, 9, 10, 19, 21, 22)
  if (pathname === '/api/students' && req.method === 'POST') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    try {
      const data = await parseBody(req);
      const students = readStudents();

      // Profile photo is compulsory (Section 8)
      if (!validateProfilePhoto(data.profilePhoto)) {
        return sendJSON(res, 400, { error: "Student profile photo is required." });
      }

      // Full Name compulsory
      if (!data.name || !data.name.trim()) {
        return sendJSON(res, 400, { error: "Full name is required." });
      }

      // College Gmail validation (Section 8 & 22)
      const email = (data.collegeEmail || data.email || '').trim().toLowerCase();
      if (!validateCollegeEmail(email)) {
        return sendJSON(res, 400, { error: "Please enter a valid college Gmail/college email address." });
      }

      // Duplicate email check (Section 21)
      if (students.some(s => s.collegeEmail && s.collegeEmail.toLowerCase() === email)) {
        return sendJSON(res, 409, { error: "College email already exists." });
      }

      // USN validation (Section 9 & 21)
      const usn = (data.usn || '').trim().toUpperCase();
      if (!usn) {
        return sendJSON(res, 400, { error: "USN is required." });
      }
      if (students.some(s => s.usn && s.usn.toUpperCase() === usn)) {
        return sendJSON(res, 409, { error: "USN already exists." });
      }

      // Student ID validation (Section 9 & 21)
      const studentId = (data.studentId || `STD-${usn}`).trim().toUpperCase();
      if (students.some(s => s.studentId && s.studentId.toUpperCase() === studentId)) {
        return sendJSON(res, 409, { error: "Student ID already exists." });
      }

      // Semester validation (Section 1: numeric 1 to 8)
      const semester = parseInt(data.semester) || 1;
      if (semester < 1 || semester > 8) {
        return sendJSON(res, 400, { error: "Semester must be a numeric value between 1 and 8." });
      }

      const now = new Date().toISOString();
      const newId = generateObjectId();

      const newStudent = {
        _id: newId,
        userId: data.userId || `usr-std-${newId}`,
        profilePhoto: data.profilePhoto.trim(),
        name: data.name.trim(),
        gender: data.gender || 'Not Specified',
        dateOfBirth: data.dateOfBirth || '',
        phone: (data.phone || '').trim(),
        personalEmail: (data.personalEmail || '').trim(),
        collegeEmail: email,
        bloodGroup: data.bloodGroup || 'O+',
        address: data.address || '',
        city: data.city || 'Mysuru',
        state: data.state || 'Karnataka',
        pincode: data.pincode || '',
        studentId: studentId,
        usn: usn,
        admissionNumber: data.admissionNumber || `ADM-${usn}`,
        department: data.department || 'Computer Science and Engineering',
        semester: semester,
        section: (data.section || 'A').toUpperCase(),
        batch: data.batch || '2024-2028',
        admissionYear: data.admissionYear || '2024',
        academicYear: data.academicYear || '2024-2025',
        status: data.status || 'ACTIVE',
        role: "STUDENT", // Role strictly locked to STUDENT (Section 10)
        skills: data.skills || '',
        interests: data.interests || '',
        bio: data.bio || '',
        github: data.github || '',
        linkedin: data.linkedin || '',
        portfolio: data.portfolio || '',
        guardian: data.guardian || {
          name: data.guardianName || '',
          relationship: data.guardianRelationship || 'Parent',
          phone: data.guardianPhone || '',
          email: data.guardianEmail || '',
          occupation: data.guardianOccupation || ''
        },
        createdBy: auth.userId || 'usr-hod-01',
        createdAt: now,
        updatedAt: now
      };

      students.unshift(newStudent);
      saveStudents(students);

      // Create initial Semester History (Section 20)
      const history = readSemesterHistory();
      history.unshift({
        _id: generateObjectId(),
        studentId: newId,
        usn: usn,
        studentName: newStudent.name,
        semester: semester,
        academicYear: newStudent.academicYear,
        department: newStudent.department,
        section: newStudent.section,
        subjects: DEFAULT_SEMESTER_COURSES[semester] || DEFAULT_SEMESTER_COURSES[1],
        attendance: 88,
        internalMarks: { ia1: 22, ia2: 23, assignment: 9, total: 54 },
        examinationRecords: { grade: 'A+', sgpa: '8.50', resultStatus: 'PASS' },
        createdAt: now
      });
      saveSemesterHistory(history);

      // Audit Log (Section 25)
      addAuditLog(auth.userId || 'usr-hod-01', 'CREATE_STUDENT', newStudent._id, `HOD registered new student: ${newStudent.name} (${newStudent.usn}, Sem ${newStudent.semester}-${newStudent.section})`);

      return sendJSON(res, 201, {
        success: true,
        message: "Student added successfully.",
        student: newStudent
      });
    } catch (err) {
      console.error('Error creating student:', err);
      return sendJSON(res, 500, { error: "Failed to create student record." });
    }
  }

  // 14. GET /api/students (List students with search and filters)
  if (pathname === '/api/students' && req.method === 'GET') {
    const auth = extractAuth(req);
    // Student role can only get their own data or public count
    const students = readStudents();

    const semParam = parsedUrl.searchParams.get('semester');
    const secParam = parsedUrl.searchParams.get('section');
    const deptParam = parsedUrl.searchParams.get('department');
    const batchParam = parsedUrl.searchParams.get('batch');
    const statusParam = parsedUrl.searchParams.get('status');
    const searchParam = parsedUrl.searchParams.get('search');

    let filtered = students;

    if (semParam && semParam !== 'All') {
      filtered = filtered.filter(s => String(s.semester) === String(semParam));
    }
    if (secParam && secParam !== 'All') {
      filtered = filtered.filter(s => (s.section || '').toUpperCase() === secParam.toUpperCase());
    }
    if (deptParam && deptParam !== 'All') {
      filtered = filtered.filter(s => (s.department || '').toLowerCase().includes(deptParam.toLowerCase()));
    }
    if (batchParam && batchParam !== 'All') {
      filtered = filtered.filter(s => (s.batch || '') === batchParam);
    }
    if (statusParam && statusParam !== 'All') {
      filtered = filtered.filter(s => (s.status || 'ACTIVE').toUpperCase() === statusParam.toUpperCase());
    }
    if (searchParam) {
      const q = searchParam.toLowerCase().trim();
      filtered = filtered.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.usn && s.usn.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.collegeEmail && s.collegeEmail.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }

    return sendJSON(res, 200, {
      success: true,
      total: filtered.length,
      students: filtered
    });
  }

  // 15. GET /api/students/:id (Get single student - Section 14 & 26)
  const singleStudentMatch = pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)$/);
  if (singleStudentMatch && req.method === 'GET') {
    const id = singleStudentMatch[1];
    const students = readStudents();
    const student = students.find(s => s._id === id || s.studentId === id || s.usn === id);

    if (!student) {
      return sendJSON(res, 404, { error: "Student not found." });
    }

    const auth = extractAuth(req);
    // Student privacy shield (Section 26)
    if (auth.role === 'STUDENT') {
      const isSelf = auth.userId === student._id || auth.userId === student.userId || auth.email === student.collegeEmail;
      if (!isSelf) {
        return sendJSON(res, 403, { error: "You can only access your own student record." });
      }
    }

    return sendJSON(res, 200, { success: true, student });
  }

  // 16. PUT /api/students/:id (Edit Student - Section 15)
  if (singleStudentMatch && req.method === 'PUT') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    const id = singleStudentMatch[1];
    const students = readStudents();
    const index = students.findIndex(s => s._id === id || s.studentId === id || s.usn === id);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Student not found." });
    }

    try {
      const data = await parseBody(req);
      const existing = students[index];

      // USN unique check if changed
      if (data.usn && data.usn.toUpperCase().trim() !== existing.usn.toUpperCase()) {
        const newUsn = data.usn.toUpperCase().trim();
        if (students.some((s, i) => i !== index && s.usn.toUpperCase() === newUsn)) {
          return sendJSON(res, 409, { error: "USN already exists." });
        }
        existing.usn = newUsn;
      }

      // Student ID unique check if changed
      if (data.studentId && data.studentId.toUpperCase().trim() !== existing.studentId.toUpperCase()) {
        const newId = data.studentId.toUpperCase().trim();
        if (students.some((s, i) => i !== index && s.studentId.toUpperCase() === newId)) {
          return sendJSON(res, 409, { error: "Student ID already exists." });
        }
        existing.studentId = newId;
      }

      // Email unique check & domain check if changed
      if (data.collegeEmail && data.collegeEmail.toLowerCase().trim() !== existing.collegeEmail.toLowerCase()) {
        const newEmail = data.collegeEmail.toLowerCase().trim();
        if (!validateCollegeEmail(newEmail)) {
          return sendJSON(res, 400, { error: "Please enter a valid college Gmail/college email address." });
        }
        if (students.some((s, i) => i !== index && s.collegeEmail.toLowerCase() === newEmail)) {
          return sendJSON(res, 409, { error: "College email already exists." });
        }
        existing.collegeEmail = newEmail;
      }

      if (data.profilePhoto && validateProfilePhoto(data.profilePhoto)) {
        existing.profilePhoto = data.profilePhoto.trim();
      }

      if (data.name) existing.name = data.name.trim();
      if (data.gender) existing.gender = data.gender;
      if (data.dateOfBirth) existing.dateOfBirth = data.dateOfBirth;
      if (data.phone) existing.phone = data.phone.trim();
      if (data.personalEmail !== undefined) existing.personalEmail = data.personalEmail.trim();
      if (data.bloodGroup) existing.bloodGroup = data.bloodGroup;
      if (data.address !== undefined) existing.address = data.address.trim();
      if (data.city) existing.city = data.city.trim();
      if (data.state) existing.state = data.state.trim();
      if (data.pincode) existing.pincode = data.pincode.trim();

      // Academic details
      const oldSection = existing.section;
      const oldDept = existing.department;

      if (data.department) existing.department = data.department.trim();
      if (data.section) existing.section = data.section.toUpperCase().trim();
      if (data.semester !== undefined) existing.semester = parseInt(data.semester) || existing.semester;
      if (data.batch) existing.batch = data.batch.trim();
      if (data.admissionNumber) existing.admissionNumber = data.admissionNumber.trim();
      if (data.status) existing.status = data.status;

      // Additional information
      if (data.skills !== undefined) existing.skills = data.skills;
      if (data.interests !== undefined) existing.interests = data.interests;
      if (data.bio !== undefined) existing.bio = data.bio;
      if (data.github !== undefined) existing.github = data.github;
      if (data.linkedin !== undefined) existing.linkedin = data.linkedin;
      if (data.portfolio !== undefined) existing.portfolio = data.portfolio;

      // Guardian information
      if (data.guardian) existing.guardian = { ...existing.guardian, ...data.guardian };

      // Role must strictly remain STUDENT (Section 10)
      existing.role = "STUDENT";
      existing.updatedAt = new Date().toISOString();

      students[index] = existing;
      saveStudents(students);

      // Audit Logs
      addAuditLog(auth.userId || 'usr-hod-01', 'EDIT_STUDENT', existing._id, `HOD updated student: ${existing.name} (${existing.usn})`);
      if (data.section && data.section.toUpperCase().trim() !== oldSection) {
        addAuditLog(auth.userId || 'usr-hod-01', 'CHANGE_SECTION', existing._id, `Changed section for ${existing.name} from ${oldSection} to ${existing.section}`);
      }
      if (data.department && data.department.trim() !== oldDept) {
        addAuditLog(auth.userId || 'usr-hod-01', 'CHANGE_DEPARTMENT', existing._id, `Changed department for ${existing.name} from ${oldDept} to ${existing.department}`);
      }

      return sendJSON(res, 200, {
        success: true,
        message: "Student updated successfully.",
        student: existing
      });
    } catch (err) {
      console.error('Error updating student:', err);
      return sendJSON(res, 500, { error: "Failed to update student record." });
    }
  }

  // 17. PATCH /api/students/:id/status (Activate / Deactivate / Graduate - Section 18)
  const studentStatusMatch = pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)\/status$/);
  if (studentStatusMatch && req.method === 'PATCH') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    const id = studentStatusMatch[1];
    const students = readStudents();
    const index = students.findIndex(s => s._id === id || s.studentId === id || s.usn === id);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Student not found." });
    }

    try {
      const data = await parseBody(req);
      const validStatuses = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'TRANSFERRED'];
      const newStatus = (data.status || 'ACTIVE').toUpperCase();

      if (!validStatuses.includes(newStatus)) {
        return sendJSON(res, 400, { error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
      }

      const student = students[index];
      student.status = newStatus;
      student.updatedAt = new Date().toISOString();
      students[index] = student;
      saveStudents(students);

      const action = newStatus === 'ACTIVE' ? 'ACTIVATE_STUDENT' : newStatus === 'GRADUATED' ? 'GRADUATE_STUDENT' : 'DEACTIVATE_STUDENT';
      addAuditLog(auth.userId || 'usr-hod-01', action, student._id, `Changed status to ${newStatus} for student: ${student.name} (${student.usn})`);

      return sendJSON(res, 200, {
        success: true,
        message: `Student status updated to ${newStatus}.`,
        student
      });
    } catch (err) {
      console.error('Error updating student status:', err);
      return sendJSON(res, 500, { error: "Failed to update student status." });
    }
  }

  // 18. PATCH /api/students/:id/semester (Promote Student - Section 16 & 17)
  const studentSemMatch = pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)\/semester$/);
  if (studentSemMatch && req.method === 'PATCH') {
    const auth = extractAuth(req);
    if (!['HOD', 'ADMIN'].includes(auth.role)) {
      return sendJSON(res, 403, { error: "You do not have permission to manage students." });
    }

    const id = studentSemMatch[1];
    const students = readStudents();
    const index = students.findIndex(s => s._id === id || s.studentId === id || s.usn === id);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Student not found." });
    }

    try {
      const data = await parseBody(req);
      const student = students[index];
      const currentSem = parseInt(student.semester) || 1;
      const nextSem = data.targetSemester !== undefined ? parseInt(data.targetSemester) : (currentSem + 1);

      const now = new Date().toISOString();

      if (nextSem > 8) {
        student.status = 'GRADUATED';
        student.semester = 8;
        student.updatedAt = now;
      } else {
        student.semester = nextSem;
        student.updatedAt = now;
      }

      students[index] = student;
      saveStudents(students);

      // Append new Semester History (Preserving previous historical records!)
      const history = readSemesterHistory();
      if (nextSem <= 8) {
        history.unshift({
          _id: generateObjectId(),
          studentId: student._id,
          usn: student.usn,
          studentName: student.name,
          semester: nextSem,
          academicYear: '2024-2025',
          department: student.department,
          section: student.section,
          subjects: DEFAULT_SEMESTER_COURSES[nextSem] || DEFAULT_SEMESTER_COURSES[1],
          attendance: 90,
          internalMarks: { ia1: 0, ia2: 0, assignment: 0, total: 0 },
          examinationRecords: { grade: 'Pending', sgpa: 'Pending', resultStatus: 'IN_PROGRESS' },
          createdAt: now
        });
        saveSemesterHistory(history);
      }

      addAuditLog(auth.userId || 'usr-hod-01', 'PROMOTE_STUDENT', student._id, `Promoted student ${student.name} (${student.usn}) from Semester ${currentSem} to ${nextSem > 8 ? 'GRADUATED' : 'Semester ' + nextSem}`);

      return sendJSON(res, 200, {
        success: true,
        message: nextSem > 8 ? `Student ${student.name} marked as GRADUATED.` : `Student ${student.name} promoted to ${nextSem}th Semester.`,
        student
      });
    } catch (err) {
      console.error('Error promoting student:', err);
      return sendJSON(res, 500, { error: "Failed to promote student." });
    }
  }

  // ==========================================================
  // STATIC FILE SERVING WITH SPA FALLBACK
  // ==========================================================
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        // Fallback to index.html for SPA client-side routing
        fs.readFile(path.join(__dirname, 'index.html'), (spaErr, spaContent) => {
          if (spaErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(spaContent);
          }
        });
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🎓 SmartDept / CampusConnect Academic ERP running at http://localhost:${PORT}`);
  console.log(`📧 Configured College Email Domain: ${COLLEGE_EMAIL_DOMAIN}`);
});
