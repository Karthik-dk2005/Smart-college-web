// CampusConnect Service Layer - Decoupled REST/Mock API Interfaces
// Fully implements services: auth, timetable, room, session, attendance, exam, marks,
// assignment, material, notice, bus, helpdesk, report, audit, and aiAssistant.

const getDB = () => window.masterDB.db;
const saveDB = (db) => window.masterDB.saveDatabase(db);

// 1. Auth Service
const authService = {
  loginWithCollegeEmail: async (email, password) => {
    const db = getDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Check college domain (@college.edu, @campus.edu, @mitt.ac.in, etc.)
    const isCollegeDomain = cleanEmail.endsWith('@college.edu') || 
      cleanEmail.endsWith('@campus.edu') || 
      cleanEmail.endsWith('.edu') || 
      cleanEmail.endsWith('@mitt.ac.in') || 
      cleanEmail.endsWith('.ac.in');
    if (!isCollegeDomain) {
      return {
        success: false,
        error: `Restricted Access: "${cleanEmail}" does not belong to authorized institutional domains (@mitt.ac.in or @college.edu).`
      };
    }

    const matchedUser = db.users.find(u => u.email.toLowerCase() === cleanEmail || (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail));
    if (matchedUser) {
      auditService.logEvent(matchedUser.name, matchedUser.role, 'LOGIN_SUCCESS', 'Auth', 'User logged in via college credentials');
      return { success: true, user: matchedUser };
    }

    // Default demo account auto-match
    if (cleanEmail.includes('student')) {
      return { success: true, user: db.users.find(u => u.role === 'Student') };
    } else if (cleanEmail.includes('teacher')) {
      return { success: true, user: db.users.find(u => u.role === 'Teacher') };
    } else if (cleanEmail.includes('hod')) {
      return { success: true, user: db.users.find(u => u.role === 'HOD') };
    } else if (cleanEmail.includes('admin')) {
      return { success: true, user: db.users.find(u => u.role === 'Admin') };
    }

    return { success: false, error: 'Invalid college credentials or user record not found.' };
  },

  getDemoAccounts: () => [
    { role: 'Student', email: 'amulya.h.s@mitt.ac.in', name: 'AMULYA H S (4MN24CS007 - 5th Sem A)' },
    { role: 'Student', email: 'abhilash.kumar.k@mitt.ac.in', name: 'ABHILASH KUMAR K (4MN24CS002 - 5th Sem B)' },
    { role: 'Student', email: 'dhanushree.d@mitt.ac.in', name: 'DHANUSHREE D (Diploma Lateral - 5th Sem A)' },
    { role: 'Student', email: 'student@college.edu', name: 'Aarav Sharma (21CS042 - Sem 6)' },
    { role: 'Teacher', email: 'teacher@college.edu', name: 'Prof. Ananya Iyer (Dept of CSE)' },
    { role: 'HOD', email: 'hod@college.edu', name: 'Dr. Vikramaditya Sen (HOD CSE)' },
    { role: 'Admin', email: 'admin@college.edu', name: 'Dr. Robert Hawthorne (Registrar)' }
  ]
};

// 2. Timetable & Room Service (Requirements 18 - 25)
const timetableService = {
  getTimetable: async (dept, semester, section) => {
    const db = getDB();
    return db.timetable.filter(t => 
      (!dept || t.dept === dept) && 
      (!semester || t.semester === Number(semester)) && 
      (!section || t.section === section)
    );
  },

  getDynamicChanges: async () => {
    const db = getDB();
    return db.dynamicTimetableChanges || [];
  },

  requestTimetableChange: async (changePayload) => {
    const db = getDB();
    const newChange = {
      id: 'dtc-' + Date.now(),
      status: 'Approved', // Auto-approved or pending HOD
      notified: true,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ...changePayload
    };

    db.dynamicTimetableChanges.unshift(newChange);

    // Create a broadcast notification
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      type: 'Timetable Change',
      title: `Timetable Alert: ${newChange.subjectCode} (${newChange.changeType})`,
      message: `${newChange.subjectCode} has changed: ${newChange.oldValue} -> ${newChange.newValue}. Reason: ${newChange.reason}`,
      timestamp: newChange.timestamp,
      read: false,
      role: 'Student'
    });

    auditService.logEvent(changePayload.changedBy || 'System', 'Faculty', 'TIMETABLE_CHANGE_REQUESTED', 'Timetable', `Changed ${changePayload.subjectCode} to ${changePayload.newValue}`);
    saveDB(db);
    return newChange;
  }
};

