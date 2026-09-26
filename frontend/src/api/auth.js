import api from "./axios";

export const authApi = {
  login: async (email, password) => {
    return api.post("/api/auth/login", { email, password });
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

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },
};

export default authApi;
