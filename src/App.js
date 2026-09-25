// CampusConnect Academic ERP - Main Application Controller
// Orchestrates Authentication, Global Search, Dynamic Role Tabs, and Notification Center

function App() {
  const { user, role, switchRole, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('student_overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Keyboard shortcut Ctrl+K for Global Search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to cross-component tab change events
  React.useEffect(() => {
    const handleTabChange = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  // Sync route on initial load and popstate
  React.useEffect(() => {
    const syncRouteFromUrl = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin/teachers/add')) {
        // Strict Authorization Protection (Section 1 & 15)
        if (role !== 'HOD' && role !== 'Admin') {
          // If Student, Teacher or unauthorized user manually enters /admin/teachers/add:
          // Do not display the page. Redirect them to their correct dashboard.
          if (role === 'Student') {
            setActiveTab('student_overview');
            window.history.replaceState(null, '', '/');
          } else if (role === 'Teacher') {
            setActiveTab('teacher_overview');
            window.history.replaceState(null, '', '/');
          } else {
            setActiveTab('campus_landing');
            window.history.replaceState(null, '', '/');
          }
          return;
        }
        setActiveTab('hod_add_teacher');
      } else if (path.includes('/admin/teachers')) {
        if (role !== 'HOD' && role !== 'Admin') {
          if (role === 'Student') setActiveTab('student_overview');
          else if (role === 'Teacher') setActiveTab('teacher_overview');
          else setActiveTab('campus_landing');
          window.history.replaceState(null, '', '/');
          return;
        }
        setActiveTab('hod_teachers');
      } else if (path.includes('/admin/students')) {
        // Strict Authorization Protection for Student Management (Requirements 2, 24, 26)
        if (role !== 'HOD' && role !== 'Admin') {
          if (role === 'Student') setActiveTab('student_overview');
          else if (role === 'Teacher') setActiveTab('teacher_overview');
          else setActiveTab('campus_landing');
          window.history.replaceState(null, '', '/');
          return;
        }
        setActiveTab('hod_students');
      } else if (path.includes('/student/geo-attendance')) {
        if (!user || role !== 'Student') {
          switchRole('Student', 'amulya.h.s@mitt.ac.in');
        }
        setActiveTab('student_geo_attendance');
      } else if (path.includes('/student/attendance')) {
        if (!user || role !== 'Student') {
          switchRole('Student', 'amulya.h.s@mitt.ac.in');
        }
        setActiveTab('student_attendance');
      } else if (path.includes('/teacher/geofence') || path.includes('/teacher/geo-roster')) {
        if (!user || role !== 'Teacher') {
          switchRole('Teacher');
        }
        setActiveTab('teacher_geo_roster');
      } else if (path.includes('/teacher/attendance')) {
        if (!user || role !== 'Teacher') {
          switchRole('Teacher');
        }
        setActiveTab('teacher_attendance');
      } else if (path.includes('/admin/geofence')) {
        if (role !== 'HOD' && role !== 'Admin') {
          switchRole('HOD');
        }
        setActiveTab(role === 'Admin' ? 'admin_geofence' : 'hod_geofence');
      }
    };

    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, [role, user]);

  // Update browser URL path when tab changes
  React.useEffect(() => {
    if (activeTab === 'student_attendance') {
      window.history.replaceState(null, '', '/student/attendance');
    } else if (activeTab === 'student_geo_attendance') {
      window.history.replaceState(null, '', '/student/geo-attendance');
    } else if (activeTab === 'teacher_attendance') {
      window.history.replaceState(null, '', '/teacher/attendance');
    } else if (activeTab === 'teacher_geo_roster') {
      window.history.replaceState(null, '', '/teacher/geofence');
    } else if (activeTab === 'hod_geofence' || activeTab === 'admin_geofence') {
      window.history.replaceState(null, '', '/admin/geofence');
    } else if (activeTab === 'hod_add_teacher') {
      window.history.replaceState(null, '', '/admin/teachers/add');
    } else if (activeTab === 'hod_teachers') {
      window.history.replaceState(null, '', '/admin/teachers');
    } else if (activeTab === 'hod_students' || (activeTab && activeTab.startsWith('hod_students')) || activeTab === 'hod_add_student' || activeTab === 'hod_student_history') {
      window.history.replaceState(null, '', '/admin/students');
    } else if (activeTab === 'campus_landing') {
      window.history.replaceState(null, '', '/');
    }
  }, [activeTab]);

  // Automatically update active tab when user role changes unless specific route is requested
  React.useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/admin/teachers/add')) {
      if (role === 'HOD' || role === 'Admin') {
        setActiveTab('hod_add_teacher');
        return;
      } else {
        if (role === 'Student') setActiveTab('student_overview');
        else if (role === 'Teacher') setActiveTab('teacher_overview');
        window.history.replaceState(null, '', '/');
        return;
      }
    }
    if (path.includes('/admin/teachers')) {
      if (role === 'HOD' || role === 'Admin') {
        setActiveTab('hod_teachers');
        return;
      } else {
        if (role === 'Student') setActiveTab('student_overview');
        else if (role === 'Teacher') setActiveTab('teacher_overview');
        window.history.replaceState(null, '', '/');
        return;
      }
    }
    if (path.includes('/admin/students')) {
      if (role === 'HOD' || role === 'Admin') {
        setActiveTab('hod_students');
        return;
      } else {
        if (role === 'Student') setActiveTab('student_overview');
        else if (role === 'Teacher') setActiveTab('teacher_overview');
        window.history.replaceState(null, '', '/');
        return;
      }
    }
    if (path.includes('/student/attendance') && role === 'Student') {
      setActiveTab('student_attendance');
      return;
    }
    if (path.includes('/teacher/attendance') && role === 'Teacher') {
      setActiveTab('teacher_attendance');
      return;
    }

    if (role === 'Student') {
      setActiveTab('student_overview');
    } else if (role === 'Teacher') {
      setActiveTab('teacher_overview');
    } else if (role === 'HOD') {
      setActiveTab('hod_overview');
    } else if (role === 'Admin') {
      setActiveTab('admin_overview');
    }
  }, [role]);

  return (
    <div className="campus-app-root">
      {/* Top Navbar */}
      <Navbar 
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="campus-app-body">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Main Content Area */}
        <main className={`campus-main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {role === 'Student' && <StudentDashboard activeTab={activeTab} />}
          {role === 'Teacher' && <TeacherDashboard activeTab={activeTab} />}
          {(role === 'HOD' || (role === 'Admin' && (activeTab === 'hod_teachers' || activeTab === 'hod_add_teacher' || activeTab === 'hod_students' || (activeTab && activeTab.startsWith('hod_students')) || activeTab === 'hod_add_student' || activeTab === 'hod_student_history' || activeTab === 'admin_students'))) && (
            <HodDashboard activeTab={activeTab} />
          )}
          {(role === 'Admin' && activeTab !== 'hod_teachers' && activeTab !== 'hod_add_teacher' && activeTab !== 'hod_students' && (!activeTab || !activeTab.startsWith('hod_students')) && activeTab !== 'hod_add_student' && activeTab !== 'hod_student_history' && activeTab !== 'admin_students') && (
            <AdminDashboard activeTab={activeTab} />
          )}

          {(!user || activeTab === 'campus_landing') && (
            <div className="campus-landing-hero">
              <div className="campus-hero-media-wrapper">
                <img 
                  src="assets/mit-img-11.jpg" 
                  alt="Maharaja Institute of Technology Thandavapura Campus" 
                  className="campus-hero-image"
                />
                <div className="campus-hero-gradient-overlay">
                  <div className="campus-hero-badge-pill">
                    <span className="hero-pill-dot"></span>
                    <Icons.Building size={14} className="text-primary" />
                    <span>Maharaja Institute of Technology Thandavapura</span>
                  </div>
                  <h1 className="campus-hero-heading">
                    Smart Department & College Academic Management System
                  </h1>
                  <p className="campus-hero-subtext">
                    Official academic enterprise platform for the Department of Computer Science & Engineering. Access 5th Semester A & B Section rosters (135 Students), live session engine, timetable schedules, and continuous internal assessment records.
                  </p>
                  <div className="campus-hero-cta-group">
                    <button className="btn btn-primary btn-lg" onClick={() => setIsLoginModalOpen(true)}>
                      <Icons.Google size={20} /> Sign in with College Google Account
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => switchRole('Student', 'amulya.h.s@mitt.ac.in')}>
                      <Icons.GraduationCap size={20} /> Preview 5th Sem Student (Amulya)
                    </button>
                  </div>
                </div>
              </div>

              {/* Campus Highlights Grid Below Hero */}
              <div className="campus-hero-features-grid">
                <div className="hero-feature-card">
                  <div className="hero-feature-icon text-primary"><Icons.Users size={22} /></div>
                  <h4>135 5th Sem CSE Students</h4>
                  <p>A Section (68 Records) &bull; B Section (67 Records) with verified lateral entries.</p>
                </div>
                <div className="hero-feature-card">
                  <div className="hero-feature-icon text-emerald"><Icons.Clock size={22} /></div>
                  <h4>Session Engine & Roll Call</h4>
                  <p>Geofenced roll call with live countdown and regulatory 75% shortage engine.</p>
                </div>
                <div className="hero-feature-card">
                  <div className="hero-feature-icon text-purple"><Icons.Award size={22} /></div>
                  <h4>Continuous Evaluation</h4>
                  <p>Audited internal marks entry, gradebook calculations, and HOD finalization.</p>
                </div>
                <div className="hero-feature-card">
                  <div className="hero-feature-icon text-amber"><Icons.Shield size={22} /></div>
                  <h4>FERPA Privacy Vault</h4>
                  <p>Strict student privacy isolation with immutable institutional audit trails.</p>
                </div>
              </div>
            </div>
          )}

          {/* Floating Role Quick Switcher (Requirements 2 & 96) */}
          <div className="floating-evaluator-bar">
            <span className="evaluator-label">Fast Demo Persona:</span>
            <button 
              className={`eval-pill ${!user || activeTab === 'campus_landing' ? 'active-landing' : ''}`}
              onClick={() => { if (user) { logout(); } else { setActiveTab('campus_landing'); } }}
              title="View Public Campus Landing & Login Gateway"
            >
              🏛️ Campus Hero
            </button>
            <button 
              className={`eval-pill ${role === 'Student' && user?.email === 'amulya.h.s@mitt.ac.in' ? 'active-student' : ''}`}
              onClick={() => switchRole('Student', 'amulya.h.s@mitt.ac.in')}
              title="5th Sem CSE Sec A - 4MN24CS007"
            >
              🎓 5th Sem A (Amulya)
            </button>
            <button 
              className={`eval-pill ${role === 'Student' && user?.email === 'abhilash.kumar.k@mitt.ac.in' ? 'active-student' : ''}`}
              onClick={() => switchRole('Student', 'abhilash.kumar.k@mitt.ac.in')}
              title="5th Sem CSE Sec B - 4MN24CS002"
            >
              🎓 5th Sem B (Abhilash)
            </button>
            <button 
              className={`eval-pill ${role === 'Student' && user?.email === 'dhanushree.d@mitt.ac.in' ? 'active-student' : ''}`}
              onClick={() => switchRole('Student', 'dhanushree.d@mitt.ac.in')}
              title="5th Sem Diploma Lateral Entry (USN: Not Available)"
            >
              🎓 5th Sem Dip (Dhanushree)
            </button>
            <button 
              className={`eval-pill ${activeTab === 'student_attendance' ? 'active-student' : ''}`}
              onClick={() => {
                if (role !== 'Student') switchRole('Student', 'amulya.h.s@mitt.ac.in');
                setActiveTab('student_attendance');
              }}
              title="Open Student Biometric Attendance Verification (/student/attendance)"
            >
              📸 Student Biometric Verify
            </button>
            <button 
              className={`eval-pill ${activeTab === 'student_geo_attendance' ? 'active-student' : ''}`}
              onClick={() => {
                if (role !== 'Student') switchRole('Student', 'amulya.h.s@mitt.ac.in');
                setActiveTab('student_geo_attendance');
              }}
              title="Open Real-Time GPS Geofence Check-in (/student/geo-attendance)"
            >
              📍 GPS Geofence Check-in
            </button>
            <button 
              className={`eval-pill ${activeTab === 'teacher_attendance' ? 'active-teacher' : ''}`}
              onClick={() => {
                if (role !== 'Teacher') switchRole('Teacher');
                setActiveTab('teacher_attendance');
              }}
              title="Open Teacher Session & Biometric Roster (/teacher/attendance)"
            >
              📋 Teacher Biometric Roster
            </button>
            <button 
              className={`eval-pill ${activeTab === 'teacher_geo_roster' || activeTab === 'hod_geofence' || activeTab === 'admin_geofence' ? 'active-hod' : ''}`}
              onClick={() => {
                if (role !== 'HOD' && role !== 'Admin') switchRole('HOD');
                setActiveTab(role === 'Admin' ? 'admin_geofence' : 'hod_geofence');
              }}
              title="Open GPS Geofence Configuration & Roster (/admin/geofence)"
            >
              📡 Geofence Admin Roster
            </button>
            <button 
              className={`eval-pill ${role === 'HOD' ? 'active-hod' : ''}`}
              onClick={() => switchRole('HOD')}
            >
              🏛️ HOD (hod@college.edu)
            </button>
            <button 
              className={`eval-pill ${role === 'Admin' ? 'active-admin' : ''}`}
              onClick={() => switchRole('Admin')}
            >
              🛡️ Admin (admin@college.edu)
            </button>
          </div>
        </main>
      </div>

      {/* Global Search Modal (Requirement 75) */}
      <GlobalSearch 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, item) => {
          if (type === 'subject') setActiveTab(role === 'Student' ? 'student_timetable' : 'teacher_timetable');
          if (type === 'bus') setActiveTab('student_bus');
          if (type === 'room') setActiveTab(role === 'HOD' ? 'hod_rooms' : role === 'Admin' ? 'admin_rooms' : 'student_timetable');
          if (type === 'notice') setActiveTab(role === 'Student' ? 'student_notices' : role === 'Teacher' ? 'teacher_notices' : role === 'HOD' ? 'hod_notices' : 'admin_overview');
          if (type === 'teacher') setActiveTab(role === 'HOD' ? 'hod_teachers' : role === 'Admin' ? 'admin_users' : 'student_timetable');
          if (type === 'student') setActiveTab(role === 'HOD' ? 'hod_students' : role === 'Admin' ? 'admin_students' : 'student_overview');
        }}
      />

      {/* Login & Single Sign-On Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

// Mount Root Component with Context Providers
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  );
}

window.App = App;
