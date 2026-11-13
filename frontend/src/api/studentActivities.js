import api, { baseURL } from "./axios";

export const studentActivitiesApi = {
  getAll: async (params = {}) => {
    return api.get("/api/student-activities", { params });
  },

  getById: async (id) => {
    return api.get(`/api/student-activities/${id}`);
  },

  create: async (data) => {
    return api.post("/api/student-activities", data);
  },

  update: async (id, data) => {
    return api.put(`/api/student-activities/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/api/student-activities/${id}`);
  },

  uploadEvidence: async (activityId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/student-activities/${activityId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getFiles: async (activityId) => {
    return api.get(`/api/student-activities/${activityId}/files`);
  },

  verify: async (activityId, data = {}) => {
    return api.post(`/api/student-activities/${activityId}/verify`, data);
  },

  reject: async (activityId, data) => {
    return api.post(`/api/student-activities/${activityId}/reject`, data);
  },

  getStudentActivities: async (studentId) => {
    return api.get(`/api/students/${studentId}/activities`);
  },

  getAdminActivities: async () => {
    return api.get("/api/admin/student-activities");
  },

  getHODActivities: async () => {
    return api.get("/api/hod/student-activities");
  },

  getStatsSummary: async (studentId = null) => {
    const params = studentId ? { student_id: studentId } : {};
    return api.get("/api/student-activities/stats/summary", { params });
  },

  getFileDownloadUrl: (activityId, fileId) => {
    const token = localStorage.getItem("access_token");
    return `${baseURL}/api/student-activities/${activityId}/files/${fileId}/download${token ? `?token=${token}` : ""}`;
  },

  getFileViewUrl: (activityId, fileId) => {
    const token = localStorage.getItem("access_token");
    return `${baseURL}/api/student-activities/${activityId}/files/${fileId}/view${token ? `?token=${token}` : ""}`;
  },
};

export default studentActivitiesApi;