// 3. Room Management & Conflict Detection Service (Requirements 23 - 25)
const roomService = {
  getRooms: async () => {
    const db = getDB();
    return db.rooms;
  },

  checkRoomConflict: (roomNumber, day, timeSlot) => {
    const db = getDB();
    const existing = db.timetable.find(t => t.room === roomNumber && t.day === day && t.timeSlot === timeSlot);
    if (existing) {
      return {
        conflict: true,
        conflictingClass: existing,
        message: `ROOM CONFLICT DETECTED: Room ${roomNumber} is already occupied by ${existing.subjectCode} (${existing.subjectName}) taught by ${existing.teacherName} on ${day} at ${timeSlot}.`
      };
    }
    return { conflict: false };
  },

  updateRoomStatus: async (roomId, newStatus) => {
    const db = getDB();
    const rm = db.rooms.find(r => r.id === roomId);
    if (rm) {
      const old = rm.status;
      rm.status = newStatus;
      auditService.logEvent('Admin / Facilities', 'Admin', 'ROOM_STATUS_CHANGE', 'Rooms', `Changed ${rm.number} from ${old} to ${newStatus}`);
      saveDB(db);
      return true;
    }
    return false;
  }
};

// 4. Session Engine Service (Requirements 26 & 27)
const sessionService = {
  getSessions: async () => {
    const db = getDB();
    return db.sessions;
  },

  startClassSession: async (sessionPayload) => {
    const db = getDB();
    const sessionId = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${sessionPayload.subjectCode}-${Math.floor(100 + Math.random() * 900)}`;
    const newSession = {
      sessionId,
      status: 'Attendance Active',
      date: new Date().toISOString().slice(0, 10),
      attendanceCount: 0,
      totalEnrolled: 45,
      ...sessionPayload
    };
    db.sessions.unshift(newSession);

    // Notify students that live session is open for attendance
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      type: 'Session Alert',
      title: `Live Session Active: ${newSession.subjectCode}`,
      message: `${newSession.teacherName} has opened attendance register for session ${sessionId} (${newSession.room}).`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
      role: 'Student'
    });

    auditService.logEvent(newSession.teacherName, 'Teacher', 'SESSION_STARTED', 'Session Engine', `Started session ${sessionId}`);
    saveDB(db);
    return newSession;
  },

  closeSession: async (sessionId) => {
    const db = getDB();
    const sess = db.sessions.find(s => s.sessionId === sessionId);
    if (sess) {
      sess.status = 'Completed';
      saveDB(db);
      return true;
    }
    return false;
  }
};

// 5. Attendance Service (Requirements 28 - 34)
const attendanceService = {
  getStudentAttendanceSummary: async (studentId) => {
    const db = getDB();
    return db.studentSubjectAttendance[studentId] || db.studentSubjectAttendance['usr-std-01'] || [];
  },

  getStudentAttendanceHistory: async (studentId) => {
    const db = getDB();
    return db.attendanceRecords.filter(r => r.studentId === studentId);
  },

  recordSessionAttendance: async (sessionId, attendanceMap, teacherName) => {
    const db = getDB();
    const sess = db.sessions.find(s => s.sessionId === sessionId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    let presentCount = 0;
    Object.keys(attendanceMap).forEach(studentId => {
      const status = attendanceMap[studentId]; // 'Present' | 'Absent' | 'Late'
      if (status === 'Present' || status === 'Late') presentCount++;

      const student = db.users.find(u => u.id === studentId);
      db.attendanceRecords.unshift({
        id: 'att-' + Date.now() + '-' + studentId,
        sessionId,
        studentId,
        studentName: student ? student.name : studentId,
        rollNo: student ? student.rollNo : 'N/A',
        subjectCode: sess ? sess.subjectCode : 'CS601',
        date: sess ? sess.date : new Date().toISOString().slice(0, 10),
        status,
        timestamp: status !== 'Absent' ? now : null,
        locationVerified: true,
        deviceVerified: true,
        biometricStatus: 'Available'
      });
    });

    if (sess) {
      sess.attendanceCount = presentCount;
      sess.status = 'Completed';
    }

    auditService.logEvent(teacherName || 'Teacher', 'Teacher', 'ATTENDANCE_RECORDED', 'Attendance', `Recorded attendance for ${sessionId} (${presentCount} present)`);
    saveDB(db);
    return { success: true, presentCount };
  }
};

// 6. Examination Service (Requirements 35 - 37)
const examService = {
  getExams: async () => {
    const db = getDB();
    return db.exams;
  },

  getSeatingArrangements: async (examId, studentId) => {
    const db = getDB();
    if (studentId) {
      return db.seatingArrangements.filter(s => s.studentId === studentId);
    }
    return db.seatingArrangements.filter(s => !examId || s.examId === examId);
  },

  scheduleExam: async (examPayload) => {
    const db = getDB();
    const newExam = {
      id: 'ex-' + Date.now(),
      ...examPayload
    };
    db.exams.push(newExam);
    saveDB(db);
    return newExam;
  }
};

// 7. Internal Marks Service (Requirements 38 - 42)
const marksService = {
  getStudentMarks: async (studentId) => {
    const db = getDB();
    return db.internalMarks[studentId] || db.internalMarks['usr-std-01'] || [];
  },

  updateMarksDraft: async (studentId, subjectCode, scores, teacherName) => {
    const db = getDB();
    if (!db.internalMarks[studentId]) db.internalMarks[studentId] = [];
    const list = db.internalMarks[studentId];
    let record = list.find(m => m.subjectCode === subjectCode);

    const total = (Number(scores.ia1) || 0) + (Number(scores.ia2) || 0) + (Number(scores.assignment) || 0) + (Number(scores.quiz) || 0);
    let grade = 'F';
    if (total >= 54) grade = 'O';
    else if (total >= 48) grade = 'A+';
    else if (total >= 42) grade = 'A';
    else if (total >= 36) grade = 'B+';
    else if (total >= 30) grade = 'B';

    if (record) {
      // Audit entry if changed
      if (record.total !== total) {
        db.markAuditHistory.unshift({
          id: 'mah-' + Date.now(),
          subjectCode,
          studentRoll: studentId,
          assessment: 'Composite Marks',
          oldScore: record.total,
          newScore: total,
          reason: 'Faculty continuous assessment score adjustment',
          changedBy: teacherName,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16)
        });
      }

      record.ia1 = Number(scores.ia1);
      record.ia2 = Number(scores.ia2);
      record.assignment = Number(scores.assignment);
      record.quiz = Number(scores.quiz);
      record.total = total;
      record.grade = grade;
      record.status = scores.submitForApproval ? 'Submitted for Approval' : 'Draft';
    } else {
      list.push({
        subjectCode,
        subjectName: subjectCode,
        ia1: Number(scores.ia1),
        ia2: Number(scores.ia2),
        assignment: Number(scores.assignment),
        quiz: Number(scores.quiz),
        total,
        maxTotal: 60,
        grade,
        status: scores.submitForApproval ? 'Submitted for Approval' : 'Draft',
        verifiedBy: 'Pending HOD'
      });
    }

    saveDB(db);
    return true;
  },

  finalizeMarksByHOD: async (subjectCode, hodName) => {
    const db = getDB();
    Object.keys(db.internalMarks).forEach(sId => {
      const records = db.internalMarks[sId];
      const target = records.find(m => m.subjectCode === subjectCode);
      if (target) {
        target.status = 'FINALIZED';
        target.verifiedBy = `${hodName} (HOD Approved)`;
      }
    });

    auditService.logEvent(hodName, 'HOD', 'FINALIZE_MARKS', 'Internal Marks', `HOD finalized and locked internal marks for ${subjectCode}`);
    saveDB(db);
    return true;
  }
};

// 8. Assignments & Materials Service (Requirements 43 - 46)
const assignmentService = {
  getAssignments: async (dept, semester, section) => {
    const db = getDB();
    return db.assignments.filter(a => 
      (!semester || a.semester === Number(semester)) && 
      (!section || a.section === section)
    );
  },

  getStudentSubmissions: async (studentId) => {
    const db = getDB();
    return db.submissions[studentId] || db.submissions['usr-std-01'] || [];
  },

  createAssignment: async (payload) => {
    const db = getDB();
    const newAsg = {
      id: 'asg-' + Date.now(),
      totalSubmissions: 0,
      totalStudents: 45,
      ...payload
    };
    db.assignments.unshift(newAsg);
    saveDB(db);
    return newAsg;
  },

  submitAssignment: async (studentId, assignmentId, fileName) => {
    const db = getDB();
    if (!db.submissions[studentId]) db.submissions[studentId] = [];
    const asg = db.assignments.find(a => a.id === assignmentId);
    
    const sub = {
      assignmentId,
      title: asg ? asg.title : 'Assignment Submission',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      fileName,
      status: 'Submitted',
      scoreObtained: null,
      maxMarks: asg ? asg.maxMarks : 10,
      teacherFeedback: 'Received. Under instructor review.'
    };
    db.submissions[studentId].unshift(sub);
    if (asg) asg.totalSubmissions = (asg.totalSubmissions || 0) + 1;
    saveDB(db);
    return sub;
  }
};

// 9. Study Materials Service (Requirements 45 & 46)
const materialService = {
  getMaterials: async (subjectCode) => {
    const db = getDB();
    if (!subjectCode || subjectCode === 'All') return db.materials;
    return db.materials.filter(m => m.subjectCode === subjectCode);
  },

  uploadMaterial: async (materialPayload) => {
    const db = getDB();
    const newMat = {
      id: 'mat-' + Date.now(),
      uploadedDate: new Date().toISOString().slice(0, 10),
      ...materialPayload
    };
    db.materials.unshift(newMat);
    saveDB(db);
    return newMat;
  }
};

// 10. College Bus Service (Requirements 57 - 60)
const busService = {
  getBusRoutes: async () => {
    const db = getDB();
    return db.busRoutes;
  },

  postBusAlert: async (busNumber, alertMessage) => {
    const db = getDB();
    const bus = db.busRoutes.find(b => b.busNumber === busNumber);
    if (bus) {
      bus.activeAlert = alertMessage;
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        type: 'Bus Alert',
        title: `Bus Transit Advisory: ${busNumber}`,
        message: alertMessage,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        role: 'Student'
      });
      saveDB(db);
      return true;
    }
    return false;
  }
};

// 11. Notices & Notifications (Requirements 50 - 53)
const noticeService = {
  getNotices: async () => {
    const db = getDB();
    return db.notices;
  },

  getNotifications: async (role) => {
    const db = getDB();
    return db.notifications.filter(n => !role || n.role === role || n.role === 'All');
  },

  markNotificationRead: async (notifId) => {
    const db = getDB();
    const item = db.notifications.find(n => n.id === notifId);
    if (item) {
      item.read = true;
      saveDB(db);
      return true;
    }
    return false;
  },

  publishNotice: async (noticePayload) => {
    const db = getDB();
    const newNotice = {
      id: 'not-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...noticePayload
    };
    db.notices.unshift(newNotice);
    saveDB(db);
    return newNotice;
  }
};

// 11b. Events Service (Requirement 54)
const eventService = {
  getEvents: async () => {
    const db = getDB();
    return db.events || [];
  },
  createEvent: async (eventPayload) => {
    const db = getDB();
    const newEv = {
      id: 'ev-' + Date.now(),
      ...eventPayload
    };
    if (!db.events) db.events = [];
    db.events.unshift(newEv);
    saveDB(db);
    return newEv;
  }
};

// 12. Smart Student Features: What I Missed & Class Memory (Requirements 47 & 48)
const smartFeaturesService = {
  getWhatIMissed: async (studentId) => {
    const db = getDB();
    return db.whatIMissedRecords;
  },

  getClassMemory: async () => {
    const db = getDB();
    return db.classMemory;
  }
};

// 13. AI Department Assistant Service (Requirement 49)
const aiAssistantService = {
  askAssistant: async (query, userContext) => {
    const clean = (query || '').toLowerCase();
    const db = getDB();

    // Contextual answer synthesis based on department data
    if (clean.includes('next class') || clean.includes('room')) {
      const todayClasses = db.timetable.filter(t => t.day === 'Monday');
      const next = todayClasses[0] || { subjectName: 'Distributed Systems', room: 'TB-201', timeSlot: '09:00 - 10:00' };
      return {
        answer: `Your next lecture is **${next.subjectCode}: ${next.subjectName}** scheduled in **Room ${next.room}** from **${next.timeSlot}** with ${next.teacherName}.`,
        suggestedNext: ['Show today\'s timetable', 'What did I miss yesterday?']
      };
    }

    if (clean.includes('miss') || clean.includes('yesterday')) {
      return {
        answer: `On your last missed class (Sep 22, CS602 Machine Learning Applications with Prof. Divya Menon), the topic covered was **Transformer Attention Mechanism & Multi-Head Projections**. Homework: *Derive scaled dot-product attention gradient for Exercise 4*. You can download the attached handout under Study Materials.`,
        suggestedNext: ['Show study materials for CS602', 'When is my next exam?']
      };
    }

    if (clean.includes('exam') || clean.includes('internal')) {
      const firstExam = db.exams[0];
      return {
        answer: `Upcoming scheduled examination: **${firstExam.type} for ${firstExam.subjectCode} (${firstExam.subjectName})** on **${firstExam.date} (${firstExam.day})** at **${firstExam.startTime}** in **Room ${firstExam.room}**.`,
        suggestedNext: ['Show seating arrangement', 'When is my assignment due?']
      };
    }

    if (clean.includes('assignment') || clean.includes('due') || clean.includes('homework')) {
      const asg = db.assignments[0];
      return {
        answer: `You have an active deadline for **${asg.subjectCode}: ${asg.title}** due on **${asg.deadline}**. Maximum score: ${asg.maxMarks} marks.`,
        suggestedNext: ['Go to Assignments tab', 'Show today\'s timetable']
      };
    }

    if (clean.includes('bus') || clean.includes('route')) {
      const bus = db.busRoutes[0];
      return {
        answer: `Your assigned transport is **${bus.busNumber} (${bus.routeNumber} - ${bus.routeName})**. Morning departure: ${bus.morningDeparture} from City Center. Driver: ${bus.driverName} (${bus.driverPhone}). Current advisory: *${bus.activeAlert || 'On schedule'}*.`,
        suggestedNext: ['View all bus routes', 'What is my next class?']
      };
    }

    if (clean.includes('timetable') || clean.includes('schedule')) {
      return {
        answer: `Today's Monday timetable for CSE Sem 6 Sec A:\n1. 09:00 - CS601 Distributed Systems (TB-201)\n2. 10:00 - CS602 Machine Learning (TB-203)\n3. 11:15 - CS604 Compiler Design (Turing Audi)\n4. 13:30 - CS605 Lab (CS-Lab 3).`,
        suggestedNext: ['What room is my next class in?', 'When is my next exam?']
      };
    }

    // Default academic assistant fallback
    return {
      answer: `Hello! I am your CampusConnect AI Department Assistant. I can answer questions about your next class, room locations, what you missed when absent, upcoming internal assessment exams, assignment deadlines, or college bus schedules.`,
      suggestedNext: ['What is my next class?', 'What did I miss yesterday?', 'When is my next exam?', 'When is my assignment due?', 'What bus route do I take?']
    };
  }
};

