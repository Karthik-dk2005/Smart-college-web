import api from "./axios";

export const roomsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/rooms", { params });
  },

  getById: async (id) => {
    return api.get(`/api/rooms/${id}`);
  },

  create: async (data) => {
    return api.post("/api/rooms", data);
  },

  update: async (id, data) => {
    return api.put(`/api/rooms/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/rooms/${id}`);
  },
};

export default roomsApi;
