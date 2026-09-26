import api from "./axios";

export const noticesApi = {
  getAll: async (params = {}) => {
    return api.get("/api/notices", { params });
  },

  getById: async (id) => {
    return api.get(`/api/notices/${id}`);
  },

  create: async (data) => {
    return api.post("/api/notices", data);
  },

  update: async (id, data) => {
    return api.put(`/api/notices/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/notices/${id}`);
  },
};

export default noticesApi;
