import api from "./api";

export const getScannerStatus = async () => {
  const response = await api.get("/biometric/status");
  return response.data;
};

export const getStudentBiometricStatus = async (studentId) => {
  const response = await api.get(`/biometric/status/${studentId}`);
  return response.data;
};

export const registerBiometric = async (studentId, biometricToken = null) => {
  const payload = biometricToken ? { biometric_token: biometricToken } : {};
  const response = await api.post(`/biometric/register/${studentId}`, payload);
  return response.data;
};

export const verifyBiometric = async ({
  timetableId,
  studentId = null,
  studentCode = null,
  biometricToken = null,
  latitude = null,
  longitude = null,
  durationNumber = null,
  intervalId = null,
  bypassLocation = false,
}) => {
  const response = await api.post("/biometric/verify", {
    timetable_id: timetableId,
    student_id: studentId,
    student_code: studentCode,
    biometric_token: biometricToken,
    latitude,
    longitude,
    duration_number: durationNumber,
    interval_id: intervalId,
    bypass_location: bypassLocation,
  });
  return response.data;
};

export default {
  getScannerStatus,
  getStudentBiometricStatus,
  registerBiometric,
  verifyBiometric,
};
