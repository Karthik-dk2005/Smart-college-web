// CampusConnect / SmartDept - Student Information Management Service
// Interacts with /api/students backend endpoints with RBAC credentials

class StudentService {
  constructor() {
    this.baseUrl = '/api/students';
  }

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
      console.warn('Could not read auth session for student service', e);
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

  // Get Summary Statistics for Dashboard (Section 3)
  async getStats() {
    try {
      const res = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Student stats fetch failed:', err);
    }
    return {
      success: false,
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      graduatedStudents: 0,
      semesters: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
      sectionCounts: {}
    };
  }

  // Get List of Students with Filters & Search (Sections 4, 5, 6, 13)
  async getStudents(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.semester && filters.semester !== 'All') params.append('semester', filters.semester);
      if (filters.section && filters.section !== 'All') params.append('section', filters.section);
      if (filters.department && filters.department !== 'All') params.append('department', filters.department);
      if (filters.batch && filters.batch !== 'All') params.append('batch', filters.batch);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

      const url = `${this.baseUrl}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        return data.students || [];
      } else if (res.status === 403) {
        return { error: 'You do not have permission to manage students.' };
      }
    } catch (err) {
      console.warn('Failed to fetch students from API:', err);
    }
    return [];
  }

  // Get Single Student Profile (Section 14 & 26)
  async getStudentById(id) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.student || null;
      }
    } catch (err) {
      console.warn('Failed to fetch student details:', err);
    }
    return null;
  }

  // Add New Student (Sections 7-12, 19, 21, 22)
  async addStudent(studentData) {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(studentData)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || 'Failed to add student.'
        };
      }
      return {
        success: true,
        message: data.message || 'Student added successfully.',
        student: data.student
      };
    } catch (err) {
      console.error('Error adding student:', err);
      return {
        success: false,
        error: 'Network error. Please verify backend server is running.'
      };
    }
  }

  // Edit Student (Section 15)
  async updateStudent(id, studentData) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(studentData)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || 'Failed to update student.'
        };
      }
      return {
        success: true,
        message: data.message || 'Student updated successfully.',
        student: data.student
      };
    } catch (err) {
      console.error('Error updating student:', err);
      return {
        success: false,
        error: 'Network error during student update.'
      };
    }
  }

  // Activate / Deactivate / Change Status (Section 18)
  async toggleStatus(id, status) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update student status.'
        };
      }
      return {
        success: true,
        message: data.message || 'Student status updated.',
        student: data.student
      };
    } catch (err) {
      console.error('Error toggling student status:', err);
      return {
        success: false,
        error: 'Network error during status change.'
      };
    }
  }

  // Semester Promotion (Section 16 & 17)
  async promoteStudent(id, targetSemester) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}/semester`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ semester: targetSemester })
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Failed to promote student.'
        };
      }
      return {
        success: true,
        message: data.message || 'Student semester promoted successfully.',
        student: data.student,
        currentSemester: data.currentSemester
      };
    } catch (err) {
      console.error('Error promoting student:', err);
      return {
        success: false,
        error: 'Network error during semester promotion.'
      };
    }
  }

  // Get Academic History (Section 17 & 20)
  async getAcademicHistory(id) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}/academic-history`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.academicHistory || [];
      }
    } catch (err) {
      console.warn('Failed to fetch academic history:', err);
    }
    return [];
  }

  // Bulk Import Students (Section 30)
  async importStudents(students) {
    try {
      const res = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ students })
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Import failed.'
        };
      }
      return data;
    } catch (err) {
      console.error('Error importing students:', err);
      return {
        success: false,
        error: 'Network error during student import.'
      };
    }
  }

  // Export Students CSV (Section 31)
  async exportCsv(filters = {}) {
    const params = new URLSearchParams();
    if (filters.semester && filters.semester !== 'All') params.append('semester', filters.semester);
    if (filters.section && filters.section !== 'All') params.append('section', filters.section);
    if (filters.department && filters.department !== 'All') params.append('department', filters.department);
    if (filters.batch && filters.batch !== 'All') params.append('batch', filters.batch);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);

    const url = `${this.baseUrl}/export${params.toString() ? '?' + params.toString() : ''}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Export request failed');
      const csvText = await res.text();
      
      // Trigger client file download
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    } catch (err) {
      console.error('Export error:', err);
      return { success: false, error: err.message };
    }
  }
}

window.studentService = new StudentService();
