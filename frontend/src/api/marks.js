import api, { baseURL } from "./axios";

export const marksApi = {
  getMarks: (params = {}) => api.get("/api/marks", { params }),
  getDashboard: (params = {}) => api.get("/api/marks/dashboard", { params }),
  getStudentWiseMarks: (params = {}) => api.get("/api/marks/student-wise", { params }),
  getMyMarks: (usn = null) => api.get("/api/marks/my", { params: usn ? { usn } : {} }),
  getStudentMarks: (usnOrId) => api.get(`/api/marks/student/${usnOrId}`),
  updateMark: (id, payload) => api.put(`/api/marks/${id}`, payload),
  createMark: (payload) => api.post("/api/marks", payload),
  importPdf: (formData) =>
    api.post("/api/marks/import-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getExportUrl: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    const base = baseURL || "";
    return `${base}/api/marks/export?${searchParams}`;
  },
};

export default marksApi;

