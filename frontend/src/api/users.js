import api from "./axios";

export const usersApi = {
  getAll: async (params = {}) => {
    return api.get("/api/users", { params });
  },

  getById: async (id) => {
    return api.get(`/api/users/${id}`);
  },

  create: async (data) => {
    return api.post("/api/users", data);
  },

  update: async (id, data) => {
    return api.put(`/api/users/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/users/${id}`);
  },

  approve: async (id, statusData) => {
    // statusData: { status: 'Approved' | 'Rejected' | 'Suspended', reason?: string }
    return api.put(`/api/users/${id}/approve`, statusData);
  },
};

export default usersApi;
