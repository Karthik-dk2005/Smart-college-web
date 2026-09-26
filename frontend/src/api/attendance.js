import api from "./axios";

export const attendanceApi = {
  // Strict Timetable Session Endpoints
  getSession: async (timetableId, date) => {
    return api.get(`/api/attendance/session/${timetableId}`, { params: { date } });
  },

  submitSession: async (timetableId, data) => {
    return api.post(`/api/attendance/session/${timetableId}`, data);
  },

  getConductedSessions: async (params = {}) => {
    return api.get("/api/attendance/sessions", { params });
  },

  getClassStudents: async (params = {}) => {
    return api.get("/api/students/class", { params });
  },

  getAll: async (params = {}) => {
    return api.get("/api/attendance", { params });
  },

  getById: async (id) => {
    return api.get(`/api/attendance/${id}`);
  },

  getByStudent: async (studentId) => {
    return api.get(`/api/attendance/student/${studentId}`);
  },

  getPercentage: async (studentId) => {
    return api.get(`/api/attendance/student/${studentId}`);
  },

  update: async (id, data) => {
    return api.put(`/api/attendance/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/attendance/${id}`);
  },
};

export default attendanceApi;
