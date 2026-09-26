import api from "./api";

export const getTimetables = async (params = {}) => {
  const response = await api.get("/timetable", { params });
  return response.data;
};

export const getTimetable = async (id) => {
  const response = await api.get(`/timetable/${id}`);
  return response.data;
};

export const createTimetable = async (data) => {
  const response = await api.post("/timetable", data);
  return response.data;
};

export const updateTimetable = async (id, data) => {
  const response = await api.put(`/timetable/${id}`, data);
  return response.data;
};

export const deleteTimetable = async (id) => {
  const response = await api.delete(`/timetable/${id}`);
  return response.data;
};

export const getStudentTimetable = async () => {
  const response = await api.get("/timetable/student");
  return response.data;
};

export const getTeacherTimetable = async () => {
  const response = await api.get("/timetable/teacher");
  return response.data;
};

export const getDepartmentTimetable = async (departmentId) => {
  const response = await api.get(`/timetable/department/${departmentId}`);
  return response.data;
};

export const getTeachers = async (params = {}) => {
  const response = await api.get("/teachers", { params });
  return response.data;
};

export const getSubjects = async (params = {}) => {
  const response = await api.get("/subjects", { params });
  return response.data;
};

export const getRooms = async (params = {}) => {
  const response = await api.get("/rooms", { params });
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get("/departments");
  return response.data;
};

export default {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getStudentTimetable,
  getTeacherTimetable,
  getDepartmentTimetable,
  getTeachers,
  getSubjects,
  getRooms,
  getDepartments,
};
