import api from "./axios";

export const biometricApi = {
  getStatus: async () => {
    return api.get("/api/biometric/status");
  },

  getStudentStatus: async (studentId) => {
    return api.get(`/api/biometric/status/${studentId}`);
  },

  registerBiometric: async (studentId, biometricToken = null) => {
    const payload = biometricToken ? { biometric_token: biometricToken } : {};
    return api.post(`/api/biometric/register/${studentId}`, payload);
  },

  verifyBiometric: async (payload) => {
    return api.post("/api/biometric/verify", payload);
  },
};

export default biometricApi;
