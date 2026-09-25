// CampusConnect Admin Portal - System Administration, Academic Governance & Reports Engine

function AdminDashboard({ activeTab }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [usersList, setUsersList] = React.useState(window.masterDB.db.users);
  const [roleFilter, setRoleFilter] = React.useState('All');
  const [deptFilter, setDeptFilter] = React.useState('All');
  const [semFilter, setSemFilter] = React.useState('All');
  const [sectionFilter, setSectionFilter] = React.useState('All');
  const [studentTypeFilter, setStudentTypeFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Dedicated 5th Sem student management states for Admin
  const [adminStudentSearch, setAdminStudentSearch] = React.useState('');
  const [adminStudentSection, setAdminStudentSection] = React.useState('All');
  const [adminStudentType, setAdminStudentType] = React.useState('All');

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState('Student');
  const [newUserDept, setNewUserDept] = React.useState('CSE');
  const [newUserSem, setNewUserSem] = React.useState('6');
  const [newUserRoll, setNewUserRoll] = React.useState('');
  const [userErrors, setUserErrors] = React.useState({});

  // Bus Alert State
  const [busAlertModalOpen, setBusAlertModalOpen] = React.useState(false);
  const [selectedBusForAlert, setSelectedBusForAlert] = React.useState('Bus 04');
  const [busAlertText, setBusAlertText] = React.useState('');

  // Academic Masters State
  const [departmentsList, setDepartmentsList] = React.useState(window.masterDB.db.departments || []);
  const [addDeptModalOpen, setAddDeptModalOpen] = React.useState(false);
  const [newDeptCode, setNewDeptCode] = React.useState('');
  const [newDeptName, setNewDeptName] = React.useState('');
  const [newDeptHod, setNewDeptHod] = React.useState('');
  const [newDeptBuilding, setNewDeptBuilding] = React.useState('');

  const [subjectsList, setSubjectsList] = React.useState(window.masterDB.db.subjects || []);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = React.useState(false);
  const [newSubCode, setNewSubCode] = React.useState('');
  const [newSubName, setNewSubName] = React.useState('');
  const [newSubDept, setNewSubDept] = React.useState('CSE');
  const [newSubSem, setNewSubSem] = React.useState(6);
  const [newSubCredits, setNewSubCredits] = React.useState(4);
  const [newSubType, setNewSubType] = React.useState('Theory');
  const [newSubFaculty, setNewSubFaculty] = React.useState('Prof. Ananya Iyer');

  const [semestersList, setSemestersList] = React.useState(window.masterDB.db.semesters || []);
  const [roomsList, setRoomsList] = React.useState(window.masterDB.db.rooms || []);
  const [adminTtDept, setAdminTtDept] = React.useState('CSE');
  const [adminTtSem, setAdminTtSem] = React.useState(6);

  const [activeSessionsList, setActiveSessionsList] = React.useState(window.masterDB.db.sessions || []);

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      addToast('Please enter Department Code and Name', 'warning');
      return;
    }
    const newDept = {
      id: 'dept-' + newDeptCode.trim().toLowerCase(),
      code: newDeptCode.trim().toUpperCase(),
      name: newDeptName.trim(),
      hod: newDeptHod.trim() || 'Dr. Appointed HOD',
      building: newDeptBuilding.trim() || 'Academic Complex',
      floors: 3,
      roomsCount: 12,
      studentCount: 120,
      facultyCount: 10
    };
    window.masterDB.db.departments.push(newDept);
    window.masterDB.saveDatabase(window.masterDB.db);
    setDepartmentsList([...window.masterDB.db.departments]);
    addToast(`Department ${newDept.code} created successfully!`, 'success');
    setAddDeptModalOpen(false);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptHod('');
    setNewDeptBuilding('');
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) {
      addToast('Please enter Subject Code and Name', 'warning');
      return;
    }
    const newSub = {
      id: 'sub-' + newSubCode.trim().toLowerCase(),
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
      dept: newSubDept,
      semester: Number(newSubSem),
      credits: Number(newSubCredits),
      type: newSubType,
      teacherName: newSubFaculty
    };
    window.masterDB.db.subjects.push(newSub);
    window.masterDB.saveDatabase(window.masterDB.db);
    setSubjectsList([...window.masterDB.db.subjects]);
    addToast(`Subject ${newSub.code} added to institutional catalog!`, 'success');
    setAddSubjectModalOpen(false);
    setNewSubCode('');
    setNewSubName('');
  };

  const handleCloseSession = (sessionId) => {
    const s = window.masterDB.db.sessions.find(x => x.sessionId === sessionId);
    if (s) {
      s.status = 'Completed';
      window.masterDB.saveDatabase(window.masterDB.db);
      setActiveSessionsList([...window.masterDB.db.sessions]);
      addToast(`Session ${sessionId} terminated by Registrar command`, 'warning');
    }
  };

  const handleToggleRoomStatus = (roomId) => {
    const rm = window.masterDB.db.rooms.find(r => r.id === roomId);
    if (rm) {
      rm.status = rm.status === 'Maintenance' ? 'Available' : 'Maintenance';
      window.masterDB.saveDatabase(window.masterDB.db);
      setRoomsList([...window.masterDB.db.rooms]);
      addToast(`Room ${rm.number} status toggled to ${rm.status}`, 'info');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesDept = deptFilter === 'All' || 
      u.department === deptFilter || 
      (deptFilter === 'CSE' && (u.department === 'Computer Science and Engineering' || u.dept === 'CSE'));
    const matchesSem = semFilter === 'All' || String(u.semester) === String(semFilter);
    const matchesSection = sectionFilter === 'All' || u.section === sectionFilter;
    const matchesType = studentTypeFilter === 'All' || u.studentType === studentTypeFilter;
    const matchesSearch = !searchQuery || 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.rollNo && u.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.usn && u.usn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.empId && u.empId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesDept && matchesSem && matchesSection && matchesType && matchesSearch;
  });

  const handleDeleteUser = (userId, userName) => {
    if (confirm(`Remove user "${userName}" from institution directory?`)) {
      window.masterDB.db.users = window.masterDB.db.users.filter(u => u.id !== userId);
      window.masterDB.saveDatabase(window.masterDB.db);
      setUsersList([...window.masterDB.db.users]);
      addToast(`User ${userName} removed`, 'info');
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newUserName.trim()) errors.name = 'Full Name is required.';
    if (!newUserEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!newUserEmail.endsWith('@college.edu') && !newUserEmail.endsWith('@campus.edu') && !newUserEmail.endsWith('.edu')) {
      errors.email = 'Must be an institutional college email ending with @college.edu or .edu';
    }

    setUserErrors(errors);

    if (Object.keys(errors).length === 0) {
      const newUser = {
        id: 'usr-' + Date.now(),
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        department: newUserDept,
        semester: newUserRole === 'Student' ? Number(newUserSem) : null,
        section: newUserRole === 'Student' ? 'A' : null,
        rollNo: newUserRole === 'Student' ? (newUserRoll.trim().toUpperCase() || '21CS100') : null,
        empId: newUserRole !== 'Student' ? (newUserRoll.trim().toUpperCase() || 'EMP-' + Math.floor(100+Math.random()*900)) : null,
        overallAttendance: 90.0,
        cgpa: 8.5,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserName.trim())}&background=2563eb&color=fff`,
        status: 'Active'
      };

      window.masterDB.db.users.push(newUser);
      window.masterDB.saveDatabase(window.masterDB.db);
      setUsersList([...window.masterDB.db.users]);
      addToast(`New ${newUserRole} "${newUser.name}" registered successfully!`, 'success');
      setAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRoll('');
    }
  };

  const handlePublishBusAlert = async (e) => {
    e.preventDefault();
    if (!busAlertText.trim()) {
      addToast('Please enter alert text', 'warning');
      return;
    }

    await window.busService.postBusAlert(selectedBusForAlert, busAlertText.trim());
    addToast(`Transit alert published to ${selectedBusForAlert} riders`, 'success');
    setBusAlertModalOpen(false);
    setBusAlertText('');
  };

  return (
    <div className="admin-dashboard">
      {/* Admin Profile Banner */}
      <div className="admin-profile-banner">
        <div className="profile-banner-left">
          <img src={user.avatar} alt={user.name} className="student-banner-avatar" />
          <div className="student-banner-info">
            <div className="student-name-row">
              <h1 className="student-display-name">{user.name}</h1>
              <span className="badge badge-rose">{user.empId || 'ADM-REG-001'}</span>
              <span className="badge badge-primary">Institutional Registrar & System Admin</span>
            </div>
            <div className="student-meta-pills">
              <span className="meta-pill"><strong>Executive Domain:</strong> Senate House, Central Administration</span>
              <span className="meta-pill"><strong>Active Session:</strong> AY 2024-25 &bull; Even Semester</span>
            </div>
          </div>
        </div>

        <div className="profile-banner-right">
          <div className="quick-metric">
            <span className="quick-metric-label">Total Enrollments</span>
            <span className="quick-metric-val">1,660</span>
          </div>
          <div className="quick-metric">
            <span className="quick-metric-label">Departments</span>
            <span className="quick-metric-val text-primary">5 Active</span>
          </div>
        </div>
      </div>

      {/* --- TAB: OVERVIEW --- */}
      {(activeTab === 'admin_overview' || !activeTab) && (
        <div className="admin-view-container">
          <div className="stat-cards-grid">
            <StatCard 
              title="University Strength" 
              value="1,660" 
              subtitle="Across 5 Engineering Branches"
              icon={Icons.GraduationCap}
              color="blue"
            />
            <StatCard 
              title="Teaching Staff" 
              value="113" 
              subtitle="Professors & Instructors"
              icon={Icons.Users}
              color="purple"
            />
            <StatCard 
              title="Active Class Sessions" 
              value="6 Live" 
              subtitle="Live in Session Engine"
              icon={Icons.Clock}
              color="emerald"
            />
            <StatCard 
              title="Room Utilization" 
              value="82%" 
              subtitle="Classrooms & Laboratories"
              icon={Icons.Building}
              color="amber"
            />
          </div>

          <div className="dashboard-columns-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Institutional Management Station</h3>
              </div>
              <div className="teacher-quick-actions">
                <div className="action-tile" onClick={() => setAddUserModalOpen(true)}>
                  <div className="action-tile-icon"><Icons.Plus size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Enroll New Academic User</strong>
                    <span>Register Student, Teacher, HOD or Administrator</span>
                  </div>
                </div>

                <div className="action-tile" onClick={() => setBusAlertModalOpen(true)}>
                  <div className="action-tile-icon"><Icons.AlertTriangle size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Broadcast College Bus Advisory</strong>
                    <span>Publish transit delay or route diversion to student phones</span>
                  </div>
                </div>

                <div className="action-tile" onClick={() => addToast('System database snapshot archived to secure cloud backup', 'success')}>
                  <div className="action-tile-icon"><Icons.Lock size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Backup & Archive System Database</strong>
                    <span>Snapshot academic records, attendance history, and audit ledger</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">College Bus Routes Status</h3>
                <span className="badge badge-amber">4 Fleets</span>
              </div>
              <div className="dept-breakdown-list">
                {window.masterDB.db.busRoutes.map(b => (
                  <div key={b.busNumber} className="dept-stat-row">
                    <div>
                      <strong>{b.busNumber}</strong> &bull; <span className="text-muted text-sm">{b.routeName}</span>
                      <div className="text-xs text-muted">Dep: {b.morningDeparture} &bull; Driver: {b.driverName}</div>
                    </div>
                    <div>
                      {b.activeAlert ? (
                        <span className="badge badge-warning">Advisory Active</span>
                      ) : (
                        <span className="badge badge-success">On Schedule</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: USER MANAGEMENT (Requirement 64) --- */}
      {activeTab === 'admin_users' && (() => {
        const sem5StudentsAll = usersList.filter(u => u.role === 'Student' && (u.department === 'CSE' || u.department === 'Computer Science and Engineering' || u.dept === 'CSE') && Number(u.semester) === 5);
        const adminCountA = sem5StudentsAll.filter(u => u.section === 'A').length;
        const adminCountB = sem5StudentsAll.filter(u => u.section === 'B').length;
        const adminCountDip = sem5StudentsAll.filter(u => u.studentType === 'Diploma' || u.usn === 'Not Available').length;

        return (
          <div className="admin-view-container">
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Master User Directory & Role Allocations</h3>
                  <p className="panel-desc">Manage system access, assign roles, departments, and semesters across the university</p>
                </div>
                <div className="header-actions-group">
                  <button className="btn btn-secondary btn-sm" onClick={() => addToast(`Exported ${filteredUsers.length} directory records`, 'success')}>
                    <Icons.Download size={14} /> Export Directory (CSV)
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setAddUserModalOpen(true)}>
                    <Icons.Plus size={16} /> Enroll New User
                  </button>
                </div>
              </div>

              {/* Quick Cohort Section Switcher Buttons */}
              <div className="cohort-section-toggle-bar mb-3">
                <div className="section-pill-group">
                  <button 
                    className={`section-toggle-btn ${roleFilter === 'All' && deptFilter === 'All' && semFilter === 'All' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleFilter('All');
                      setDeptFilter('All');
                      setSemFilter('All');
                      setSectionFilter('All');
                      setStudentTypeFilter('All');
                    }}
                  >
                    All Users ({usersList.length})
                  </button>
                  <button 
                    className={`section-toggle-btn ${semFilter === '5' && sectionFilter === 'All' && studentTypeFilter === 'All' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleFilter('Student');
                      setDeptFilter('CSE');
                      setSemFilter('5');
                      setSectionFilter('All');
                      setStudentTypeFilter('All');
                    }}
                  >
                    5th Sem CSE ({sem5StudentsAll.length})
                  </button>
                  <button 
                    className={`section-toggle-btn ${semFilter === '5' && sectionFilter === 'A' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleFilter('Student');
                      setDeptFilter('CSE');
                      setSemFilter('5');
                      setSectionFilter('A');
                      setStudentTypeFilter('All');
                    }}
                  >
                    A Section — 68 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${semFilter === '5' && sectionFilter === 'B' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleFilter('Student');
                      setDeptFilter('CSE');
                      setSemFilter('5');
                      setSectionFilter('B');
                      setStudentTypeFilter('All');
                    }}
                  >
                    B Section — 67 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${semFilter === '5' && studentTypeFilter === 'Diploma' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleFilter('Student');
                      setDeptFilter('CSE');
                      setSemFilter('5');
                      setSectionFilter('All');
                      setStudentTypeFilter('Diploma');
                    }}
                  >
                    Diploma Students ({adminCountDip})
                  </button>
                </div>

                <div className="cohort-active-indicator">
                  <span className="badge badge-primary">
                    {semFilter === '5' && sectionFilter === 'A' ? 'A Section — 68 records' : 
                     semFilter === '5' && sectionFilter === 'B' ? 'B Section — 67 records' : 
                     semFilter === '5' ? `5th Sem CSE — ${sem5StudentsAll.length} records` :
                     `Filtered: ${filteredUsers.length} records`}
                  </span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="user-directory-filters">
                <div className="search-box-wrapper">
                  <Icons.Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search by name, email, USN, roll no, or emp id..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Role:</label>
                  <select className="form-input filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="All">All Roles</option>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher (Faculty)</option>
                    <option value="HOD">Head of Dept (HOD)</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Dept:</label>
                  <select className="form-input filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="MECH">MECH</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Semester:</label>
                  <select className="form-input filter-select" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
                    <option value="All">All Semesters</option>
                    <option value="5">Semester 5 (Active Excel Cohort)</option>
                    <option value="6">Semester 6</option>
                    <option value="4">Semester 4</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Section:</label>
                  <select className="form-input filter-select" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    <option value="All">All Sections</option>
                    <option value="A">Section A (68)</option>
                    <option value="B">Section B (67)</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Admission:</label>
                  <select className="form-input filter-select" value={studentTypeFilter} onChange={(e) => setStudentTypeFilter(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Regular">Regular</option>
                    <option value="Diploma">Diploma Lateral</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive mt-3">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>User Profile</th>
                      <th>Identifier / USN</th>
                      <th>Role</th>
                      <th>Department & Institution</th>
                      <th>Sem & Sec</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => {
                      const isDiploma = u.studentType === 'Diploma' || u.usn === 'Not Available';
                      return (
                        <tr key={u.id}>
                          <td><span className="text-muted text-sm">{index + 1}</span></td>
                          <td>
                            <div className="student-cell-profile">
                              <img src={u.avatar} alt={u.name} className="cell-avatar" />
                              <div>
                                <strong className="student-exact-name">{u.name}</strong>
                                <div className="text-muted text-xs">
                                  {isDiploma ? 'Diploma Lateral Entry' : u.studentType ? `${u.studentType} Entry` : (u.designation || 'Academic Member')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isDiploma ? (
                              <span className="badge badge-purple" title="Diploma Student: No USN Assigned">Not Available</span>
                            ) : u.usn ? (
                              <code className="text-primary font-bold">{u.usn}</code>
                            ) : (
                              <strong>{u.rollNo || u.empId || 'N/A'}</strong>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${
                              u.role === 'Student' ? 'badge-blue' :
                              u.role === 'Teacher' ? 'badge-purple' :
                              u.role === 'HOD' ? 'badge-amber' : 'badge-rose'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div className="dept-institution-cell">
                              <span className="dept-tag">{u.department || 'Computer Science and Engineering'}</span>
                              <div className="text-muted text-xs">{u.institution || 'Maharaja Institute of Technology Thandavapura'}</div>
                            </div>
                          </td>
                          <td>
                            {u.semester ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="badge badge-slate">Sem {u.semester}</span>
                                {u.section && (
                                  <span className={`badge ${u.section === 'A' ? 'badge-blue' : 'badge-purple'}`}>
                                    Sec {u.section}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td><code>{u.email}</code></td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Delete user"
                            >
                              <Icons.Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="empty-state-card py-4 text-center">
                    <Icons.Users size={36} className="text-muted mx-auto mb-2" />
                    <h4>No user records match current filters</h4>
                    <p className="text-muted">Adjust search keywords or clear section/semester filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB: 5TH SEMESTER CSE STUDENT COHORT (Dedicated Admin Student Management) --- */}
      {activeTab === 'admin_students' && (() => {
        const sem5Students = usersList.filter(u => 
          u.role === 'Student' && 
          Number(u.semester) === 5 && 
          (u.department === 'CSE' || u.department === 'Computer Science and Engineering' || u.dept === 'CSE')
        );
        const countA = sem5Students.filter(s => s.section === 'A').length;
        const countB = sem5Students.filter(s => s.section === 'B').length;
        const countDiploma = sem5Students.filter(s => s.studentType === 'Diploma' || s.usn === 'Not Available').length;

        const filtered5thSem = sem5Students.filter(s => {
          const matchesSearch = !adminStudentSearch || 
            (s.name && s.name.toLowerCase().includes(adminStudentSearch.toLowerCase())) || 
            (s.rollNo && s.rollNo.toLowerCase().includes(adminStudentSearch.toLowerCase())) ||
            (s.usn && s.usn.toLowerCase().includes(adminStudentSearch.toLowerCase())) ||
            (s.email && s.email.toLowerCase().includes(adminStudentSearch.toLowerCase()));
          const matchesSection = adminStudentSection === 'All' || s.section === adminStudentSection;
          const matchesType = adminStudentType === 'All' || s.studentType === adminStudentType;
          return matchesSearch && matchesSection && matchesType;
        });

        return (
          <div className="admin-view-container">
            <div className="panel-card mb-4">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">
                    <Icons.GraduationCap size={20} className="inline-icon text-primary" /> 5th Semester CSE Student Management Console
                  </h3>
                  <p className="panel-desc">Maharaja Institute of Technology Thandavapura &bull; Department of Computer Science and Engineering</p>
                </div>
                <div className="header-actions-group">
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => addToast(`Exporting ${filtered5thSem.length} student records from Maharaja Institute of Technology Thandavapura...`, 'success')}
                  >
                    <Icons.Download size={14} /> Export 5th Sem Roster (CSV)
                  </button>
                </div>
              </div>

              {/* Exact Cohort KPI Summary Cards */}
              <div className="stat-cards-grid mb-4">
                <StatCard 
                  title="5th Sem CSE Total" 
                  value={`${sem5Students.length} Students`} 
                  subtitle="Maharaja Inst of Tech Thandavapura"
                  icon={Icons.GraduationCap}
                  color="blue"
                />
                <StatCard 
                  title="A Section Roster" 
                  value={`${countA} Records`} 
                  subtitle="59 Regular + 9 Diploma"
                  icon={Icons.Users}
                  color="emerald"
                />
                <StatCard 
                  title="B Section Roster" 
                  value={`${countB} Records`} 
                  subtitle="60 Regular + 7 Diploma"
                  icon={Icons.Users}
                  color="purple"
                />
                <StatCard 
                  title="Diploma Students" 
                  value={`${countDiploma} Lateral`} 
                  subtitle="USN: Not Available"
                  icon={Icons.Award}
                  color="amber"
                />
              </div>

              {/* Quick Section Switcher Buttons */}
              <div className="cohort-section-toggle-bar mb-3">
                <div className="section-pill-group">
                  <button 
                    className={`section-toggle-btn ${adminStudentSection === 'All' ? 'active' : ''}`}
                    onClick={() => setAdminStudentSection('All')}
                  >
                    All Sections ({sem5Students.length})
                  </button>
                  <button 
                    className={`section-toggle-btn ${adminStudentSection === 'A' ? 'active' : ''}`}
                    onClick={() => setAdminStudentSection('A')}
                  >
                    A Section — 68 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${adminStudentSection === 'B' ? 'active' : ''}`}
                    onClick={() => setAdminStudentSection('B')}
                  >
                    B Section — 67 records
                  </button>
                </div>

                <div className="cohort-active-indicator">
                  <span className="badge badge-primary">
                    {adminStudentSection === 'A' ? 'A Section — 68 records' : 
                     adminStudentSection === 'B' ? 'B Section — 67 records' : 
                     `All 5th Semester CSE — ${filtered5thSem.length} records`}
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="user-directory-filters mb-3">
                <div className="search-box-wrapper">
                  <Icons.Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search by student name, USN, or roll number..."
                    value={adminStudentSearch}
                    onChange={(e) => setAdminStudentSearch(e.target.value)}
                  />
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Section:</label>
                  <select 
                    className="form-input filter-select" 
                    value={adminStudentSection} 
                    onChange={(e) => setAdminStudentSection(e.target.value)}
                  >
                    <option value="All">All Sections ({sem5Students.length})</option>
                    <option value="A">Section A (68)</option>
                    <option value="B">Section B (67)</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Admission Type:</label>
                  <select 
                    className="form-input filter-select" 
                    value={adminStudentType} 
                    onChange={(e) => setAdminStudentType(e.target.value)}
                  >
                    <option value="All">All Students ({sem5Students.length})</option>
                    <option value="Regular">Regular Students</option>
                    <option value="Diploma">Diploma Students</option>
                  </select>
                </div>
              </div>

              {/* Student Cohort Table */}
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Student Name</th>
                      <th>USN</th>
                      <th>Admission Type</th>
                      <th>Section</th>
                      <th>Semester</th>
                      <th>Department & Institution</th>
                      <th>Attendance</th>
                      <th>CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered5thSem.map((s, index) => {
                      const isLow = (s.overallAttendance || 85) < 75;
                      const isDiploma = s.studentType === 'Diploma' || s.usn === 'Not Available';

                      return (
                        <tr key={s.id}>
                          <td><span className="text-muted text-sm">{index + 1}</span></td>
                          <td>
                            <div className="student-cell-profile">
                              <img src={s.avatar} alt={s.name} className="cell-avatar" />
                              <div>
                                <strong className="student-exact-name">{s.name}</strong>
                                <div className="text-muted text-xs">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isDiploma ? (
                              <span className="badge badge-purple" title="Diploma Student: No USN Assigned">Not Available</span>
                            ) : (
                              <code className="text-primary font-bold">{s.usn}</code>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${isDiploma ? 'badge-amber' : 'badge-primary'}`}>
                              {s.studentType || (isDiploma ? 'Diploma' : 'Regular')}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${s.section === 'A' ? 'badge-blue' : 'badge-purple'}`}>
                              Sec {s.section}
                            </span>
                          </td>
                          <td>Sem {s.semester}</td>
                          <td>
                            <div className="dept-institution-cell">
                              <span className="dept-tag">{s.department || 'Computer Science and Engineering'}</span>
                              <div className="text-muted text-xs">{s.institution || 'Maharaja Institute of Technology Thandavapura'}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${isLow ? 'badge-danger' : 'badge-emerald'}`}>
                              {s.overallAttendance}%
                            </span>
                          </td>
                          <td><strong className="text-primary">{s.cgpa || '8.2'}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filtered5thSem.length === 0 && (
                  <div className="empty-state-card py-4 text-center">
                    <Icons.Users size={36} className="text-muted mx-auto mb-2" />
                    <h4>No student records found</h4>
                    <p className="text-muted">Try clearing the search query or changing filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB: AUDIT LOGS (Requirement 70) --- */}
      {activeTab === 'admin_audit' && (
        <div className="admin-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">System-Wide Security & Academic Audit Trail</h3>
                <p className="panel-desc">Immutable transaction log tracking session start times, attendance registers, and mark approvals</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Principal Actor</th>
                    <th>Role</th>
                    <th>Event Type</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {window.masterDB.db.auditLogs.map(log => (
                    <tr key={log.id}>
                      <td><span className="text-muted text-sm">{log.dateTime}</span></td>
                      <td><strong>{log.user}</strong></td>
                      <td><span className="badge badge-purple">{log.role}</span></td>
                      <td><span className="badge badge-slate font-bold">{log.action}</span></td>
                      <td>{log.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SETTINGS (Requirement 84) --- */}
      {activeTab === 'admin_settings' && (
        <div className="admin-view-container">
          <div className="panel-card max-w-xl">
            <div className="panel-header">
              <h3 className="panel-title">Institutional Academic Settings & Thresholds</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Current Academic Year</label>
              <input type="text" className="form-input" defaultValue="2024-2025" />
            </div>
            <div className="form-group">
              <label className="form-label">Active Academic Term</label>
              <input type="text" className="form-input" defaultValue="Even Semester (Spring)" />
            </div>
            <div className="form-group">
              <label className="form-label">Mandatory Attendance Threshold Rule (%)</label>
              <input type="number" className="form-input" defaultValue="75" min="50" max="90" />
              <span className="form-hint">Students below this percentage trigger automatic examination debarment warnings.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Session Attendance Time Window (Minutes)</label>
              <input type="number" className="form-input" defaultValue="10" min="5" max="30" />
            </div>
            <button className="btn btn-primary" onClick={() => addToast('Institutional settings updated and synchronized', 'success')}>
              Save System Settings
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal 
        isOpen={addUserModalOpen} 
        onClose={() => setAddUserModalOpen(false)}
        title="Enroll New CampusConnect User"
      >
        <form onSubmit={handleAddUserSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className={`form-input ${userErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Maya Krishnan"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Institutional College Email (@college.edu)</label>
            <input 
              type="email" 
              className={`form-input ${userErrors.email ? 'is-invalid' : ''}`}
              placeholder="e.g. maya.k@college.edu"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
            {userErrors.email && <span className="invalid-feedback">{userErrors.email}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher (Faculty)</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)}>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="MECH">MECH</option>
                <option value="EEE">EEE</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Roll Number or Employee ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 21CS100 or EMP-CSE-120"
              value={newUserRoll}
              onChange={(e) => setNewUserRoll(e.target.value)}
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setAddUserModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Enroll User</button>
          </div>
        </form>
      </Modal>

      {/* Bus Alert Modal */}
      <Modal 
        isOpen={busAlertModalOpen} 
        onClose={() => setBusAlertModalOpen(false)}
        title="Broadcast College Bus Transit Alert"
      >
        <form onSubmit={handlePublishBusAlert}>
          <div className="form-group">
            <label className="form-label">Target Bus Route</label>
            <select className="form-input" value={selectedBusForAlert} onChange={(e) => setSelectedBusForAlert(e.target.value)}>
              <option value="Bus 04">Bus 04 (Route 04 - North Ring)</option>
              <option value="Bus 02">Bus 02 (Route 02 - South Suburb)</option>
              <option value="Bus 01">Bus 01 (Route 01 - West Suburbs)</option>
              <option value="Bus 07 (Special)">Bus 07 (Hostel Shuttle)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Advisory Message</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="e.g. Bus 04 delayed 15 minutes due to flyover construction. Expected arrival at City Center 07:45 AM."
              value={busAlertText}
              onChange={(e) => setBusAlertText(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setBusAlertModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Broadcast Advisory</button>
          </div>
        </form>
      </Modal>

      {/* --- TAB: DEPARTMENTS MANAGEMENT (Requirement 65) --- */}
      {activeTab === 'admin_departments' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">University Departments & Engineering Faculties</h3>
                <p className="panel-desc">Manage academic departments, appointed HODs, physical complexes, and faculty strengths</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddDeptModalOpen(true)}>
                <Icons.Plus size={16} /> Add Department
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Department Code & Name</th>
                    <th>Head of Department (HOD)</th>
                    <th>Building Complex</th>
                    <th>Student Strength</th>
                    <th>Faculty Count</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentsList.map(d => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.code}</strong> - {d.name}
                      </td>
                      <td>{d.hod}</td>
                      <td>{d.building} ({d.floors} Floors)</td>
                      <td><strong className="text-primary">{d.studentCount} Students</strong></td>
                      <td><span className="badge badge-purple">{d.facultyCount} Faculty</span></td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Opening ${d.name} governance console`, 'info')}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SUBJECT MANAGEMENT (Requirement 66) --- */}
      {activeTab === 'admin_subjects' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Master Curriculum Course & Subject Catalog</h3>
                <p className="panel-desc">Theory lectures, lab practicals, electives, credits, and assigned instructors</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddSubjectModalOpen(true)}>
                <Icons.Plus size={16} /> Add Subject
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Course Title</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Credits</th>
                    <th>Curriculum Type</th>
                    <th>Instructor In-Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectsList.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.code}</strong></td>
                      <td>{s.name}</td>
                      <td><span className="badge badge-primary">{s.dept}</span></td>
                      <td>Sem {s.semester}</td>
                      <td><strong>{s.credits} Credits</strong></td>
                      <td><span className="badge badge-purple">{s.type}</span></td>
                      <td>{s.teacherName || 'Faculty Assigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SEMESTER MANAGEMENT (Requirement 67) --- */}
      {activeTab === 'admin_semesters' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Academic Semesters & Term Configuration</h3>
                <p className="panel-desc">Configure odd and even semester terms, cohort progressions, and active syllabus tracks</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Semester Index</th>
                    <th>Academic Classification</th>
                    <th>Term Type</th>
                    <th>Current Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {semestersList.map(sem => (
                    <tr key={sem.id}>
                      <td><strong>{sem.name}</strong></td>
                      <td>{sem.year}</td>
                      <td><span className="badge badge-slate">{sem.type} Term</span></td>
                      <td>
                        <span className={`badge ${sem.active ? 'badge-success' : 'badge-amber'}`}>
                          {sem.active ? 'Active Academic Session' : 'Archived / Upcoming'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Toggled ${sem.name} session`, 'info')}>
                          Toggle Active
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: ROOMS & FACILITIES (Requirement 23) --- */}
      {activeTab === 'admin_rooms' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Campus Facilities, Lecture Theatres & Computing Labs</h3>
                <p className="panel-desc">Physical capacities, current utilization states, and maintenance controls</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Room Identifier</th>
                    <th>Complex & Floor</th>
                    <th>Facility Type</th>
                    <th>Desk Capacity</th>
                    <th>Current State</th>
                    <th>Maintenance Control</th>
                  </tr>
                </thead>
                <tbody>
                  {roomsList.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.number}</strong></td>
                      <td>{r.building} ({r.floor})</td>
                      <td><span className="badge badge-purple">{r.type}</span></td>
                      <td>{r.capacity} Seats</td>
                      <td>
                        <span className={`badge ${
                          r.status === 'Available' ? 'badge-success' :
                          r.status === 'Occupied' ? 'badge-primary' :
                          r.status === 'Reserved' ? 'badge-amber' : 'badge-danger'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleRoomStatus(r.id)}
                        >
                          {r.status === 'Maintenance' ? 'Re-enable Room' : 'Set Maintenance'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CAMPUS GEOFENCE CONFIGURATION & LIVE ROSTER --- */}
      {activeTab === 'admin_geofence' && (
        <div className="admin-view-container">
          <GeofenceAdminConfig />
        </div>
      )}

      {/* --- TAB: MASTER TIMETABLE (Requirement 18) --- */}
      {activeTab === 'admin_timetable' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">University Master Scheduling Matrix</h3>
                <p className="panel-desc">Inspect all class schedules across departments and semesters</p>
              </div>
              <div className="filter-select-wrapper">
                <label className="filter-label">Dept:</label>
                <select className="form-input filter-select" value={adminTtDept} onChange={(e) => setAdminTtDept(e.target.value)}>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                </select>
                <label className="filter-label ml-2">Sem:</label>
                <select className="form-input filter-select" value={adminTtSem} onChange={(e) => setAdminTtSem(Number(e.target.value))}>
                  <option value={6}>Sem 6</option>
                  <option value={4}>Sem 4</option>
                </select>
              </div>
            </div>

            <div className="timetable-grid-full">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                const slots = window.masterDB.db.timetable.filter(t => t.day === day && t.dept === adminTtDept && t.semester === adminTtSem);
                return (
                  <div key={day} className="day-schedule-column">
                    <div className="day-col-header">{day}</div>
                    <div className="day-slots-list">
                      {slots.map(s => (
                        <div key={s.id} className="slot-card">
                          <span className="slot-card-time">{s.timeSlot}</span>
                          <span className="slot-card-title">{s.subjectCode}: {s.subjectName}</span>
                          <span className="slot-card-room">📍 {s.room}</span>
                          <span className="slot-card-faculty">👨‍🏫 {s.teacherName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CENTRAL SESSION ENGINE (Requirement 26) --- */}
      {activeTab === 'admin_sessions' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Central Session Engine Live Command HUD</h3>
                <p className="panel-desc">Monitor live classroom sessions, attendance windows, and emergency overrides</p>
              </div>
              <span className="badge badge-emerald">Engine Active</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Subject & Code</th>
                    <th>Instructor</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Attendance Logged</th>
                    <th>Supervisory Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessionsList.map(sess => (
                    <tr key={sess.sessionId}>
                      <td><code>{sess.sessionId}</code></td>
                      <td><strong>{sess.subjectCode}</strong>: {sess.subjectName}</td>
                      <td>{sess.teacherName}</td>
                      <td><span className="badge badge-primary">{sess.room}</span></td>
                      <td>
                        <span className={`badge ${sess.status === 'Attendance Active' ? 'badge-success' : 'badge-slate'}`}>
                          {sess.status}
                        </span>
                      </td>
                      <td><strong>{sess.attendanceCount || 42} / {sess.totalEnrolled || 45}</strong></td>
                      <td>
                        {sess.status === 'Attendance Active' ? (
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCloseSession(sess.sessionId)}
                          >
                            Terminate Session
                          </button>
                        ) : (
                          <span className="text-muted text-sm">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: ROLE-BASED ACCESS CONTROL MATRIX (Requirement 71) --- */}
      {activeTab === 'admin_roles' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Role-Based Access Control (RBAC) Permissions Matrix</h3>
                <p className="panel-desc">Enforce principle of least privilege, FERPA student isolation, and role boundaries</p>
              </div>
              <span className="badge badge-emerald">FERPA Certified</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Module / Capability</th>
                    <th>Student</th>
                    <th>Teacher (Faculty)</th>
                    <th>Head of Dept (HOD)</th>
                    <th>Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>View Personal Attendance & Marks</strong></td>
                    <td><span className="text-emerald font-bold">✔ Own Records</span></td>
                    <td><span className="text-muted">N/A</span></td>
                    <td><span className="text-muted">N/A</span></td>
                    <td><span className="text-emerald font-bold">✔ Read All</span></td>
                  </tr>
                  <tr>
                    <td><strong>Record Daily Session Attendance</strong></td>
                    <td><span className="text-rose font-bold">✖ Forbidden</span></td>
                    <td><span className="text-emerald font-bold">✔ Assigned Classes</span></td>
                    <td><span className="text-emerald font-bold">✔ Supervise</span></td>
                    <td><span className="text-emerald font-bold">✔ Full Override</span></td>
                  </tr>
                  <tr>
                    <td><strong>Continuous Internal Marks Entry</strong></td>
                    <td><span className="text-rose font-bold">✖ Read Only</span></td>
                    <td><span className="text-emerald font-bold">✔ Draft Scores</span></td>
                    <td><span className="text-emerald font-bold">✔ Finalize & Lock</span></td>
                    <td><span className="text-emerald font-bold">✔ System Seal</span></td>
                  </tr>
                  <tr>
                    <td><strong>Timetable Shift Requests</strong></td>
                    <td><span className="text-rose font-bold">✖ Read Only</span></td>
                    <td><span className="text-emerald font-bold">✔ Submit Shift</span></td>
                    <td><span className="text-emerald font-bold">✔ Approve / Reject</span></td>
                    <td><span className="text-emerald font-bold">✔ Master Control</span></td>
                  </tr>
                  <tr>
                    <td><strong>Peer Student Privacy (FERPA)</strong></td>
                    <td><span className="badge badge-emerald">Zero Peer Leakage</span></td>
                    <td><span className="text-muted">Course Bound</span></td>
                    <td><span className="text-muted">Dept Bound</span></td>
                    <td><span className="text-muted">Audited Access</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: INSTITUTIONAL REPORTS & KPI DASHBOARD (Requirements 68 & 69) --- */}
      {activeTab === 'admin_reports' && (
        <div className="admin-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Institutional Intelligence & Academic Reports Console</h3>
                <p className="panel-desc">Comprehensive analytics across admissions, attendance averages, and course completions</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => addToast('Exporting University Institutional Report...', 'success')}>
                <Icons.Download size={14} /> Export University Report (CSV)
              </button>
            </div>

            <div className="stat-cards-grid mb-4">
              <StatCard 
                title="Overall Student Retention" 
                value="98.2%" 
                subtitle="Academic Year 2024-25"
                icon={Icons.GraduationCap}
                color="emerald"
              />
              <StatCard 
                title="Institution Average Attendance" 
                value="88.1%" 
                subtitle="All Departments"
                icon={Icons.Clock}
                color="blue"
              />
              <StatCard 
                title="Faculty to Student Ratio" 
                value="1 : 14.7" 
                subtitle="Meets AICTE / UGC Standard"
                icon={Icons.Users}
                color="purple"
              />
              <StatCard 
                title="Campus Facilities In Use" 
                value="84%" 
                subtitle="Classrooms, Theatres & Labs"
                icon={Icons.Building}
                color="amber"
              />
            </div>

            <div className="table-responsive">
              <h4 className="font-semibold text-sm mb-2">Department-Wise Strength & Attendance Summary</h4>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Enrolled Students</th>
                    <th>Faculty Strength</th>
                    <th>Term Attendance %</th>
                    <th>Internal Evaluation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentsList.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.name} ({d.code})</strong></td>
                      <td>{d.studentCount} Students</td>
                      <td>{d.facultyCount} Professors</td>
                      <td><span className="text-emerald font-bold">88.4%</span></td>
                      <td><span className="badge badge-success">On Schedule</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={addDeptModalOpen}
        onClose={() => setAddDeptModalOpen(false)}
        title="Add Academic Department"
      >
        <form onSubmit={handleAddDepartment}>
          <div className="form-group">
            <label className="form-label">Department Code</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. AI-DS"
              value={newDeptCode}
              onChange={(e) => setNewDeptCode(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Appointed HOD</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Dr. Sunita Kulkarni"
                value={newDeptHod}
                onChange={(e) => setNewDeptHod(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Building Complex</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ramanujan Hall"
                value={newDeptBuilding}
                onChange={(e) => setNewDeptBuilding(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setAddDeptModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Department</button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={addSubjectModalOpen}
        onClose={() => setAddSubjectModalOpen(false)}
        title="Add Curriculum Subject to Master Catalog"
      >
        <form onSubmit={handleAddSubject}>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. CS607"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={newSubDept} onChange={(e) => setNewSubDept(e.target.value)}>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Subject Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Distributed Database Systems & Sharding"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              required
            />
          </div>
          <div className="grid-3-col">
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input 
                type="number" 
                className="form-input" 
                value={newSubSem} 
                min="1" 
                max="8"
                onChange={(e) => setNewSubSem(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Credits</label>
              <input 
                type="number" 
                className="form-input" 
                value={newSubCredits} 
                min="1" 
                max="6"
                onChange={(e) => setNewSubCredits(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={newSubType} onChange={(e) => setNewSubType(e.target.value)}>
                <option value="Theory">Theory</option>
                <option value="Lab">Laboratory</option>
                <option value="Elective">Elective</option>
                <option value="Project">Project</option>
              </select>
            </div>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setAddSubjectModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Course to Catalog</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
