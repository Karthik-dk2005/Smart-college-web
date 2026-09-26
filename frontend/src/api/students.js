import api from "./axios";

export const studentsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/students", { params });
  },

  getById: async (id) => {
    return api.get(`/api/students/${id}`);
  },

  create: async (data) => {
    return api.post("/api/students", data);
  },

  update: async (id, data) => {
    return api.put(`/api/students/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/students/${id}`);
  },
};

export default studentsApi;
