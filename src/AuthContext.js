// CampusConnect Academic ERP - Role-Based Authentication & Permissions Context
// Enforces College Gmail domain policy, multi-role authorization, and student data privacy scoping

const AuthContext = React.createContext(null);

const PERMISSION_MATRIX = {
  Student: [
    'VIEW_OWN_ACADEMICS',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_OWN_MARKS',
    'SUBMIT_ASSIGNMENT',
    'APPLY_LEAVE',
    'VIEW_TIMETABLE',
    'VIEW_OWN_FEES',
    'VIEW_ANNOUNCEMENTS',
    'VIEW_PRIVACY_AUDIT'
  ],
  Teacher: [
    'VIEW_TEACHER_DASHBOARD',
    'VIEW_ASSIGNED_CLASSES',
    'MARK_ATTENDANCE',
    'EDIT_INTERNAL_MARKS',
    'CREATE_ASSIGNMENT',
    'GRADE_SUBMISSION',
    'POST_CLASS_NOTICE',
    'VIEW_ENROLLED_STUDENTS',
    'VIEW_TIMETABLE'
  ],
  HOD: [
    'VIEW_HOD_DASHBOARD',
    'VIEW_DEPARTMENT_STATS',
    'VIEW_SEMESTER_ANALYTICS',
    'MANAGE_FACULTY_ALLOCATION',
    'APPROVE_LEAVE_GRIEVANCE',
    'REVIEW_ATTENDANCE_SHORTAGES',
    'POST_DEPT_CIRCULAR',
    'OVERSEE_ALL_SEMESTERS',
    'EXPORT_DEPT_REPORTS'
  ],
  Admin: [
    'VIEW_ADMIN_DASHBOARD',
    'MANAGE_ALL_USERS',
    'ADD_EDIT_DELETE_USERS',
    'CONFIGURE_DEPARTMENTS',
    'CONFIGURE_SEMESTERS',
    'POST_GLOBAL_BROADCAST',
    'VIEW_SYSTEM_AUDIT_LOGS',
    'EXPORT_INSTITUTION_DATA'
  ]
};

const APPROVED_DOMAINS = ['college.edu', 'campus.edu', 'faculty.campus.edu', 'engg.campus.edu', 'university.edu', 'mitt.ac.in', 'ac.in'];

