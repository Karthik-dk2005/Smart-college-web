import api from "./api";

export const getSessionAttendance = async (timetableId, date = null) => {
  const params = date ? { date } : {};
  const response = await api.get(`/attendance/session/${timetableId}`, { params });
  return response.data;
};

export const submitSessionAttendance = async (timetableId, data) => {
  const response = await api.post(`/attendance/session/${timetableId}`, data);
  return response.data;
};

export const getSessionIntervals = async (timetableId, date = null) => {
  const params = date ? { date } : {};
  const response = await api.get(`/attendance/session/${timetableId}/intervals`, { params });
  return response.data;
};

export const updateIntervalAttendance = async (intervalId, attendanceRecords) => {
  const response = await api.put(`/attendance/interval/${intervalId}`, {
    attendance: attendanceRecords,
  });
  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await api.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const getStudentSubjectAttendance = async (studentId, subjectId) => {
  const response = await api.get(`/attendance/student/${studentId}/subject/${subjectId}`);
  return response.data;
};

export const getSubjectAttendance = async (subjectId) => {
  const response = await api.get(`/attendance/subject/${subjectId}`);
  return response.data;
};

export const getTeacherAttendance = async (teacherId) => {
  const response = await api.get(`/attendance/teacher/${teacherId}`);
  return response.data;
};

export const getTodayTimetable = async () => {
  const response = await api.get("/timetable/today");
  return response.data;
};

export const getTeacherTodayTimetable = async () => {
  const response = await api.get("/timetable/teacher/today");
  return response.data;
};

export default {
  getSessionAttendance,
  submitSessionAttendance,
  getSessionIntervals,
  updateIntervalAttendance,
  getStudentAttendance,
  getStudentSubjectAttendance,
  getSubjectAttendance,
  getTeacherAttendance,
  getTodayTimetable,
  getTeacherTodayTimetable,
};
