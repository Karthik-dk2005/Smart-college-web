import api from "./axios";

export const busesApi = {
  getAll: (params) => api.get("/buses", { params }),
  getById: (routeId) => api.get(`/buses/${routeId}`),
  create: (data) => api.post("/buses", data),
  update: (routeId, data) => api.put(`/buses/${routeId}`, data),
  delete: (routeId) => api.delete(`/buses/${routeId}`),

  getStops: (routeId) => api.get(`/buses/${routeId}/stops`),
  createStop: (routeId, data) => api.post(`/buses/${routeId}/stops`, data),
  updateStop: (stopId, data) => api.put(`/buses/stops/${stopId}`, data),
  deleteStop: (stopId) => api.delete(`/buses/stops/${stopId}`),

  getStudentBus: (studentId) => api.get(`/buses/student/${studentId}`),
  assignStudentBus: (studentId, data) => api.post(`/buses/student/${studentId}/assign`, data),
  removeStudentBus: (studentId) => api.delete(`/buses/student/${studentId}/assign`),
};

export default busesApi;
