import axios from "axios";

export const getMyIAMarks = async () => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const baseURL =
    typeof window !== "undefined" && window.location.port === "5173"
      ? "http://localhost:8000"
      : "";

  return axios.get(`${baseURL}/api/marks/my`, { headers });
};

export default {
  getMyIAMarks,
};

