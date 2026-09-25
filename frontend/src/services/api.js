const API_URL = "http://localhost:8000/api";

function getAuthHeader() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const errorMsg = data.message || data.detail || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // --- AUTHENTICATION ---
  login: async (email, password) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async () => {
    return request("/auth/me");
  },

  register: async (userData) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_user");
    }
  },

  // --- DASHBOARDS ---
  getStudentDashboard: async () => request("/dashboard/student"),
  getTeacherDashboard: async () => request("/dashboard/teacher"),
  getHodDashboard: async () => request("/dashboard/hod"),
  getAdminDashboard: async () => request("/dashboard/admin"),

  // --- ATTENDANCE ---
  getMyAttendance: async () => request("/attendance/my"),
  
  createAttendanceSession: async (sessionData) => {
    return request("/attendance/session", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  },

  getSession: async (sessionId) => request(`/attendance/session/${sessionId}`),

  getSessionStudents: async (sessionId) => request(`/attendance/session/${sessionId}/students`),

  markAttendance: async ({ sessionId, latitude, longitude, deviceVerified = true }) => {
    return request("/attendance/mark", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        latitude,
        longitude,
        device_verified: deviceVerified,
      }),
    });
  },

  getStudentAttendanceReport: async (studentId) => request(`/attendance/student/${studentId}`),
  getSubjectAttendanceReport: async (subjectId) => request(`/attendance/subject/${subjectId}`),
  getSemesterAttendanceReport: async (semester) => request(`/attendance/semester/${semester}`),

  // --- TIMETABLE ---
  getTimetable: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/timetable${query ? `?${query}` : ""}`);
  },

  getStudentTimetable: async () => request("/timetable/student"),
  getTeacherTimetable: async () => request("/timetable/teacher"),

  createTimetable: async (data) => {
    return request("/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTimetable: async (id, data) => {
    return request(`/timetable/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTimetable: async (id) => {
    return request(`/timetable/${id}`, { method: "DELETE" });
  },

  // --- ROOMS ---
  getRooms: async () => request("/rooms"),
  getAvailableRooms: async () => request("/rooms/available"),
  createRoom: async (data) => {
    return request("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateRoom: async (id, data) => {
    return request(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteRoom: async (id) => request(`/rooms/${id}`, { method: "DELETE" }),

  // --- EXAMS ---
  getExams: async (semester) => {
    const query = semester ? `?semester=${semester}` : "";
    return request(`/exams${query}`);
  },
  createExam: async (data) => {
    return request("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateExam: async (id, data) => {
    return request(`/exams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteExam: async (id) => request(`/exams/${id}`, { method: "DELETE" }),

  // --- MARKS ---
  getMyMarks: async () => request("/marks/my"),
  getStudentMarks: async (studentId) => request(`/marks/student/${studentId}`),
  createMark: async (data) => {
    return request("/marks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateMark: async (id, data) => {
    return request(`/marks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  finalizeMark: async (id) => {
    return request(`/marks/${id}/finalize`, { method: "POST" });
  },

  // --- ASSIGNMENTS ---
  getAssignments: async (subjectId) => {
    const query = subjectId ? `?subject_id=${subjectId}` : "";
    return request(`/assignments${query}`);
  },
  createAssignment: async (data) => {
    return request("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  submitAssignment: async (assignmentId, data) => {
    return request(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --- STUDY MATERIALS ---
  getMaterials: async (subjectId, unit) => {
    const params = new URLSearchParams();
    if (subjectId) params.append("subject_id", subjectId);
    if (unit) params.append("unit", unit);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/materials${query}`);
  },
  createMaterial: async (data) => {
    return request("/materials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteMaterial: async (id) => request(`/materials/${id}`, { method: "DELETE" }),

  // --- NOTICES ---
  getNotices: async (category, department) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (department) params.append("department", department);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/notices${query}`);
  },
  createNotice: async (data) => {
    return request("/notices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteNotice: async (id) => request(`/notices/${id}`, { method: "DELETE" }),

  // --- NOTIFICATIONS ---
  getNotifications: async () => request("/notifications"),
  markNotificationRead: async (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: async () => request("/notifications/read-all", { method: "PUT" }),

  // --- COLLEGE BUS ---
  getBusRoutes: async (search) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return request(`/bus${query}`);
  },
  createBusRoute: async (data) => {
    return request("/bus", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateBusRoute: async (id, data) => {
    return request(`/bus/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteBusRoute: async (id) => request(`/bus/${id}`, { method: "DELETE" }),

  // --- STUDENTS & TEACHERS CRUD ---
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ""}`);
  },
  createStudent: async (data) => {
    return request("/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getTeachers: async () => request("/teachers"),
  createTeacher: async (data) => {
    return request("/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --- ADMIN & AUDIT ---
  getAdminUsers: async () => request("/admin/users"),
  getAuditLogs: async () => request("/admin/audit-logs"),
  getAdminStats: async () => request("/admin/system-stats"),
};

export default api;
