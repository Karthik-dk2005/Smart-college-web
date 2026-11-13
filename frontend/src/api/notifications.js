import api from "./axios";

export const notificationsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/notifications", { params });
  },

  markRead: async (id) => {
    return api.put(`/api/notifications/${id}/read`);
  },

  markAllRead: async () => {
    return api.put("/api/notifications/read-all");
  },

  create: async (data) => {
    return api.post("/api/notifications", data);
  },
};

export default notificationsApi;
