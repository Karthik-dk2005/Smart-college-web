import api from "./axios";

export const timetableApi = {
  getAll: async (params = {}) => {
    return api.get("/api/timetable", { params });
  },

  getToday: async (params = {}) => {
    return api.get("/api/timetable/today", { params });
  },

  getTeacherToday: async (params = {}) => {
    return api.get("/api/timetable/teacher/today", { params });
  },

  getStudent: async () => {
    return api.get("/api/timetable/student");
  },

  getTeacher: async () => {
    return api.get("/api/timetable/teacher");
  },

  getById: async (id) => {
    return api.get(`/api/timetable/${id}`);
  },

  create: async (data) => {
    return api.post("/api/timetable", data);
  },

  update: async (id, data) => {
    return api.put(`/api/timetable/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/timetable/${id}`);
  },
};

export default timetableApi;