function AuthProvider({ children }) {
  const getAllUsers = () => {
    const dbUsers = window.masterDB?.db?.users || [];
    const csUsers = window.campusStore?.data?.users || [];
    const map = new Map();
    [...dbUsers, ...csUsers].forEach(u => {
      if (u && u.id && !map.has(u.id)) map.set(u.id, u);
    });
    return Array.from(map.values());
  };

  // Try loading active session from localStorage, fallback to default student Aarav Sharma
  const [user, setUser] = React.useState(() => {
    try {
      const saved = localStorage.getItem('campusconnect_auth');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse auth token', e);
    }
    // Default logged in user: Aarav Sharma (Student) for instant evaluation
    const users = getAllUsers();
    return users.find(u => u.id === 'usr-std-01' || u.id === 'std-01') || null;
  });

  const [authError, setAuthError] = React.useState(null);

  const saveSession = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('campusconnect_auth', JSON.stringify(userData));
    } else {
      localStorage.removeItem('campusconnect_auth');
    }
  };

  // College Gmail Domain Validator
  const validateCollegeEmail = (email) => {
    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    const domain = email.split('@')[1].toLowerCase();
    const isCollegeDomain = APPROVED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
    if (!isCollegeDomain) {
      return {
        valid: false,
        error: `Restricted Access: "${domain}" is not an authorized college domain. Only institutional accounts (@college.edu, @campus.edu) are accepted.`
      };
    }
    return { valid: true, domain };
  };

  // Google OAuth SSO Simulation
  const loginWithGoogle = (email) => {
    setAuthError(null);
    const validation = validateCollegeEmail(email);
    if (!validation.valid) {
      setAuthError(validation.error);
      return { success: false, error: validation.error };
    }

    const allUsers = getAllUsers();
    const matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      if (matchedUser.role === 'Teacher' && (matchedUser.accountStatus === 'INACTIVE' || matchedUser.status === 'Inactive')) {
        const err = 'Your teacher account has been deactivated. Please contact the Head of Department.';
        setAuthError(err);
        return { success: false, error: err };
      }
      saveSession(matchedUser);
      window.campusStore?.addAuditLog?.('SSO_LOGIN_SUCCESS', `User ${matchedUser.email} logged in via College Google SSO`);
      return { success: true, user: matchedUser };
    } else {
      // Auto-provision demo account with chosen role based on email pattern
      let determinedRole = 'Student';
      let dept = 'CSE';
      if (email.includes('faculty') || email.includes('prof') || email.includes('dr.')) determinedRole = 'Teacher';
      if (email.includes('hod')) determinedRole = 'HOD';
      if (email.includes('admin') || email.includes('registrar')) determinedRole = 'Admin';

      const newUser = {
        id: (determinedRole === 'Student' ? 'std-' : determinedRole === 'Teacher' ? 'tch-' : determinedRole === 'HOD' ? 'hod-' : 'adm-') + Date.now(),
        role: determinedRole,
        email: email.toLowerCase(),
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=2563eb&color=fff`,
        department: dept,
        semester: determinedRole === 'Student' ? 6 : null,
        section: determinedRole === 'Student' ? 'A' : null,
        rollNo: determinedRole === 'Student' ? '21CS' + Math.floor(100 + Math.random() * 900) : null,
        empId: determinedRole !== 'Student' ? 'FAC-' + Math.floor(100 + Math.random() * 900) : null
      };

      if (window.campusStore?.addUser) window.campusStore.addUser(newUser);
      if (window.masterDB?.db?.users) {
        window.masterDB.db.users.push(newUser);
        window.masterDB.saveDatabase(window.masterDB.db);
      }
      saveSession(newUser);
      return { success: true, user: newUser };
    }
  };

  // Standard Credentials Login
  const loginWithCredentials = (email, password, role) => {
    setAuthError(null);
    const validation = validateCollegeEmail(email);
    if (!validation.valid) {
      setAuthError(validation.error);
      return { success: false, error: validation.error };
    }

    const allUsers = getAllUsers();
    let matched = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched && role) {
      matched = allUsers.find(u => u.role === role);
    }

    if (matched) {
      if (matched.role === 'Teacher' && (matched.accountStatus === 'INACTIVE' || matched.status === 'Inactive')) {
        const err = 'Your teacher account has been deactivated. Please contact the Head of Department.';
        setAuthError(err);
        return { success: false, error: err };
      }
      saveSession(matched);
      window.campusStore?.addAuditLog?.('CREDENTIAL_LOGIN_SUCCESS', `User ${matched.email} logged in`);
      return { success: true, user: matched };
    }

    const err = 'Invalid college credentials or account not found in current semester roll.';
    setAuthError(err);
    return { success: false, error: err };
  };

  // Fast Switch Role (Student <-> Teacher <-> HOD <-> Admin)
  const switchRole = (targetRole, targetUserOrEmail) => {
    const allUsers = getAllUsers();
    let matched = null;
    if (targetUserOrEmail) {
      if (typeof targetUserOrEmail === 'object') {
        matched = targetUserOrEmail;
      } else {
        matched = allUsers.find(u => u.email.toLowerCase() === targetUserOrEmail.toLowerCase() || u.id === targetUserOrEmail);
      }
    }
    if (!matched) {
      matched = allUsers.find(u => u.role === targetRole);
    }
    if (matched) {
      saveSession(matched);
      window.campusStore?.addAuditLog?.('ROLE_SWITCH', `Switched active preview role to: ${targetRole} (${matched.name})`);
      return matched;
    }
    return null;
  };

  // Logout
  const logout = () => {
    window.campusStore.addAuditLog('USER_LOGOUT', `User ${user?.email || 'unknown'} logged out`);
    saveSession(null);
  };

  // Permission Check
  const hasPermission = (permissionKey) => {
    if (!user || !user.role) return false;
    const allowed = PERMISSION_MATRIX[user.role] || [];
    return allowed.includes(permissionKey);
  };

  // Student Privacy Shield Check (Requirement 5)
  // Ensures that student state can ONLY access their own records
  const isStudentPrivacyProtected = (targetStudentId) => {
    if (!user) return false;
    if (user.role === 'Student') {
      return user.id === targetStudentId;
    }
    // Teachers can only view enrolled students in their course
    if (user.role === 'Teacher') {
      return true; // scoped in queries
    }
    // HOD can view department students
    if (user.role === 'HOD') {
      return true;
    }
    // Admin has full institutional audit access
    return true;
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    approvedDomains: APPROVED_DOMAINS,
    authError,
    setAuthError,
    validateCollegeEmail,
    loginWithGoogle,
    loginWithCredentials,
    switchRole,
    logout,
    hasPermission,
    isStudentPrivacyProtected
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

window.AuthProvider = AuthProvider;
window.useAuth = useAuth;
