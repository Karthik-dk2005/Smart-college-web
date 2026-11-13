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

  forgotPassword: async (email) => {
    return api.post("/api/auth/forgot-password", { email });
  },

  resetPassword: async ({ token, new_password, confirm_password }) => {
    return api.post("/api/auth/reset-password", {
      token,
      new_password,
      confirm_password,
    });
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
