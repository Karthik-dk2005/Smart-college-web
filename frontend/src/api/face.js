import api from "./axios";

export const faceApi = {
  registerFace: async (studentId, image) => {
    return api.post(`/api/face/register/${studentId}`, { image });
  },

  verifyFace: async (payload) => {
    return api.post("/api/face/verify", payload);
  },

  getFaceStatus: async (studentId) => {
    return api.get(`/api/face/status/${studentId}`);
  },
};

export default faceApi;
