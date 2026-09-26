import api from "./axios";

export const dashboardApi = {
  getStats: async () => {
    return api.get("/api/dashboard/stats");
  },
};

export default dashboardApi;
