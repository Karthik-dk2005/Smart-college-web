import api from "./axios";

export const adminStudentRegistrationApi = {
  getStats: async () => {
    const res = await api.get("/api/admin/student-registration/stats");
    return res.data;
  },

  getStudents: async (params = {}) => {
    const res = await api.get("/api/admin/student-registration/students", { params });
    return res.data;
  },

  updateGmail: async (usn, gmail) => {
    const res = await api.put(`/api/admin/student-registration/students/${encodeURIComponent(usn)}/gmail`, { gmail });
    return res.data;
  },

  approveStudent: async (usn) => {
    const res = await api.put(`/api/admin/student-registration/students/${encodeURIComponent(usn)}/approve`);
    return res.data;
  },

  rejectStudent: async (usn) => {
    const res = await api.put(`/api/admin/student-registration/students/${encodeURIComponent(usn)}/reject`);
    return res.data;
  },

  getUnmatched: async () => {
    const res = await api.get("/api/admin/student-registration/unmatched");
    return res.data;
  },

  resolveUnmatched: async (recordId, data) => {
    const res = await api.post(`/api/admin/student-registration/unmatched/${recordId}/resolve`, data);
    return res.data;
  },

  importExcel: async () => {
    const res = await api.post("/api/admin/student-registration/import-excel");
    return res.data;
  },

  importPdf: async () => {
    const res = await api.post("/api/admin/student-registration/import-pdf");
    return res.data;
  },

  resetPassword: async (usn, new_password) => {
    const res = await api.post(`/api/admin/student-registration/students/${encodeURIComponent(usn)}/reset-password`, {
      new_password,
    });
    return res.data;
  },

  getExportUrl: () => {
    const baseURL = api.defaults.baseURL || "";
    return `${baseURL}/api/admin/student-registration/export`;
  },
};

export default adminStudentRegistrationApi;

