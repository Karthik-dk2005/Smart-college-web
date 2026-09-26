import api, { baseURL } from "./axios";

export const locationsApi = {
  update: async (locationData) => {
    return api.post("/api/location/update", locationData);
  },

  getCurrent: async (userId) => {
    return api.get(`/api/location/current/${userId}`);
  },

  getHistory: async (userId, limit = 50) => {
    return api.get(`/api/location/history/${userId}`, { params: { limit } });
  },

  getWebSocketUrl: (userId, token) => {
    const origin = (baseURL && baseURL.startsWith("http")) ? baseURL : window.location.origin;
    const wsBase = origin.replace(/^http/, "ws");
    const tokenParam = token ? `?token=${token}` : "";
    return `${wsBase}/api/location/ws/${userId}${tokenParam}`;
  },
};

export default locationsApi;
