// CampusConnect Top Navigation Bar with Academic Session Context, Global Search & Fast Role Switcher

function Navbar({ onOpenLogin, onToggleSidebar, isSidebarCollapsed, onOpenSearch }) {
  const { user, role, logout, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const notifications = window.masterDB.db.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors = {
    Student: 'badge-blue',
    Teacher: 'badge-purple',
    HOD: 'badge-amber',
    Admin: 'badge-rose'
  };

  const handleRoleSelect = (targetRole) => {
    switchRole(targetRole);
    setShowRoleMenu(false);
  };

  return (
    <header className="app-navbar">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="navbar-left">
        <button 
          className="navbar-toggle-btn" 
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label="Toggle Navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div 
          className="navbar-brand" 
          style={{ cursor: 'pointer' }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('changeTab', { detail: 'campus_landing' }));
          }}
          title="CampusConnect // Return to Campus Landing & Hero Gateway"
        >
          <div className="navbar-logo-circle">
            <Icons.GraduationCap size={22} className="brand-icon" />
          </div>
          <div className="navbar-brand-text">
            <span className="brand-name">CampusConnect</span>
            <span className="brand-tag">Smart Department ERP &bull; 2.5</span>
          </div>
        </div>

        {/* Academic Context Badge (Requirement 4 & 13) */}
        <div className="academic-context-pill">
          <span className="context-indicator-dot"></span>
          <span className="context-academic-year">AY 2024-25</span>
          <span className="context-divider">/</span>
          <span className="context-term">Even Semester</span>
          {user?.department && (
            <>
              <span className="context-divider">/</span>
              <span className="context-dept">{user.department} Dept</span>
            </>
          )}
          {user?.semester && (
            <>
              <span className="context-divider">/</span>
              <span className="context-sem">Sem {user.semester}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Global Search, Role Switcher, Notifications & Profile */}
      <div className="navbar-right">
        {/* Global Search Button (Requirement 75) */}
        <button 
          className="nav-search-trigger-btn"
          onClick={onOpenSearch}
          title="Search anything (students, faculty, subjects, rooms, bus)"
        >
          <Icons.Search size={16} />
          <span className="search-btn-label">Quick Search...</span>
          <kbd className="search-kbd">Ctrl K</kbd>
        </button>

        {/* Fast Role Switcher Dropdown */}
        <div className="nav-dropdown-wrapper">
          <button 
            className="role-switch-button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            title="Switch user role instantly for testing"
          >
            <span className="role-switch-label">Role:</span>
            <span className={`badge ${roleColors[role] || 'badge-primary'}`}>{role || 'Guest'}</span>
            <Icons.ChevronRight size={14} className={`dropdown-chevron ${showRoleMenu ? 'rotate-90' : ''}`} />
          </button>

          {showRoleMenu && (
            <div className="nav-dropdown-menu role-menu">
              <div className="dropdown-menu-header">
                <span>Select Evaluation Persona</span>
              </div>
              <div className="role-menu-item" onClick={() => handleRoleSelect('Student')}>
                <div className="role-menu-icon student-bg"><Icons.GraduationCap size={16} /></div>
                <div className="role-menu-text">
                  <div className="role-menu-title">Student View</div>
                  <div className="role-menu-sub">Aarav Sharma &bull; CSE Sem 6 Sec A</div>
                </div>
                {role === 'Student' && <Icons.CheckCircle size={16} className="text-emerald" />}
              </div>

              <div className="role-menu-item" onClick={() => handleRoleSelect('Teacher')}>
                <div className="role-menu-icon teacher-bg"><Icons.BookOpen size={16} /></div>
                <div className="role-menu-text">
                  <div className="role-menu-title">Teacher (Faculty)</div>
                  <div className="role-menu-sub">Prof. Ananya Iyer &bull; CSE Dept</div>
                </div>
                {role === 'Teacher' && <Icons.CheckCircle size={16} className="text-emerald" />}
              </div>

              <div className="role-menu-item" onClick={() => handleRoleSelect('HOD')}>
                <div className="role-menu-icon hod-bg"><Icons.Building size={16} /></div>
                <div className="role-menu-text">
                  <div className="role-menu-title">Head of Dept (HOD)</div>
                  <div className="role-menu-sub">Dr. Vikramaditya Sen &bull; CSE</div>
                </div>
                {role === 'HOD' && <Icons.CheckCircle size={16} className="text-emerald" />}
              </div>

              <div className="role-menu-item" onClick={() => handleRoleSelect('Admin')}>
                <div className="role-menu-icon admin-bg"><Icons.Shield size={16} /></div>
                <div className="role-menu-text">
                  <div className="role-menu-title">Administrator</div>
                  <div className="role-menu-sub">Dr. Robert Hawthorne (Registrar)</div>
                </div>
                {role === 'Admin' && <Icons.CheckCircle size={16} className="text-emerald" />}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell (Requirement 52) */}
        <div className="nav-dropdown-wrapper">
          <button 
            className="nav-icon-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Institutional Notices & Smart Notifications"
          >
            <Icons.Bell size={19} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="nav-dropdown-menu notification-menu">
              <div className="dropdown-menu-header">
                <span>Smart Notifications</span>
                <span className="badge badge-primary">{unreadCount} Unread</span>
              </div>
              <div className="notification-list">
                {notifications.map(item => (
                  <div key={item.id} className="notification-item">
                    <div className="notif-header">
                      <span className="notif-category">{item.type}</span>
                      <span className="notif-date">{item.timestamp}</span>
                    </div>
                    <div className="notif-title">{item.title}</div>
                    <div className="notif-summary">{item.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        {user ? (
          <div className="nav-dropdown-wrapper">
            <div 
              className="user-profile-pill" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img src={user.avatar} alt={user.name} className="user-avatar-img" />
              <div className="user-profile-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <Icons.ChevronRight size={14} className={`dropdown-chevron ${showProfileMenu ? 'rotate-90' : ''}`} />
            </div>

            {showProfileMenu && (
              <div className="nav-dropdown-menu profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-name">{user.name}</div>
                  <div className="profile-menu-email">{user.email}</div>
                  <div className="profile-menu-tag">Role: {user.role} {user.rollNo ? `(${user.rollNo})` : ''}</div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); onOpenLogin(); }}>
                  <Icons.Google size={16} />
                  <span>Switch College Account (SSO)</span>
                </div>

                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); window.dispatchEvent(new CustomEvent('changeTab', { detail: 'campus_landing' })); }}>
                  <Icons.Building size={16} />
                  <span>Campus Landing Hero View</span>
                </div>

                <div className="profile-menu-item text-danger" onClick={() => { setShowProfileMenu(false); logout(); }}>
                  <Icons.LogOut size={16} />
                  <span>Sign Out</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenLogin}>
            <Icons.Google size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

window.Navbar = Navbar;
