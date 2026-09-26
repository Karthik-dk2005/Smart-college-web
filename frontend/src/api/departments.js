import api from "./axios";

export const departmentsApi = {
  getAll: async () => {
    return api.get("/api/departments");
  },

  getById: async (id) => {
    return api.get(`/api/departments/${id}`);
  },

  create: async (data) => {
    return api.post("/api/departments", data);
  },

  update: async (id, data) => {
    return api.put(`/api/departments/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/departments/${id}`);
  },
};

export default departmentsApi;
