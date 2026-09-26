import api from "./axios";

export const subjectsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/subjects", { params });
  },

  getById: async (id) => {
    return api.get(`/api/subjects/${id}`);
  },

  create: async (data) => {
    return api.post("/api/subjects", data);
  },

  update: async (id, data) => {
    return api.put(`/api/subjects/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/subjects/${id}`);
  },
};

export default subjectsApi;
