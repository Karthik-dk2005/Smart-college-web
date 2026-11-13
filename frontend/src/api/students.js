import api from "./axios";

export const studentsApi = {
  getAll: async (params = {}) => {
    return api.get("/api/students", { params });
  },

  getById: async (idOrUsn) => {
    return api.get(`/api/students/${encodeURIComponent(idOrUsn)}`);
  },

  getByUsn: async (usn) => {
    return api.get(`/api/students/${encodeURIComponent(usn)}`);
  },

  search: async (query) => {
    return api.get("/api/students/search", { params: { query } });
  },

  create: async (data) => {
    return api.post("/api/students", data);
  },

  update: async (idOrUsn, data) => {
    return api.put(`/api/students/${encodeURIComponent(idOrUsn)}`, data);
  },

  delete: async (idOrUsn) => {
    return api.delete(`/api/students/${encodeURIComponent(idOrUsn)}`);
  },

  bulkImport: async (data) => {
    return api.post("/api/students/bulk-import", data);
  },

  importFromPdf: async () => {
    return api.post("/api/students/import-from-pdf");
  },
};

export default studentsApi;
