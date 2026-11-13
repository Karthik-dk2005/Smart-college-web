import api from "./axios";

export const studentAuthApi = {
  verifyUsn: async (usn) => {
    const res = await api.get(`/api/auth/student/verify-usn/${encodeURIComponent(usn)}`);
    return res.data;
  },

  register: async (usn, gmail) => {
    const res = await api.post("/api/auth/student/register", { usn, gmail });
    return res.data;
  },

  resendOtp: async (usn) => {
    const res = await api.post("/api/auth/student/resend-otp", { usn });
    return res.data;
  },

  verifyEmail: async (payload) => {
    const res = await api.post("/api/auth/student/verify-email", payload);
    return res.data;
  },

  login: async (identifier, password) => {
    const res = await api.post("/api/auth/student/login", { identifier, password });
    return res.data;
  },
};

export default studentAuthApi;

