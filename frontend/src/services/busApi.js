import api from "./api";

export const busApi = {
  getBuses: (params) => api.get("/buses", { params }),
  getBus: (routeId) => api.get(`/buses/${routeId}`),
  createBus: (data) => api.post("/buses", data),
  updateBus: (routeId, data) => api.put(`/buses/${routeId}`, data),
  deleteBus: (routeId) => api.delete(`/buses/${routeId}`),

  getBusStops: (routeId) => api.get(`/buses/${routeId}/stops`),
  createBusStop: (routeId, data) => api.post(`/buses/${routeId}/stops`, data),
  updateBusStop: (stopId, data) => api.put(`/buses/stops/${stopId}`, data),
  deleteBusStop: (stopId) => api.delete(`/buses/stops/${stopId}`),

  getMyBus: () => api.get("/buses/my-bus"),
  getStudentBus: (studentId) => (studentId ? api.get(`/buses/student/${studentId}`) : api.get("/buses/my-bus")),
  assignStudentBus: (studentId, data) => api.post(`/buses/student/${studentId}/assign`, data),
  removeStudentBus: (studentId) => api.delete(`/buses/student/${studentId}/assign`),
};

export const {
  getBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
  getBusStops,
  createBusStop,
  updateBusStop,
  deleteBusStop,
  getMyBus,
  getStudentBus,
  assignStudentBus,
  removeStudentBus,
} = busApi;

export default busApi;
