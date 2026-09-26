import api from "./axios";

export const facultyApi = {
  getAll: async (params = {}) => {
    return api.get("/api/faculty", { params });
  },

  getById: async (id) => {
    return api.get(`/api/faculty/${id}`);
  },

  create: async (data) => {
    return api.post("/api/faculty", data);
  },

  update: async (id, data) => {
    return api.put(`/api/faculty/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/faculty/${id}`);
  },
};

export default facultyApi;
