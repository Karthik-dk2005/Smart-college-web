import api from "./axios";

export const notificationsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/notifications", { params });
  },

  getUnreadCount: async () => {
    return api.get("/api/notifications/unread-count");
  },

  getHistory: async (params = {}) => {
    return api.get("/api/notifications/history", { params });
  },

  markRead: async (id) => {
    return api.put(`/api/notifications/${id}/read`);
  },

  markAllRead: async () => {
    return api.put("/api/notifications/read-all");
  },

  delete: async (id) => {
    return api.delete(`/api/notifications/${id}`);
  },

  sendCustom: async (data) => {
    return api.post("/api/notifications/send", data);
  },

  testSmtp: async (data = {}) => {
    return api.post("/api/notifications/test-smtp", data);
  },

  getPreferences: async () => {
    return api.get("/api/notifications/preferences");
  },

  updatePreferences: async (data) => {
    return api.put("/api/notifications/preferences", data);
  },

  create: async (data) => {
    return api.post("/api/notifications", data);
  },
};

export default notificationsApi;
