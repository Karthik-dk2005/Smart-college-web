import api from "./axios";

export const teachersApi = {
  getAll: async (params = {}) => {
    return api.get("/api/teachers", { params });
  },

  getById: async (id) => {
    return api.get(`/api/teachers/${id}`);
  },

  create: async (data) => {
    return api.post("/api/teachers", data);
  },

  update: async (id, data) => {
    return api.put(`/api/teachers/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/teachers/${id}`);
  },
};

export default teachersApi;
