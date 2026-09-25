// CampusConnect Master Sidebar Navigation with Comprehensive Role-Specific Links

function Sidebar({ activeTab, onSelectTab, isCollapsed }) {
  const { user, role, logout } = useAuth();

  const menuConfig = {
    Student: [
      { id: 'student_overview', label: 'Dashboard', icon: Icons.BookOpen, badge: null },
      { id: 'student_timetable', label: 'Official Timetable', icon: Icons.Calendar, badge: 'Live' },
      { id: 'student_attendance', label: 'Biometric Attendance', icon: Icons.Fingerprint, badge: 'Face+Finger', badgeType: 'primary' },
      { id: 'student_geo_attendance', label: 'GPS Campus Check-in', icon: Icons.MapPin, badge: 'Thandavapura', badgeType: 'primary' },
      { id: 'student_exams', label: 'Exams & Seating', icon: Icons.Award, badge: 'Oct 12' },
      { id: 'student_marks', label: 'Internal Marks', icon: Icons.Award, badge: 'IA1' },
      { id: 'student_assignments', label: 'Assignments', icon: Icons.FileText, badge: '1 Due' },
      { id: 'student_materials', label: 'Study Materials', icon: Icons.BookOpen, badge: null },
      { id: 'student_what_i_missed', label: 'What I Missed', icon: Icons.Clock, badge: 'Catch Up', badgeType: 'warning' },
      { id: 'student_class_memory', label: 'Class Memory', icon: Icons.BookOpen, badge: null },
      { id: 'student_ai_assistant', label: 'AI Dept Assistant', icon: Icons.Shield, badge: 'AI', badgeType: 'primary' },
      { id: 'student_bus', label: 'College Bus Transit', icon: Icons.Building, badge: 'Route 04' },
      { id: 'student_academic_records', label: 'Academic Records', icon: Icons.Award, badge: 'Sem 1-6' },
      { id: 'student_helpdesk', label: 'Helpdesk & Feedback', icon: Icons.HelpCircle, badge: null },
      { id: 'student_notices', label: 'Notices & Circulars', icon: Icons.Bell, badge: 'New', badgeType: 'primary' },
      { id: 'student_events', label: 'Campus Events', icon: Icons.Calendar, badge: 'Upcoming' },
      { id: 'student_privacy', label: 'FERPA Privacy Vault', icon: Icons.Lock, badge: 'FERPA' }
    ],
    Teacher: [
      { id: 'teacher_overview', label: 'Faculty Dashboard', icon: Icons.BookOpen, badge: null },
      { id: 'teacher_timetable', label: 'Assigned Timetable', icon: Icons.Calendar, badge: null },
      { id: 'teacher_attendance', label: 'Session & Biometric Roster', icon: Icons.UserCheck, badge: 'Biometric', badgeType: 'primary' },
      { id: 'teacher_geo_roster', label: 'GPS Geofence Roster', icon: Icons.MapPin, badge: 'Live GPS', badgeType: 'primary' },
      { id: 'teacher_marks', label: 'Continuous Marks Entry', icon: Icons.Edit, badge: 'IA1 Draft' },
      { id: 'teacher_assignments', label: 'Manage Assignments', icon: Icons.UploadCloud, badge: '3' },
      { id: 'teacher_materials', label: 'Upload Materials', icon: Icons.FileText, badge: null },
      { id: 'teacher_exams', label: 'Invigilation Roster', icon: Icons.Award, badge: 'Midterm' },
      { id: 'teacher_notices', label: 'Circulars & Notices', icon: Icons.Bell, badge: null }
    ],
    HOD: [
      { id: 'hod_overview', label: 'Dashboard', icon: Icons.Building, badge: 'CSE' },
      { id: 'hdr_student_mgmt', label: 'STUDENT MANAGEMENT', isHeader: true },
      { id: 'hod_students', label: 'All Students', icon: Icons.Users, badge: 'Sem 1-8', badgeType: 'primary', isSubItem: true },
      { id: 'hod_students_sem_1', label: '1st Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_2', label: '2nd Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_3', label: '3rd Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_4', label: '4th Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_5', label: '5th Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_6', label: '6th Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_7', label: '7th Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_students_sem_8', label: '8th Semester', icon: Icons.BookOpen, isSubItem: true },
      { id: 'hod_add_student', label: '+ Add Student', icon: Icons.UserCheck, badge: 'Register', badgeType: 'primary', isSubItem: true },
      { id: 'hod_student_history', label: 'Academic History', icon: Icons.Award, badge: 'Audit', isSubItem: true },
      { id: 'hdr_faculty', label: 'FACULTY MANAGEMENT', isHeader: true },
      { id: 'hod_teachers', label: 'All Teachers', icon: Icons.Users, badge: 'Faculty', isSubItem: true },
      { id: 'hod_add_teacher', label: '+ Add New Teacher', icon: Icons.UserCheck, badge: 'HOD Only', badgeType: 'primary', isSubItem: true },
      { id: 'hod_timetable', label: 'Timetable', icon: Icons.Calendar, badge: '2 Shifts' },
      { id: 'hod_sessions', label: 'Live Sessions', icon: Icons.Clock, badge: 'Active' },
      { id: 'hod_attendance', label: 'Attendance', icon: Icons.AlertTriangle, badge: '< 75%', badgeType: 'warning' },
      { id: 'hod_geofence', label: 'Campus Geofence & GPS', icon: Icons.MapPin, badge: 'NH 766', badgeType: 'primary' },
      { id: 'hod_marks', label: 'Exams & Marks', icon: Icons.CheckCircle, badge: 'Review' },
      { id: 'hod_rooms', label: 'Rooms & Labs', icon: Icons.Building, badge: 'Alerts', badgeType: 'warning' },
      { id: 'hod_materials', label: 'Study Materials', icon: Icons.BookOpen, badge: null },
      { id: 'hod_assignments', label: 'Assignments', icon: Icons.FileText, badge: null },
      { id: 'hod_notices', label: 'Notifications', icon: Icons.Bell, badge: null },
      { id: 'hod_bus', label: 'Bus Information', icon: Icons.Building, badge: null },
      { id: 'hod_reports', label: 'Reports', icon: Icons.FileText, badge: 'KPIs' },
      { id: 'hod_audit', label: 'Settings & Audit', icon: Icons.Lock, badge: 'Immutable' }
    ],
    Admin: [
      { id: 'admin_overview', label: 'University Command', icon: Icons.Shield, badge: null },
      { id: 'hdr_admin_student_mgmt', label: 'STUDENT MANAGEMENT', isHeader: true },
      { id: 'admin_students', label: 'Student Management (Sem 1-8)', icon: Icons.GraduationCap, badge: 'All Sems', badgeType: 'primary', isSubItem: true },
      { id: 'admin_users', label: 'Master User Directory', icon: Icons.Users, badge: 'All Roles' },
      { id: 'hdr_admin_faculty', label: 'FACULTY MANAGEMENT', isHeader: true },
      { id: 'hod_teachers', label: 'All Teachers', icon: Icons.Users, badge: 'Faculty', isSubItem: true },
      { id: 'hod_add_teacher', label: '+ Add New Teacher', icon: Icons.UserCheck, badge: 'Admin/HOD', badgeType: 'primary', isSubItem: true },
      { id: 'admin_departments', label: 'Academic Departments', icon: Icons.Building, badge: '5 Depts' },
      { id: 'admin_subjects', label: 'Course Catalog & Credits', icon: Icons.BookOpen, badge: null },
      { id: 'admin_semesters', label: 'Semester Configuration', icon: Icons.Calendar, badge: 'Sem 1-8' },
      { id: 'admin_rooms', label: 'Campus Infrastructure', icon: Icons.Building, badge: null },
      { id: 'admin_geofence', label: 'Campus Geofence Config', icon: Icons.MapPin, badge: '300m Radius', badgeType: 'primary' },
      { id: 'admin_timetable', label: 'Institutional Timetable', icon: Icons.Calendar, badge: null },
      { id: 'admin_sessions', label: 'Live Session Engine', icon: Icons.Clock, badge: 'Active' },
      { id: 'admin_roles', label: 'Role & Permission RBAC', icon: Icons.Shield, badge: null },
      { id: 'admin_reports', label: 'Institutional Intelligence', icon: Icons.FileText, badge: 'Analytics' },
      { id: 'admin_audit', label: 'Security & Audit Logs', icon: Icons.Lock, badge: 'Immutable' },
      { id: 'admin_settings', label: 'System Settings', icon: Icons.Shield, badge: null }
    ]
  };

  const activeMenuItems = menuConfig[role] || menuConfig['Student'];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-role-indicator">
        <div className="sidebar-role-tag">Academic Portal</div>
        <div className="sidebar-role-name">{role || 'Student'} Portal</div>
      </div>

      <nav className="sidebar-nav">
        {activeMenuItems.map((item) => {
          if (item.isHeader) {
            return !isCollapsed ? (
              <div key={item.id} className="sidebar-section-header">
                {item.label}
              </div>
            ) : null;
          }
          const Icon = item.icon || Icons.FileText;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${isActive ? 'active' : ''} ${item.isSubItem ? 'sidebar-subitem' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="sidebar-link-icon">
                <Icon size={18} />
              </span>
              {!isCollapsed && (
                <>
                  <span className="sidebar-link-label">{item.label}</span>
                  {item.badge && (
                    <span className={`sidebar-link-badge ${item.badgeType === 'warning' ? 'badge-warning' : item.badgeType === 'primary' ? 'badge-primary' : 'badge-slate'}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Card */}
      {!isCollapsed && user && (
        <div className="sidebar-footer-card">
          <div className="footer-card-header">
            <Icons.Lock size={15} className="text-emerald" />
            <span className="footer-card-title">FERPA Compliance</span>
          </div>
          <p className="footer-card-desc">
            {role === 'Student' 
              ? `Individual privacy isolation: Only ${user.name}'s records accessible.`
              : role === 'Teacher'
              ? `Faculty authority over assigned CSE cohorts.`
              : role === 'HOD'
              ? `Departmental authority over CSE faculties and records.`
              : `Root supervisor with immutable audit trail.`}
          </p>
        </div>
      )}
    </aside>
  );
}

window.Sidebar = Sidebar;
