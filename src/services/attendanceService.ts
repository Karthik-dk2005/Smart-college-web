// Data Models and Contract for Attendance Verification & Record Service

export interface AttendanceRecord {
  attendanceId: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  usn?: string;
  subject?: string;
  subjectCode?: string;
  teacher?: string;
  room?: string;
  date: string;
  time: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  faceVerified: boolean;
  fingerprintVerified: boolean;
  verificationMethod: string;
  verificationReference: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  overallPercentage: number;
  totalClasses: number;
  present: number;
  absent: number;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    total: number;
    attended: number;
    percentage: number;
  }>;
}

export interface TeacherSessionRosterResult {
  session: any;
  roster: Array<{
    studentId: string;
    rawStudentId: string;
    name: string;
    section: string;
    usn?: string;
    studentType: string;
    faceVerified: boolean;
    fingerprintVerified: boolean;
    attendance: 'PRESENT' | 'ABSENT';
    time: string;
    verificationReference?: string | null;
  }>;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number | string;
}

export interface IAttendanceService {
  recordVerifiedAttendance(payload: any): Promise<{ success: boolean; alreadyMarked: boolean; record: AttendanceRecord; message: string }>;
  checkIfAlreadyMarked(studentId: string, sessionId: string): Promise<AttendanceRecord | null>;
  getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary>;
  getStudentAttendanceHistory(studentId: string, filter?: any): Promise<AttendanceRecord[]>;
  getTeacherSessionRoster(sessionId: string, filter?: any): Promise<TeacherSessionRosterResult>;
}
