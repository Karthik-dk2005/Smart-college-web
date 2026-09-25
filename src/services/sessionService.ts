// Data Models and Contract for AttendanceSession Service

export interface Student {
  studentId: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  email: string;
}

export interface AttendanceSession {
  sessionId: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  roomId: string;
  room?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendanceOpenTime: string;
  attendanceCloseTime: string;
  status: 'Attendance Active' | 'Completed' | 'Scheduled' | 'Closed';
  dept?: string;
  semester?: number;
  section?: string;
  topicCovered?: string;
  attendanceCount?: number;
  totalEnrolled?: number;
  windowForceOpen?: boolean;
}

export interface ISessionService {
  getAllSessions(filter?: Partial<AttendanceSession>): Promise<AttendanceSession[]>;
  getSessionById(sessionId: string): Promise<AttendanceSession | null>;
  getActiveSessionForStudent(student: Partial<Student>): Promise<AttendanceSession | null>;
  isAttendanceWindowOpen(session: AttendanceSession): boolean;
  toggleAttendanceWindow(sessionId: string, forceOpen?: boolean | null): Promise<boolean>;
  createSession(sessionPayload: Partial<AttendanceSession>): Promise<AttendanceSession>;
}
