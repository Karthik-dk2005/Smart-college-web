import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? "http://localhost:8000" : "");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format responses & handle session expiry
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const newToken = res.data?.data?.access_token || res.data?.access_token;
          if (newToken) {
            localStorage.setItem("token", newToken);
            localStorage.setItem("auth_token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest).then((r) => r.data);
          }
        } catch (refreshErr) {
          // Token refresh failed - clear tokens
          localStorage.removeItem("token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "An unexpected server error occurred";

    return Promise.reject(new Error(message));
  }
);

export default api;
export { baseURL };
