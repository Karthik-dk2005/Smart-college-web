// Type definitions & Interfaces for CampusConnect Biometric Service
// Defines contracts for Face Recognition and Simulated Biometric Scanner integration.

export type FaceVerificationState = 
  | 'Waiting'
  | 'Camera permission required'
  | 'Detecting'
  | 'Face detected'
  | 'Verifying'
  | 'Face verification successful'
  | 'Face verification failed';

export type FingerprintVerificationState = 
  | 'Waiting'
  | 'Scanner required'
  | 'Scanning'
  | 'Verifying'
  | 'Fingerprint verified'
  | 'Fingerprint verification failed';

export type AttendanceVerificationState = 
  | 'Session unavailable'
  | 'Attendance window closed'
  | 'Verification required'
  | 'Verification successful'
  | 'Attendance recorded'
  | 'Already marked';

export interface FaceVerificationOptions {
  studentId: string;
  studentName?: string;
  sessionId: string;
  videoElement?: HTMLVideoElement | null;
  canvasElement?: HTMLCanvasElement | null;
}

export interface FingerprintVerificationOptions {
  studentId: string;
  studentName?: string;
  sessionId: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  status: string;
  token?: string;
  confidence?: number;
  minutiaeQuality?: number;
  timestamp: string;
  note?: string;
}

export interface IBiometricService {
  initializeFaceVerification(videoElement?: HTMLVideoElement): Promise<{ success: boolean; cameraAvailable: boolean; error?: string }>;
  stopFaceCamera(): void;
  verifyFace(options: FaceVerificationOptions): Promise<BiometricVerificationResult>;
  initializeFingerprintVerification(): { success: boolean; mode: string; deviceModel: string; status: string };
  verifyFingerprint(options: FingerprintVerificationOptions): Promise<BiometricVerificationResult>;
  getVerificationStatus(studentId: string, sessionId: string): { faceVerified: boolean; fingerprintVerified: boolean; completed: boolean };
}
