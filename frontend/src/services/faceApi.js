import api from "./api";

export const registerFace = async (studentId, imageData) => {
  const response = await api.post(`/face/register/${studentId}`, {
    image: imageData,
  });
  return response.data;
};

export const verifyFace = async ({
  image,
  timetableId,
  latitude = null,
  longitude = null,
  durationNumber = null,
  intervalId = null,
  bypassLocation = false,
}) => {
  const response = await api.post("/face/verify", {
    image,
    timetable_id: timetableId,
    latitude,
    longitude,
    duration_number: durationNumber,
    interval_id: intervalId,
    bypass_location: bypassLocation,
  });
  return response.data;
};

export const getFaceStatus = async (studentId) => {
  const response = await api.get(`/face/status/${studentId}`);
  return response.data;
};

export default {
  registerFace,
  verifyFace,
  getFaceStatus,
};