// 14. Helpdesk & Feedback Service (Requirements 55 & 56)
const helpdeskService = {
  getTickets: async (studentId) => {
    const db = getDB();
    return db.helpdeskTickets.filter(t => !studentId || t.studentId === studentId);
  },

  createTicket: async (ticketPayload) => {
    const db = getDB();
    const newTicket = {
      id: 'TICK-' + Math.floor(1000 + Math.random() * 9000),
      createdDate: new Date().toISOString().slice(0, 10),
      status: 'Open',
      assignedTo: 'Department Secretariat',
      response: 'Ticket logged. Awaiting staff review.',
      ...ticketPayload
    };
    db.helpdeskTickets.unshift(newTicket);
    saveDB(db);
    return newTicket;
  },

  submitFeedback: async (feedbackPayload) => {
    const db = getDB();
    const newFb = {
      id: 'fb-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...feedbackPayload
    };
    db.feedbackSubmissions.unshift(newFb);
    saveDB(db);
    return newFb;
  }
};

// 15. Reports & Analytics Service (Requirements 68 & 69)
const reportService = {
  getDepartmentAnalytics: async (deptCode) => {
    const db = getDB();
    const dept = db.departments.find(d => d.code === deptCode) || db.departments[0];
    const students = db.users.filter(u => u.role === 'Student' && u.department === deptCode);
    const faculty = db.users.filter(u => u.role === 'Teacher' && u.department === deptCode);
    const lowAtt = students.filter(s => (s.overallAttendance || 85) < 75);

    return {
      department: dept,
      studentCount: dept.studentCount,
      facultyCount: dept.facultyCount,
      averageAttendance: 88.4,
      shortageCases: lowAtt.length,
      curriculumProgress: 88.2,
      activeSessionsToday: 6,
      labCapacityUtilization: '82%'
    };
  }
};

