import api from "./axios";

export const announcementsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/announcements", { params });
  },

  getById: async (id) => {
    return api.get(`/api/announcements/${id}`);
  },

  create: async (data) => {
    return api.post("/api/announcements", data);
  },

  update: async (id, data) => {
    return api.put(`/api/announcements/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/announcements/${id}`);
  },
};

export default announcementsApi;
