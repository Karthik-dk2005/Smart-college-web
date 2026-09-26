import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT access token to every request if available
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

// Response interceptor to format clean error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional auto-logout on unauthorized
      console.warn("Session expired or unauthorized request");
    }
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";
    error.formattedMessage = message;
    return Promise.reject(error);
  }
);

export default api;
