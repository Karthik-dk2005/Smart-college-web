import api from "./axios";

export const authApi = {
  login: async (credentialsOrEmail, password, rememberMe = false) => {
    let payload;
    if (typeof credentialsOrEmail === "object" && credentialsOrEmail !== null) {
      payload = {
        username_or_email: credentialsOrEmail.username_or_email || credentialsOrEmail.email || credentialsOrEmail.username,
        password: credentialsOrEmail.password,
        remember_me: Boolean(credentialsOrEmail.remember_me),
      };
    } else {
      payload = {
        username_or_email: credentialsOrEmail,
        password,
        remember_me: Boolean(rememberMe),
      };
    }
    return api.post("/api/auth/login", payload);
  },

  register: async (userData) => {
    return api.post("/api/auth/register", userData);
  },

  refresh: async (refreshToken) => {
    return api.post("/api/auth/refresh", { refresh_token: refreshToken });
  },

  getMe: async () => {
    return api.get("/api/auth/me");
  },

  forgotPassword: async (identifierOrEmail) => {
    const payload = typeof identifierOrEmail === "object"
      ? identifierOrEmail
      : { identifier: identifierOrEmail, email: identifierOrEmail };
    return api.post("/api/auth/forgot-password", payload);
  },

  resetPassword: async (payload) => {
    return api.post("/api/auth/reset-password", payload);
  },

  sendOtp: async (email, purpose = "Registration") => {
    return api.post("/api/auth/send-otp", { email, purpose });
  },

  verifyOtp: async (email, otp) => {
    return api.post("/api/auth/verify-otp", { email, otp });
  },

  registerStudent: async (data) => {
    return api.post("/api/auth/register/student", data);
  },

  registerTeacher: async (data) => {
    return api.post("/api/auth/register/teacher", data);
  },

  registerHod: async (data) => {
    return api.post("/api/auth/register/hod", data);
  },

  getRegistrationRequests: async (params = {}) => {
    return api.get("/api/admin/registration-requests", { params });
  },

  approveRegistration: async (userId) => {
    return api.put(`/api/admin/approve-registration/${userId}`);
  },

  rejectRegistration: async (userId) => {
    return api.put(`/api/admin/reject-registration/${userId}`);
  },

  createAdmin: async (data) => {
    return api.post("/api/admin/create-admin", data);
  },

  toggleUserStatus: async (userId) => {
    return api.put(`/api/admin/toggle-user-status/${userId}`);
  },

  adminResetPassword: async (userId, new_password) => {
    return api.post(`/api/admin/reset-password/${userId}`, { new_password });
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      sessionStorage.clear();
    }
  },
};

export default authApi;
