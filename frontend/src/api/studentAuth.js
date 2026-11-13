import api from "./axios";

export const studentAuthApi = {
  // Check USN and auto-fetch student Name & registered Gmail as read-only
  checkUsn: async (usn) => {
    const res = await api.post("/api/auth/student/check-usn", { usn: usn.trim() });
    return res.data;
  },

  // Legacy GET check
  verifyUsn: async (usn) => {
    const res = await api.get(`/api/auth/student/verify-usn/${encodeURIComponent(usn.trim())}`);
    return res.data;
  },

  // Student enters USN, Password, Confirm Password -> sends OTP to registered Gmail
  register: async ({ usn, password, confirm_password }) => {
    const res = await api.post("/api/auth/student/register", {
      usn: usn.trim(),
      password,
      confirm_password,
    });
    return res.data;
  },

  // Verify OTP and complete registration
  verifyOtp: async (usn, otp) => {
    const res = await api.post("/api/auth/student/verify-otp", {
      usn: usn.trim(),
      otp: otp.trim(),
    });
    return res.data;
  },

  // Student login with USN and password
  login: async (usn, password) => {
    const res = await api.post("/api/auth/student/login", {
      usn: usn.trim(),
      password,
    });
    return res.data;
  },

  // Resend OTP
  resendOtp: async (usn) => {
    const res = await api.post("/api/auth/student/resend-otp", { usn: usn.trim() });
    return res.data;
  },

  // Get current logged-in student dashboard profile
  getProfile: async () => {
    const res = await api.get("/api/auth/student/profile");
    return res.data;
  },
};

export default studentAuthApi;
