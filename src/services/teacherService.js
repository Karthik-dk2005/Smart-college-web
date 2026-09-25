// CampusConnect / SmartDept - Teacher Management Client Service
// Communicates with backend REST API at /api/teachers with authenticated headers

class TeacherService {
  constructor() {
    this.baseUrl = '/api/teachers';
  }

  // Get current authenticated user session
  getAuthHeaders() {
    let role = 'HOD';
    let userId = 'usr-hod-01';
    let email = 'hod@college.edu';

    try {
      const saved = localStorage.getItem('campusconnect_auth');
      if (saved) {
        const u = JSON.parse(saved);
        if (u) {
          role = u.role || role;
          userId = u.id || u._id || userId;
          email = u.email || email;
        }
      }
    } catch (e) {
      console.warn('Could not read auth session for teacher service', e);
    }

    const tokenPayload = btoa(JSON.stringify({ role, id: userId, email }));

    return {
      'Content-Type': 'application/json',
      'x-user-role': role,
      'x-user-id': userId,
      'x-user-email': email,
      'Authorization': `Bearer ${tokenPayload}`
    };
  }

  // Fetch all teachers from backend
  async getTeachers() {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const teachers = data.teachers || [];
        this.syncToLocalDB(teachers);
        return teachers;
      }
    } catch (err) {
      console.warn('Teacher API fetch failed, falling back to local database:', err);
    }
    // Fallback
    return this.getLocalTeachers();
  }

  // Add a new teacher (HOD / Admin only)
  async addTeacher(teacherData) {
    const headers = this.getAuthHeaders();

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(teacherData)
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || (res.status === 403 ? "You do not have permission to add teachers." : "Failed to create teacher.")
        };
      }

      // Sync into local masterDB for immediate UI reactivity across all components
      this.addTeacherToLocalDB(data.teacher);

      return {
        success: true,
        message: data.message || "Teacher added successfully.",
        teacher: data.teacher
      };
    } catch (err) {
      console.error('Error in teacherService.addTeacher:', err);
      return {
        success: false,
        error: "Network or server connection failed. Please ensure the backend is running."
      };
    }
  }

  // Update existing teacher (HOD / Admin only)
  async updateTeacher(id, updateData) {
    const headers = this.getAuthHeaders();

    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || "Failed to update teacher."
        };
      }

      this.updateTeacherInLocalDB(data.teacher);

      return {
        success: true,
        message: data.message || "Teacher updated successfully.",
        teacher: data.teacher
      };
    } catch (err) {
      console.error('Error in teacherService.updateTeacher:', err);
      return {
        success: false,
        error: "Failed to update teacher due to network error."
      };
    }
  }

  // Toggle account status (ACTIVE <-> INACTIVE)
  async toggleStatus(id, newStatus) {
    const headers = this.getAuthHeaders();

    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || "Failed to update teacher status."
        };
      }

      this.updateTeacherInLocalDB(data.teacher);

      return {
        success: true,
        message: data.message || `Teacher status updated to ${newStatus}.`,
        teacher: data.teacher
      };
    } catch (err) {
      console.error('Error in teacherService.toggleStatus:', err);
      return {
        success: false,
        error: "Failed to update status due to network error."
      };
    }
  }

  // Fetch teacher audit logs
  async getAuditLogs() {
    try {
      const res = await fetch(`${this.baseUrl}/audit-logs`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch (err) {
      console.warn('Audit logs fetch failed:', err);
    }
    return [];
  }

  // Synchronize backend teacher documents to local mockDatabase
  syncToLocalDB(teachers) {
    if (!window.masterDB || !window.masterDB.db || !window.masterDB.db.users) return;

    teachers.forEach(t => {
      const existingIdx = window.masterDB.db.users.findIndex(u => 
        (u._id && u._id === t._id) || 
        (u.facultyId && u.facultyId === t.facultyId) || 
        (u.empId && u.empId === t.facultyId) ||
        (u.email && u.email.toLowerCase() === t.email.toLowerCase())
      );

      const mappedUser = {
        id: t._id || ('usr-tch-' + t.facultyId),
        _id: t._id,
        role: 'Teacher',
        name: t.name,
        avatar: t.profilePhoto,
        profilePhoto: t.profilePhoto,
        email: t.email,
        phone: t.phone,
        facultyId: t.facultyId,
        empId: t.facultyId,
        designation: t.designation,
        department: t.department,
        qualification: t.qualification,
        specialization: t.specialization,
        experience: t.experience,
        office: t.officeRoom,
        officeRoom: t.officeRoom,
        joiningDate: t.joiningDate,
        assignedSubjects: typeof t.subjectsHandled === 'string' ? t.subjectsHandled.split(',').map(s => s.trim()) : (t.subjectsHandled || []),
        subjectsHandled: t.subjectsHandled,
        assignedSemester: t.assignedSemester,
        assignedSection: t.assignedSection,
        assignedClasses: t.assignedClasses,
        accountStatus: t.accountStatus || 'ACTIVE',
        status: t.accountStatus === 'INACTIVE' ? 'Inactive' : 'Active',
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      };

      if (existingIdx >= 0) {
        window.masterDB.db.users[existingIdx] = {
          ...window.masterDB.db.users[existingIdx],
          ...mappedUser
        };
      } else {
        window.masterDB.db.users.push(mappedUser);
      }
    });

    if (window.masterDB.saveDatabase) {
      window.masterDB.saveDatabase(window.masterDB.db);
    }
  }

  addTeacherToLocalDB(t) {
    this.syncToLocalDB([t]);
  }

  updateTeacherInLocalDB(t) {
    this.syncToLocalDB([t]);
  }

  getLocalTeachers() {
    if (!window.masterDB || !window.masterDB.db || !window.masterDB.db.users) return [];
    return window.masterDB.db.users.filter(u => u.role === 'Teacher');
  }
}

window.teacherService = new TeacherService();