// 16. Audit Service (Requirement 70)
const auditService = {
  getAuditLogs: async () => {
    const db = getDB();
    return db.auditLogs;
  },

  logEvent: (user, role, action, module, detail) => {
    try {
      const db = getDB();
      db.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        user: user || 'Active Session',
        role: role || 'System',
        action,
        module,
        dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        oldValue: 'Previous State',
        newValue: detail,
        reason: 'Automated Transaction Validation'
      });
      saveDB(db);
    } catch (e) {
      console.error('Audit logging error', e);
    }
  }
};

// Register all services globally for clean modular React access
window.CampusServices = {
  authService,
  timetableService,
  roomService,
  sessionService,
  attendanceService,
  examService,
  marksService,
  assignmentService,
  materialService,
  busService,
  noticeService,
  eventService,
  smartFeaturesService,
  aiAssistantService,
  helpdeskService,
  reportService,
  auditService
};

window.authService = authService;
window.timetableService = timetableService;
window.roomService = roomService;
window.sessionService = sessionService;
window.attendanceService = attendanceService;
window.examService = examService;
window.marksService = marksService;
window.assignmentService = assignmentService;
window.materialService = materialService;
window.busService = busService;
window.noticeService = noticeService;
window.eventService = eventService;
window.smartFeaturesService = smartFeaturesService;
window.aiAssistantService = aiAssistantService;
window.helpdeskService = helpdeskService;
window.reportService = reportService;
window.auditService = auditService;
