import api, { baseURL } from "./axios";

export const eventsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/events", { params });
  },

  getById: async (id) => {
    return api.get(`/api/events/${id}`);
  },

  create: async (data) => {
    return api.post("/api/events", data);
  },

  update: async (id, data) => {
    return api.put(`/api/events/${id}`, data);
  },

  delete: async (id, permanent = false) => {
    return api.delete(`/api/events/${id}`, { params: { permanent } });
  },

  register: async (id) => {
    return api.post(`/api/events/${id}/register`);
  },

  cancelRegistration: async (id, userId = null) => {
    const params = userId ? { user_id: userId } : {};
    return api.delete(`/api/events/${id}/register`, { params });
  },

  getParticipants: async (id) => {
    return api.get(`/api/events/${id}/participants`);
  },

  markAttendance: async (id, payload) => {
    return api.post(`/api/events/${id}/attendance`, payload);
  },

  getMyRegistrations: async () => {
    return api.get("/api/my-registrations");
  },

  getMyEvents: async () => {
    return api.get("/api/my-events");
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/events/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default eventsApi;
