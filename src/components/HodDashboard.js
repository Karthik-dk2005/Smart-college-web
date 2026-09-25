// CampusConnect HOD Portal - Master Department Governance & Academic Operations
// Timetable Governance, Room Conflict Engine, Mark Finalization & Shortage Action

function HodDashboard({ activeTab }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [rooms, setRooms] = React.useState(window.masterDB.db.rooms);
  const [selectedConflictRoom, setSelectedConflictRoom] = React.useState('TB-201');
  const [selectedConflictDay, setSelectedConflictDay] = React.useState('Monday');
  const [selectedConflictTime, setSelectedConflictTime] = React.useState('09:00 - 10:00');
  const [conflictReport, setConflictReport] = React.useState(null);

  // Mark Finalization State
  const [pendingApprovalSubject, setPendingApprovalSubject] = React.useState('CS603');
  const markHistory = window.masterDB.db.markAuditHistory;
  const shortageStudents = window.masterDB.db.users.filter(u => u.role === 'Student' && (u.overallAttendance || 85) < 75);

  // Attendance Shortage & Debarment State
  const [shortageSemFilter, setShortageSemFilter] = React.useState('All');
  const [shortageSearch, setShortageSearch] = React.useState('');
  const [noticesSentMap, setNoticesSentMap] = React.useState({});
  const [condonedStudents, setCondonedStudents] = React.useState({});
  const [debarredMap, setDebarredMap] = React.useState({});

  const handleSendIndividualNotice = (std) => {
    window.masterDB.db.notifications.unshift({
      id: 'notif-att-' + Date.now(),
      type: 'Attendance Shortage Alert',
      title: 'Regulatory Attendance Shortage Warning (<75%)',
      message: `Formal Notice issued by HOD: Your attendance is currently ${std.overallAttendance}%. You must maintain at least 75% to appear for University End-Semester examinations.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
      role: 'Student'
    });
    window.masterDB.saveDatabase(window.masterDB.db);
    setNoticesSentMap(prev => ({ ...prev, [std.id]: true }));
    addToast(`Regulatory warning notice dispatched to ${std.name} and registered guardian via SMS & Email.`, 'warning');
  };

  const handleBatchDispatchShortageAlerts = () => {
    const targets = shortageStudents;
    targets.forEach(std => {
      window.masterDB.db.notifications.unshift({
        id: 'notif-batch-' + Math.random(),
        type: 'Attendance Shortage Alert',
        title: 'Institutional Debarment Risk Warning',
        message: `HOD Notice: Attendance for ${std.name} is ${std.overallAttendance}%. Please report to HOD Office immediately.`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false,
        role: 'Student'
      });
    });
    const newMap = {};
    targets.forEach(t => { newMap[t.id] = true; });
    setNoticesSentMap(prev => ({ ...prev, ...newMap }));
    window.masterDB.saveDatabase(window.masterDB.db);
    addToast(`Batch attendance shortage alerts dispatched to ${targets.length} students & guardians!`, 'success');
  };

  const handleApproveCondonation = (std) => {
    const updatedAttendance = Math.min(100, Math.round(((std.overallAttendance || 0) + 5.0) * 10) / 10);
    std.overallAttendance = updatedAttendance;
    window.masterDB.db.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: user?.name || 'Dr. Vikramaditya Sen (HOD)',
      role: 'HOD',
      action: 'APPROVE_ATTENDANCE_CONDONATION',
      oldValue: `${(updatedAttendance - 5.0).toFixed(1)}%`,
      newValue: `${updatedAttendance.toFixed(1)}% (+5% Medical Waiver)`,
      ipAddress: '10.0.4.12'
    });
    window.masterDB.saveDatabase(window.masterDB.db);
    setCondonedStudents(prev => ({ ...prev, [std.id]: true }));
    addToast(`Approved 5% Medical/OD attendance condonation for ${std.name}. New Term Attendance: ${updatedAttendance}%`, 'success');
  };

  const handleToggleDebarment = (std) => {
    const isCurrentlyDebarred = debarredMap[std.id];
    setDebarredMap(prev => ({ ...prev, [std.id]: !isCurrentlyDebarred }));
    if (!isCurrentlyDebarred) {
      addToast(`Debarment order issued for ${std.name} (${std.rollNo}). Examination hall ticket withheld.`, 'danger');
    } else {
      addToast(`Debarment revoked for ${std.name}. Regular exam eligibility restored.`, 'info');
    }
  };

  const handleCheckConflict = () => {
    const res = window.roomService.checkRoomConflict(selectedConflictRoom, selectedConflictDay, selectedConflictTime);
    setConflictReport(res);
    if (res.conflict) {
      addToast('Room conflict detected! Overlapping class found.', 'danger');
    } else {
      addToast('Room is completely free and available for allocation.', 'success');
    }
  };

  const handleFinalizeMarks = async (subjectCode) => {
    await window.marksService.finalizeMarksByHOD(subjectCode, user.name);
    addToast(`Internal marks for ${subjectCode} have been reviewed, verified and FINALIZED by HOD.`, 'success');
  };

  const handleToggleRoomMaintenance = async (roomId) => {
    await window.roomService.updateRoomStatus(roomId, 'Maintenance');
    setRooms([...window.masterDB.db.rooms]);
    addToast('Room marked for maintenance. Notice sent to scheduling cell.', 'warning');
  };

  // Timetable & Shift Approval State
  const [ttSemFilter, setTtSemFilter] = React.useState(6);
  const [ttSecFilter, setTtSecFilter] = React.useState('A');
  const [dynamicShifts, setDynamicShifts] = React.useState(window.masterDB.db.dynamicTimetableChanges || []);
  const [shareTtModalOpen, setShareTtModalOpen] = React.useState(false);
  const [shareTtFileName, setShareTtFileName] = React.useState('');
  const [shareTtNotes, setShareTtNotes] = React.useState('');

  // Faculty Directory & Management State (Requirements 1, 2, 8, 10, 11, 12, 13, 14)
  const [dbTeachers, setDbTeachers] = React.useState([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = React.useState('');
  const [teacherFilterStatus, setTeacherFilterStatus] = React.useState('ALL');
  const [selectedTeacherForView, setSelectedTeacherForView] = React.useState(null);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = React.useState(null);
  const [editFormData, setEditFormData] = React.useState(null);
  const [teacherStatusModal, setTeacherStatusModal] = React.useState(null); // { teacher, targetStatus }
  const [showTeacherAuditModal, setShowTeacherAuditModal] = React.useState(false);
  const [teacherAuditLogs, setTeacherAuditLogs] = React.useState([]);

  const refreshTeachers = React.useCallback(async () => {
    if (window.teacherService) {
      const list = await window.teacherService.getTeachers();
      if (list && list.length > 0) {
        setDbTeachers(list);
      }
    }
  }, []);

  React.useEffect(() => {
    refreshTeachers();
  }, [refreshTeachers]);

  const teachersList = React.useMemo(() => {
    let source = dbTeachers.length > 0 ? dbTeachers : (window.masterDB.db.users.filter(u => u.role === 'Teacher'));
    return source.filter(t => {
      const name = (t.name || '').toLowerCase();
      const facId = (t.facultyId || t.empId || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const subjects = String(t.subjectsHandled || t.assignedSubjects || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      const q = teacherSearchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || facId.includes(q) || email.includes(q) || subjects.includes(q) || dept.includes(q);

      const status = (t.accountStatus || (t.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')).toUpperCase();
      const matchesStatus = teacherFilterStatus === 'ALL' || status === teacherFilterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [dbTeachers, teacherSearchQuery, teacherFilterStatus]);

  const handleOpenEditTeacher = (teacher) => {
    setSelectedTeacherForEdit(teacher);
    setEditFormData({
      ...teacher,
      profilePhoto: teacher.profilePhoto || teacher.avatar || '',
      facultyId: teacher.facultyId || teacher.empId || '',
      subjectsHandled: Array.isArray(teacher.assignedSubjects) ? teacher.assignedSubjects.join(', ') : (teacher.subjectsHandled || ''),
      accountStatus: (teacher.accountStatus || (teacher.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')).toUpperCase(),
      role: 'TEACHER' // Strictly locked to TEACHER
    });
  };

  const handleSaveEditTeacher = async (e) => {
    e.preventDefault();
    if (!editFormData) return;

    const id = editFormData._id || editFormData.id || editFormData.facultyId;
    const res = await window.teacherService.updateTeacher(id, editFormData);

    if (res.success) {
      addToast('Teacher updated successfully.', 'success');
      setSelectedTeacherForEdit(null);
      setEditFormData(null);
      await refreshTeachers();
    } else {
      addToast(res.error || 'Failed to update teacher.', 'danger');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!teacherStatusModal) return;
    const { teacher, targetStatus } = teacherStatusModal;
    const id = teacher._id || teacher.id || teacher.facultyId;

    const res = await window.teacherService.toggleStatus(id, targetStatus);
    if (res.success) {
      addToast(`Teacher ${targetStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`, 'success');
      setTeacherStatusModal(null);
      await refreshTeachers();
    } else {
      addToast(res.error || 'Failed to update teacher status.', 'danger');
    }
  };

  const handleOpenAuditLogs = async () => {
    const logs = await window.teacherService.getAuditLogs();
    setTeacherAuditLogs(logs);
    setShowTeacherAuditModal(true);
  };

  // Student Cohort State
  const [studentSearch, setStudentSearch] = React.useState('');
  const [studentSemFilter, setStudentSemFilter] = React.useState('5');
  const [studentSectionFilter, setStudentSectionFilter] = React.useState('All');
  const [studentTypeFilter, setStudentTypeFilter] = React.useState('All');
  const studentsList = (window.masterDB.db.users || []).filter(u => 
    u.role === 'Student' && (u.department === 'CSE' || u.dept === 'CSE' || u.department === 'Computer Science and Engineering')
  );

  // Notices & Circulars State
  const [hodNoticeModalOpen, setHodNoticeModalOpen] = React.useState(false);
  const [hodNoticeTitle, setHodNoticeTitle] = React.useState('');
  const [hodNoticeCategory, setHodNoticeCategory] = React.useState('Department');
  const [hodNoticePriority, setHodNoticePriority] = React.useState('Important');
  const [hodNoticeDesc, setHodNoticeDesc] = React.useState('');
  const [hodNoticeFileName, setHodNoticeFileName] = React.useState('');

  // Events State
  const [hodEventModalOpen, setHodEventModalOpen] = React.useState(false);
  const [evTitle, setEvTitle] = React.useState('');
  const [evDate, setEvDate] = React.useState('2026-11-15');
  const [evTime, setEvTime] = React.useState('10:00 AM - 04:00 PM');
  const [evVenue, setEvVenue] = React.useState('Turing Audi');
  const [evCategory, setEvCategory] = React.useState('Academic Hackathon');
  const [evDesc, setEvDesc] = React.useState('');

  const handleApproveShift = (shiftId) => {
    const shift = dynamicShifts.find(s => s.id === shiftId);
    if (shift) {
      shift.status = 'Approved (HOD Finalized)';
      shift.approvedBy = user?.name || 'Dr. Vikramaditya Sen (HOD)';
      setDynamicShifts([...dynamicShifts]);
      window.masterDB.saveDatabase(window.masterDB.db);
      addToast(`Dynamic timetable shift approved for ${shift.subjectCode}! Notification broadcast to cohort.`, 'success');
    }
  };

  const handleRejectShift = (shiftId) => {
    const shift = dynamicShifts.find(s => s.id === shiftId);
    if (shift) {
      shift.status = 'Rejected by HOD';
      setDynamicShifts([...dynamicShifts]);
      window.masterDB.saveDatabase(window.masterDB.db);
      addToast(`Shift rejected. Faculty notified.`, 'info');
    }
  };

  const handleShareTimetableSubmit = (e) => {
    e.preventDefault();
    if (!shareTtFileName && !shareTtNotes.trim()) {
      addToast('Please upload a timetable file or enter timetable notes', 'warning');
      return;
    }
    window.masterDB.db.notifications.unshift({
      id: 'notif-' + Date.now(),
      type: 'Timetable Change',
      title: 'Official Department Timetable Published',
      message: `HOD published updated timetable (${shareTtFileName || 'Typed schedule'}): ${shareTtNotes}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
      role: 'Student'
    });
    window.masterDB.saveDatabase(window.masterDB.db);
    addToast('Timetable shared across students and faculty portals!', 'success');
    setShareTtModalOpen(false);
    setShareTtNotes('');
    setShareTtFileName('');
  };

  const handleHodPublishNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!hodNoticeTitle.trim() || !hodNoticeDesc.trim()) {
      addToast('Please fill in notice title and description', 'warning');
      return;
    }
    await window.noticeService.publishNotice({
      title: hodNoticeTitle.trim(),
      description: hodNoticeDesc.trim(),
      category: hodNoticeCategory,
      priority: hodNoticePriority,
      publishedBy: user?.name || 'Dr. Vikramaditya Sen (HOD CSE)',
      attachment: hodNoticeFileName || null,
      dept: 'CSE'
    });
    addToast('Official department circular published!', 'success');
    setHodNoticeModalOpen(false);
    setHodNoticeTitle('');
    setHodNoticeDesc('');
  };

  const handleHodCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!evTitle.trim() || !evDesc.trim()) {
      addToast('Please enter event title and description', 'warning');
      return;
    }
    await window.eventService.createEvent({
      title: evTitle.trim(),
      description: evDesc.trim(),
      date: evDate,
      time: evTime,
      venue: evVenue,
      organizer: 'Dept of CSE & HOD Secretariat',
      category: evCategory
    });
    addToast(`Department event "${evTitle}" scheduled!`, 'success');
    setHodEventModalOpen(false);
    setEvTitle('');
    setEvDesc('');
  };

  return (
    <div className="hod-dashboard">
      {/* HOD Profile Banner */}
      <div className="hod-profile-banner">
        <div className="profile-banner-left">
          <img src={user.avatar} alt={user.name} className="student-banner-avatar" />
          <div className="student-banner-info">
            <div className="student-name-row">
              <h1 className="student-display-name">{user.name}</h1>
              <span className="badge badge-amber">{user.empId || 'HOD-CSE-001'}</span>
              <span className="badge badge-primary">Department Executive Authority</span>
            </div>
            <div className="student-meta-pills">
              <span className="meta-pill"><strong>Department:</strong> Computer Science & Engineering</span>
              <span className="meta-pill"><strong>Office:</strong> Turing Block, HOD Secretariat (Suite 301)</span>
              <span className="meta-pill"><strong>Jurisdiction:</strong> 420 Students &bull; 28 Faculty</span>
            </div>
          </div>
        </div>

        <div className="profile-banner-right">
          <div className="quick-metric">
            <span className="quick-metric-label">Dept Students</span>
            <span className="quick-metric-val">420 Enrolled</span>
          </div>
          <div className="quick-metric">
            <span className="quick-metric-label">Average Attendance</span>
            <span className="quick-metric-val text-emerald">88.4%</span>
          </div>
        </div>
      </div>

      {/* --- TAB: OVERVIEW --- */}
      {(activeTab === 'hod_overview' || !activeTab) && (
        <div className="hod-view-container">
          <div className="stat-cards-grid">
            <StatCard 
              title="Average Attendance" 
              value="88.4%" 
              subtitle="Department of CSE"
              icon={Icons.Clock}
              color="emerald"
            />
            <StatCard 
              title="Attendance Shortage" 
              value={`${shortageStudents.length} Students`} 
              subtitle="Below mandatory 75% rule"
              icon={Icons.AlertTriangle}
              color="rose"
            />
            <StatCard 
              title="Marks Awaiting Review" 
              value="1 Cohort" 
              subtitle="CS603 Cloud Architecture"
              icon={Icons.Award}
              color="amber"
            />
            <StatCard 
              title="Active Timetable Shifts" 
              value="2 Shifts" 
              subtitle="Lab benchmark & substitute"
              icon={Icons.Calendar}
              color="purple"
            />
          </div>

          <div className="dashboard-columns-grid">
            {/* Quick Actions */}
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Department Executive Operations</h3>
              </div>
              <div className="teacher-quick-actions">
                <div className="action-tile" onClick={() => handleFinalizeMarks(pendingApprovalSubject)}>
                  <div className="action-tile-icon"><Icons.Award size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Approve & Finalize Internal Marks ({pendingApprovalSubject})</strong>
                    <span>Review faculty continuous assessment grades and seal records</span>
                  </div>
                </div>

                <div className="action-tile" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_rooms' }))}>
                  <div className="action-tile-icon"><Icons.Building size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Run Room Conflict Diagnostic</strong>
                    <span>Check scheduling collisions across classrooms and labs</span>
                  </div>
                </div>

                <div className="action-tile" onClick={() => addToast('Dispatched attendance shortage alerts via SMS & Email', 'warning')}>
                  <div className="action-tile-icon"><Icons.AlertTriangle size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Dispatch Shortage Warning Notices</strong>
                    <span>Send regulatory notices to guardians of students below 75%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Shifts Snapshot */}
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Dynamic Timetable Shifts</h3>
                <span className="badge badge-primary">2 Active</span>
              </div>
              <div className="shifts-list">
                {window.masterDB.db.dynamicTimetableChanges.map(c => (
                  <div key={c.id} className="shift-card-item">
                    <div className="shift-top">
                      <span className="badge badge-purple">{c.subjectCode}</span>
                      <strong className="shift-type">{c.changeType}</strong>
                    </div>
                    <div className="shift-diff">
                      <span className="text-muted">{c.oldValue}</span> &rarr; <span className="text-emerald font-semibold">{c.newValue}</span>
                    </div>
                    <div className="shift-reason text-sm text-muted">Reason: {c.reason}</div>
                    <div className="shift-status text-xs text-emerald mt-1">Status: {c.status} ({c.approvedBy})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: ROOMS & CONFLICT ENGINE (Requirements 23 - 25) --- */}
      {activeTab === 'hod_rooms' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.Building size={20} className="inline-icon text-primary" /> Room Conflict Engine & Allocation Audit
                </h3>
                <p className="panel-desc">Verify real-time collision between rooms, time slots, and professors to prevent double booking</p>
              </div>
            </div>

            {/* Conflict Tester Bar */}
            <div className="conflict-tester-bar">
              <div className="form-group mb-0">
                <label className="form-label">Room Number</label>
                <select className="form-input" value={selectedConflictRoom} onChange={(e) => setSelectedConflictRoom(e.target.value)}>
                  {rooms.map(r => <option key={r.number} value={r.number}>{r.number} ({r.type})</option>)}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Day</label>
                <select className="form-input" value={selectedConflictDay} onChange={(e) => setSelectedConflictDay(e.target.value)}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Time Slot</label>
                <select className="form-input" value={selectedConflictTime} onChange={(e) => setSelectedConflictTime(e.target.value)}>
                  <option value="09:00 - 10:00">09:00 - 10:00 AM</option>
                  <option value="10:00 - 11:00">10:00 - 11:00 AM</option>
                  <option value="11:15 - 12:15">11:15 - 12:15 PM</option>
                  <option value="13:30 - 16:30">13:30 - 16:30 PM</option>
                </select>
              </div>

              <div className="conflict-btn-box">
                <button type="button" className="btn btn-primary" onClick={handleCheckConflict}>
                  Verify Conflict
                </button>
              </div>
            </div>

            {/* Conflict Report Banner */}
            {conflictReport && (
              <div className="mt-3">
                {conflictReport.conflict ? (
                  <div className="conflict-alert-box alert-danger-border">
                    <Icons.AlertTriangle size={24} className="text-rose" />
                    <div>
                      <h4 className="font-bold text-rose">ROOM CONFLICT DETECTED</h4>
                      <p className="text-sm">{conflictReport.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="conflict-alert-box alert-success-border">
                    <Icons.CheckCircle size={24} className="text-emerald" />
                    <div>
                      <h4 className="font-bold text-emerald">NO CONFLICT FOUND</h4>
                      <p className="text-sm">Room {selectedConflictRoom} is completely free on {selectedConflictDay} at {selectedConflictTime}. Authorized to allocate.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rooms List Table */}
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">Department Classrooms & Laboratories</h3>
              <span className="badge badge-primary">{rooms.length} Facilities</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Room Number</th>
                    <th>Building & Floor</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Current Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(rm => (
                    <tr key={rm.id}>
                      <td><strong>{rm.number}</strong></td>
                      <td>{rm.building} ({rm.floor})</td>
                      <td><span className="badge badge-purple">{rm.type}</span></td>
                      <td>{rm.capacity} Seats</td>
                      <td>
                        <span className={`badge ${
                          rm.status === 'Available' ? 'badge-success' :
                          rm.status === 'Occupied' ? 'badge-primary' :
                          rm.status === 'Reserved' ? 'badge-amber' : 'badge-danger'
                        }`}>
                          {rm.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleRoomMaintenance(rm.id)}
                        >
                          Maintenance Mode
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

      {/* --- TAB: INTERNAL MARKS FINALIZATION (Requirements 39 & 40) --- */}
      {activeTab === 'hod_marks' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Internal Marks Audit & Finalization Console</h3>
                <p className="panel-desc">Review submitted continuous evaluation scores and lock them against unauthorized tampering</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleFinalizeMarks(pendingApprovalSubject)}>
                <Icons.CheckCircle size={14} /> Finalize & Lock Marks
              </button>
            </div>

            <div className="attendance-filter-bar mb-3">
              <div className="filter-field">
                <label className="form-label">Subject for Review</label>
                <select className="form-input" value={pendingApprovalSubject} onChange={(e) => setPendingApprovalSubject(e.target.value)}>
                  <option value="CS601">CS601 Distributed Systems (FINALIZED)</option>
                  <option value="CS602">CS602 Machine Learning (FINALIZED)</option>
                  <option value="CS603">CS603 Cloud Computing Architecture (Pending Approval)</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="form-label">Cohort Scope</label>
                <input type="text" className="form-input" value="Computer Science &bull; Sem 6 Sec A" disabled />
              </div>
            </div>

            {/* Mark Audit History */}
            <h4 className="font-semibold text-sm mb-2 mt-4">Immutable Mark Adjustment Audit Trail:</h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Subject</th>
                    <th>Student Roll</th>
                    <th>Assessment</th>
                    <th>Score Adjustment</th>
                    <th>Justification</th>
                    <th>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {markHistory.map(h => (
                    <tr key={h.id}>
                      <td><span className="text-muted text-sm">{h.date}</span></td>
                      <td><strong>{h.subjectCode}</strong></td>
                      <td>{h.studentRoll}</td>
                      <td>{h.assessment}</td>
                      <td>
                        <span className="text-muted">{h.oldScore}</span> &rarr; <span className="text-emerald font-bold">{h.newScore}</span>
                      </td>
                      <td>{h.reason}</td>
                      <td><code>{h.changedBy}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: ATTENDANCE SHORTAGES & DEBARMENT ENGINE (Requirements 33 & 34) --- */}
      {activeTab === 'hod_attendance' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.AlertTriangle size={20} className="inline-icon text-rose" /> Attendance Shortages & Debarment Watchlist (&lt; 75% Rule)
                </h3>
                <p className="panel-desc">Statutory monitoring, automated guardian warnings, medical condonation approvals, and examination eligibility control</p>
              </div>
              <div className="header-actions-group">
                <button 
                  className="btn btn-warning btn-sm" 
                  onClick={handleBatchDispatchShortageAlerts}
                >
                  <Icons.Bell size={14} /> Batch Dispatch Guardian Notices (SMS & Email)
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => addToast('Exporting CSE Attendance Shortage Roster to CSV...', 'success')}
                >
                  <Icons.Download size={14} /> Export Shortage CSV
                </button>
              </div>
            </div>

            {/* Attendance Shortage KPI Cards */}
            <div className="stat-cards-grid mb-4">
              <StatCard 
                title="Under Shortage Rule" 
                value={`${shortageStudents.length} Students`} 
                subtitle="Below mandatory 75% requirement"
                icon={Icons.AlertTriangle}
                color="rose"
              />
              <StatCard 
                title="Critical Debarment (&lt; 65%)" 
                value={`${shortageStudents.filter(s => (s.overallAttendance || 0) < 65).length} Students`} 
                subtitle="Immediate exam disqualification risk"
                icon={Icons.Shield}
                color="rose"
              />
              <StatCard 
                title="Dept Average Attendance" 
                value="88.4%" 
                subtitle="Computer Science & Engineering"
                icon={Icons.Clock}
                color="emerald"
              />
              <StatCard 
                title="Formal Notices Issued" 
                value={`${Object.keys(noticesSentMap).length} Dispatched`} 
                subtitle="Guardian & Student SMS Alerts"
                icon={Icons.Bell}
                color="purple"
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="user-directory-filters mb-3">
              <div className="search-box-wrapper">
                <Icons.Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Filter student by name, USN, or roll number..."
                  value={shortageSearch}
                  onChange={(e) => setShortageSearch(e.target.value)}
                />
              </div>

              <div className="filter-select-wrapper">
                <label className="filter-label">Semester:</label>
                <select 
                  className="form-input filter-select" 
                  value={shortageSemFilter} 
                  onChange={(e) => setShortageSemFilter(e.target.value)}
                >
                  <option value="All">All Semesters</option>
                  <option value="6">Semester 6</option>
                  <option value="4">Semester 4</option>
                </select>
              </div>
            </div>

            {/* Shortage Watchlist Table */}
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Profile</th>
                    <th>Roll / USN</th>
                    <th>Semester & Sec</th>
                    <th>Sessions Held / Attended</th>
                    <th>Current Attendance</th>
                    <th>Classes to 75%</th>
                    <th>Regulatory Status</th>
                    <th>HOD Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageStudents
                    .filter(s => {
                      const matchesSearch = !shortageSearch || 
                        s.name.toLowerCase().includes(shortageSearch.toLowerCase()) || 
                        (s.rollNo && s.rollNo.toLowerCase().includes(shortageSearch.toLowerCase())) ||
                        (s.usn && s.usn.toLowerCase().includes(shortageSearch.toLowerCase()));
                      const matchesSem = shortageSemFilter === 'All' || String(s.semester) === shortageSemFilter;
                      return matchesSearch && matchesSem;
                    })
                    .map(s => {
                      const totalHeld = 80;
                      const attended = Math.round((totalHeld * (s.overallAttendance || 0)) / 100);
                      const deficit = Math.max(0, Math.ceil((0.75 * totalHeld - attended) / 0.25));
                      const isCritical = (s.overallAttendance || 0) < 65;
                      const isDebarred = !!debarredMap[s.id];
                      const isNoticeSent = !!noticesSentMap[s.id];
                      const isCondoned = !!condonedStudents[s.id];
                      const isNowEligible = (s.overallAttendance || 0) >= 75;

                      return (
                        <tr key={s.id} className={isDebarred ? 'row-danger-tint' : isCritical ? 'row-warning-tint' : ''}>
                          <td>
                            <div className="student-cell-profile">
                              <img src={s.avatar} alt={s.name} className="cell-avatar" />
                              <div>
                                <strong>{s.name}</strong>
                                <div className="text-muted text-xs">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{s.rollNo}</strong>
                            <div className="text-muted text-xs">{s.usn}</div>
                          </td>
                          <td>Sem {s.semester} &bull; Sec {s.section || 'A'}</td>
                          <td>
                            <strong>{attended}</strong> / {totalHeld} <span className="text-muted text-xs">classes</span>
                          </td>
                          <td>
                            <div className="attendance-metric-cell">
                              <span className={`badge ${isNowEligible ? 'badge-emerald' : isCritical ? 'badge-danger' : 'badge-warning'}`}>
                                {s.overallAttendance}%
                              </span>
                              <div className="table-progress-bar-bg mt-1">
                                <div 
                                  className={`table-progress-bar-fill ${isNowEligible ? 'bg-emerald' : isCritical ? 'bg-danger' : 'bg-warning'}`}
                                  style={{ width: `${Math.min(100, s.overallAttendance)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isNowEligible ? (
                              <span className="badge badge-emerald">Eligible (75%+)</span>
                            ) : (
                              <span className="badge badge-slate font-semibold text-rose">
                                Needs +{deficit} classes
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="status-badges-column">
                              {isDebarred && (
                                <span className="badge badge-danger">Debarred from Exams</span>
                              )}
                              {isNoticeSent && (
                                <span className="badge badge-warning">Warning Sent (SMS)</span>
                              )}
                              {isCondoned && (
                                <span className="badge badge-emerald">+5% Medical Waiver</span>
                              )}
                              {!isDebarred && !isNoticeSent && !isCondoned && (
                                <span className="badge badge-slate">Pending Notice</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="table-actions-row">
                              <button 
                                className="btn btn-outline btn-xs"
                                onClick={() => handleSendIndividualNotice(s)}
                                disabled={isNoticeSent}
                                title="Dispatch formal SMS and email warning notice to student and guardian"
                              >
                                <Icons.Bell size={13} /> {isNoticeSent ? 'Notice Sent' : 'Warn Guardian'}
                              </button>
                              
                              <button 
                                className="btn btn-primary btn-xs"
                                onClick={() => handleApproveCondonation(s)}
                                disabled={isCondoned || isNowEligible}
                                title="Grant 5% condonation for medical grounds or authorized college OD"
                              >
                                <Icons.CheckCircle size={13} /> Medical Waiver
                              </button>

                              <button 
                                className={`btn ${isDebarred ? 'btn-secondary' : 'btn-danger'} btn-xs`}
                                onClick={() => handleToggleDebarment(s)}
                                title={isDebarred ? "Revoke debarment order" : "Issue institutional debarment order"}
                              >
                                <Icons.Shield size={13} /> {isDebarred ? 'Revoke Debar' : 'Debar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {shortageStudents.length === 0 && (
                <div className="empty-state-card py-4 text-center">
                  <Icons.CheckCircle size={36} className="text-emerald mx-auto mb-2" />
                  <h4>No Attendance Shortages Detected</h4>
                  <p className="text-muted">All students currently maintain 75% or higher institutional attendance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CAMPUS GEOFENCE & GPS ROSTER --- */}
      {activeTab === 'hod_geofence' && (
        <div className="hod-view-container">
          <GeofenceAdminConfig />
        </div>
      )}

      {/* --- TAB: DEPARTMENT MASTER TIMETABLE & DYNAMIC SHIFT APPROVALS (Requirements 18 - 22) --- */}
      {activeTab === 'hod_timetable' && (
        <div className="hod-view-container">
          {/* Dynamic Shifts Approval Queue */}
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.Calendar size={20} className="inline-icon text-primary" /> Timetable Dynamic Shifts Governance Queue
                </h3>
                <p className="panel-desc">Review, approve, or reject faculty room shifts, substitute instructors, and compensatory classes</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShareTtModalOpen(true)}>
                <Icons.UploadCloud size={16} /> Share Timetable (Photo / PDF / Typing)
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type of Shift</th>
                    <th>Original Allocation</th>
                    <th>Proposed Adjustment</th>
                    <th>Faculty Justification</th>
                    <th>Current Status</th>
                    <th>HOD Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicShifts.map(shift => (
                    <tr key={shift.id}>
                      <td><strong>{shift.subjectCode}</strong></td>
                      <td><span className="badge badge-purple">{shift.changeType}</span></td>
                      <td><span className="text-muted">{shift.oldValue}</span></td>
                      <td><strong className="text-emerald">{shift.newValue}</strong></td>
                      <td><span className="text-sm">{shift.reason}</span></td>
                      <td>
                        <span className={`badge ${shift.status.includes('Approved') ? 'badge-success' : shift.status.includes('Rejected') ? 'badge-danger' : 'badge-amber'}`}>
                          {shift.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group-sm">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApproveShift(shift.id)}
                            title="Approve shift"
                          >
                            <Icons.CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger ml-1"
                            onClick={() => handleRejectShift(shift.id)}
                            title="Reject shift"
                          >
                            <Icons.Trash size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Master Timetable Grid */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Master Schedule Matrix</h3>
                <p className="panel-desc">Computer Science & Engineering &bull; Semester {ttSemFilter} Section {ttSecFilter}</p>
              </div>
              <div className="filter-select-wrapper">
                <label className="filter-label">Semester:</label>
                <select className="form-input filter-select" value={ttSemFilter} onChange={(e) => setTtSemFilter(Number(e.target.value))}>
                  <option value={2}>Semester 2</option>
                  <option value={4}>Semester 4</option>
                  <option value={6}>Semester 6</option>
                </select>
                <label className="filter-label ml-2">Sec:</label>
                <select className="form-input filter-select" value={ttSecFilter} onChange={(e) => setTtSecFilter(e.target.value)}>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>

            <div className="timetable-grid-full">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                const daySlots = window.masterDB.db.timetable.filter(t => t.day === day && t.dept === 'CSE' && t.semester === ttSemFilter);
                return (
                  <div key={day} className="day-schedule-column">
                    <div className="day-col-header">{day}</div>
                    <div className="day-slots-list">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="slot-card">
                          <span className="slot-card-time">{slot.timeSlot}</span>
                          <span className="slot-card-title">{slot.subjectCode}: {slot.subjectName}</span>
                          <span className="slot-card-room">📍 {slot.room}</span>
                          <span className="slot-card-faculty">👨‍🏫 {slot.teacherName}</span>
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

      {/* --- TAB: ADD NEW TEACHER (Requirements 2, 3, 4, 5, 6, 7, 8, 9, 10, 15) --- */}
      {activeTab === 'hod_add_teacher' && (
        <div className="hod-view-container">
          <AddTeacherForm 
            onCancel={() => {
              window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_teachers' }));
            }}
            onSuccess={async (newTeacher) => {
              await refreshTeachers();
              window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_teachers' }));
            }}
          />
        </div>
      )}

      {/* --- TAB: FACULTY MANAGEMENT & ALL TEACHERS (Requirements 2, 10, 11, 12, 13) --- */}
      {activeTab === 'hod_teachers' && (
        <div className="hod-view-container">
          <div className="panel-card">
            <div className="panel-header faculty-mgmt-header">
              <div>
                <div className="faculty-badge-row">
                  <span className="badge badge-primary">Department Executive Authority</span>
                  <span className="badge badge-purple">CSE Department</span>
                </div>
                <h3 className="panel-title mt-1">Faculty Management</h3>
                <p className="panel-desc">Department Faculty Directory, Teaching Allocations & Account Governance</p>
              </div>

              <div className="faculty-header-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleOpenAuditLogs}
                  title="View Security & Teacher Management Audit Trail"
                >
                  <Icons.Lock size={15} />
                  <span>Audit Trail</span>
                </button>

                {/* Requirement 2: + Add New Teacher button */}
                <button
                  type="button"
                  id="btn-add-new-teacher"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_add_teacher' }));
                  }}
                  title="Register a new teacher to the department"
                >
                  <Icons.UserCheck size={16} />
                  <span>+ Add New Teacher</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="faculty-filters-bar">
              <div className="faculty-search-wrapper">
                <Icons.Search size={16} className="search-icon-muted" />
                <input
                  type="text"
                  placeholder="Search by teacher name, faculty ID, email, or subject code..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="faculty-search-input"
                />
                {teacherSearchQuery && (
                  <button 
                    type="button" 
                    className="search-clear-btn" 
                    onClick={() => setTeacherSearchQuery('')}
                  >
                    <Icons.X size={14} />
                  </button>
                )}
              </div>

              <div className="faculty-status-filters">
                <button
                  type="button"
                  className={`filter-chip ${teacherFilterStatus === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTeacherFilterStatus('ALL')}
                >
                  All Faculty ({teachersList.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${teacherFilterStatus === 'ACTIVE' ? 'active active-chip' : ''}`}
                  onClick={() => setTeacherFilterStatus('ACTIVE')}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`filter-chip ${teacherFilterStatus === 'INACTIVE' ? 'active inactive-chip' : ''}`}
                  onClick={() => setTeacherFilterStatus('INACTIVE')}
                >
                  Inactive / Deactivated
                </button>
              </div>
            </div>

            {/* Teachers Table (Requirement 11) */}
            <div className="table-responsive">
              <table className="custom-table faculty-table">
                <thead>
                  <tr>
                    <th>Profile Photo</th>
                    <th>Name</th>
                    <th>Faculty ID</th>
                    <th>College Email</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Subjects</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachersList.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-5">
                        <div className="empty-state-box">
                          <Icons.Users size={40} className="text-muted mb-2" />
                          <div className="font-semibold text-white">No teachers found</div>
                          <div className="text-muted text-sm mt-1">Try adjusting your search query or filter.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    teachersList.map((t) => {
                      const isInactive = t.accountStatus === 'INACTIVE' || t.status === 'Inactive';
                      const facId = t.facultyId || t.empId || 'FAC-CSE';
                      const subjects = Array.isArray(t.assignedSubjects) 
                        ? t.assignedSubjects 
                        : typeof t.subjectsHandled === 'string'
                        ? t.subjectsHandled.split(',').map(s => s.trim())
                        : ['CS501', 'CS504'];
                      const createdDate = (t.createdAt || t.joiningDate || '2024-01-10').split('T')[0];

                      return (
                        <tr key={t._id || t.id || facId} className={isInactive ? 'row-inactive-teacher' : ''}>
                          {/* 1. Profile Photo */}
                          <td>
                            <div className="teacher-avatar-container">
                              <img 
                                src={t.profilePhoto || t.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'} 
                                alt={t.name} 
                                className="cell-avatar-lg" 
                              />
                            </div>
                          </td>

                          {/* 2. Name */}
                          <td>
                            <div className="teacher-name-col">
                              <strong>{t.name}</strong>
                              <span className="text-muted text-xs">{t.phone || '+91 98450 12345'}</span>
                            </div>
                          </td>

                          {/* 3. Faculty ID */}
                          <td>
                            <code className="faculty-id-badge">{facId}</code>
                          </td>

                          {/* 4. College Email */}
                          <td>
                            <code className="college-email-badge">{t.email}</code>
                          </td>

                          {/* 5. Department */}
                          <td>
                            <span className="dept-tag">{t.department || 'CSE'}</span>
                          </td>

                          {/* 6. Designation */}
                          <td>
                            <span className="badge badge-purple">{t.designation || 'Assistant Professor'}</span>
                          </td>

                          {/* 7. Subjects */}
                          <td>
                            <div className="course-badges-row">
                              {subjects.slice(0, 3).map((sub, sIdx) => (
                                <span key={sIdx} className="badge badge-primary mr-1 text-xs">{sub}</span>
                              ))}
                              {subjects.length > 3 && (
                                <span className="badge badge-slate text-xs">+{subjects.length - 3}</span>
                              )}
                            </div>
                          </td>

                          {/* 8. Status */}
                          <td>
                            {isInactive ? (
                              <span className="badge badge-rose">INACTIVE</span>
                            ) : (
                              <span className="badge badge-emerald">ACTIVE</span>
                            )}
                          </td>

                          {/* 9. Created Date */}
                          <td>
                            <span className="text-muted text-xs">{createdDate}</span>
                          </td>

                          {/* 10. Actions (View, Edit, Activate, Deactivate) */}
                          <td>
                            <div className="faculty-action-buttons">
                              <button
                                type="button"
                                className="btn-action-view"
                                onClick={() => setSelectedTeacherForView(t)}
                                title="View Teacher Profile"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={() => handleOpenEditTeacher(t)}
                                title="Edit Teacher Information"
                              >
                                Edit
                              </button>

                              {isInactive ? (
                                <button
                                  type="button"
                                  className="btn-action-activate"
                                  onClick={() => setTeacherStatusModal({ teacher: t, targetStatus: 'ACTIVE' })}
                                  title="Activate Teacher Account"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action-deactivate"
                                  onClick={() => setTeacherStatusModal({ teacher: t, targetStatus: 'INACTIVE' })}
                                  title="Deactivate Teacher Account"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: STUDENT MANAGEMENT (1st to 8th Semester Full Lifecycle - Requirements 1 to 32) --- */}
      {(activeTab === 'hod_students' || activeTab === 'admin_students' || (activeTab && activeTab.startsWith('hod_students_sem_')) || activeTab === 'hod_add_student' || activeTab === 'hod_student_history') && (() => {
        let sem = 'All';
        if (activeTab === 'hod_students_sem_1') sem = '1';
        else if (activeTab === 'hod_students_sem_2') sem = '2';
        else if (activeTab === 'hod_students_sem_3') sem = '3';
        else if (activeTab === 'hod_students_sem_4') sem = '4';
        else if (activeTab === 'hod_students_sem_5') sem = '5';
        else if (activeTab === 'hod_students_sem_6') sem = '6';
        else if (activeTab === 'hod_students_sem_7') sem = '7';
        else if (activeTab === 'hod_students_sem_8') sem = '8';

        return (
          <StudentManagement 
            key={activeTab} 
            initialSemester={sem} 
            autoOpenAdd={activeTab === 'hod_add_student'} 
          />
        );
      })()}

      {/* --- TAB: EXAMINATIONS & SEATING OVERSIGHT (Requirement 35) --- */}
      {activeTab === 'hod_exams' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Examination Schedules & Seating Plans</h3>
                <p className="panel-desc">Supervise continuous assessment tests, end-semester exam halls, and desk allocations</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Exam Cycle</th>
                    <th>Course Code & Title</th>
                    <th>Date & Time</th>
                    <th>Assigned Examination Room</th>
                    <th>Seating Capacity</th>
                    <th>Invigilator In-Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {(window.masterDB.db.exams || []).map(ex => (
                    <tr key={ex.id}>
                      <td><span className="badge badge-purple">{ex.type}</span></td>
                      <td><strong>{ex.subjectCode}</strong>: {ex.subjectName}</td>
                      <td>{ex.date} ({ex.day}) &bull; {ex.startTime} - {ex.endTime}</td>
                      <td><span className="badge badge-primary">{ex.room}</span></td>
                      <td>70 Desks Allocated</td>
                      <td><strong>Prof. Ananya Iyer</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: NOTICES & CIRCULARS (Requirement 50) --- */}
      {activeTab === 'hod_notices' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Official Department Circulars & Bulletins</h3>
                <p className="panel-desc">Publish official notifications to CSE students and faculty members</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setHodNoticeModalOpen(true)}>
                <Icons.Bell size={16} /> Publish Department Notice
              </button>
            </div>

            <div className="notices-list-grid">
              {(window.masterDB.db.notices || []).map(notice => (
                <div key={notice.id} className="notice-item-card">
                  <div className="notice-card-header">
                    <div>
                      <span className={`badge ${notice.priority === 'Urgent' ? 'badge-danger' : notice.priority === 'Important' ? 'badge-amber' : 'badge-primary'}`}>
                        {notice.priority}
                      </span>
                      <span className="badge badge-purple ml-2">{notice.category}</span>
                    </div>
                    <span className="text-muted text-sm">{notice.date}</span>
                  </div>
                  <h4 className="notice-card-title mt-2">{notice.title}</h4>
                  <p className="notice-card-desc">{notice.description}</p>
                  <div className="notice-card-footer">
                    <span className="text-muted text-sm">Published by: {notice.publishedBy}</span>
                    {notice.attachment && (
                      <span className="badge badge-slate text-xs">Attachment: {notice.attachment}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: EVENTS & RESEARCH SYMPOSIA (Requirement 54) --- */}
      {activeTab === 'hod_events' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Events, Symposia & Hackathons</h3>
                <p className="panel-desc">Manage academic colloquia, guest lectures, hackathons, and technical symposiums</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setHodEventModalOpen(true)}>
                <Icons.Calendar size={16} /> Create Department Event
              </button>
            </div>

            <div className="events-list-grid">
              {(window.masterDB.db.events || []).map(ev => (
                <div key={ev.id} className="event-item-card">
                  <div className="event-card-header">
                    <span className="badge badge-purple">{ev.category}</span>
                    <span className="event-date-pill">📅 {ev.date} &bull; {ev.time}</span>
                  </div>
                  <h4 className="event-card-title mt-2">{ev.title}</h4>
                  <p className="event-card-desc">{ev.description}</p>
                  <div className="event-meta-row">
                    <span>📍 Venue: <strong>{ev.venue}</strong></span>
                    <span>🏛️ Organizer: <strong>{ev.organizer}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: COLLEGE BUS INFORMATION (Requirement 57) --- */}
      {activeTab === 'hod_bus' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">College Bus Routes & Transit Information</h3>
                <p className="panel-desc">Monitor student transit routes, morning/evening schedules, and fleet advisories</p>
              </div>
            </div>

            <div className="bus-routes-grid">
              {window.masterDB.db.busRoutes.map(bus => (
                <div key={bus.busNumber} className="bus-card">
                  <div className="bus-card-top">
                    <span className="badge badge-amber">{bus.busNumber}</span>
                    <span className="bus-schedule-type">{bus.scheduleType}</span>
                  </div>
                  <h4 className="bus-route-name">{bus.routeName}</h4>
                  <div className="bus-timings-row">
                    <div>🌅 Morning: <strong>{bus.morningDeparture}</strong></div>
                    <div>🌇 Evening: <strong>{bus.eveningDeparture}</strong></div>
                  </div>
                  <div className="bus-driver-meta">
                    <span>Driver: {bus.driverName}</span> &bull; <span>{bus.driverPhone}</span>
                  </div>
                  {bus.activeAlert && (
                    <div className="text-xs text-rose font-bold mt-2">
                      ⚠️ {bus.activeAlert}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DEPARTMENT ANALYTICS & REPORTS (Requirements 68 & 69) --- */}
      {activeTab === 'hod_reports' && (
        <div className="hod-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Academic Performance & Analytics Console</h3>
                <p className="panel-desc">Term metrics across student attendance, internal assessment distribution, and facility utilization</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => addToast('Generating Comprehensive Department Report (PDF)...', 'success')}>
                <Icons.Download size={14} /> Export Department Report (PDF)
              </button>
            </div>

            <div className="stat-cards-grid mb-4">
              <StatCard 
                title="Student Attendance Average" 
                value="88.4%" 
                subtitle="Above 75% baseline"
                icon={Icons.Clock}
                color="emerald"
              />
              <StatCard 
                title="Continuous Assessment Pass Rate" 
                value="94.2%" 
                subtitle="IA1 Composite Scores"
                icon={Icons.Award}
                color="blue"
              />
              <StatCard 
                title="Lab Utilization" 
                value="82%" 
                subtitle="CS-Lab 1, 2 & 3"
                icon={Icons.Building}
                color="purple"
              />
              <StatCard 
                title="Shortage Alert Count" 
                value={`${shortageStudents.length} Students`} 
                subtitle="Debarment risk"
                icon={Icons.AlertTriangle}
                color="rose"
              />
            </div>

            <div className="table-responsive">
              <h4 className="font-semibold text-sm mb-2">Subject Performance & Course Attendance Breakdown</h4>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject Code & Title</th>
                    <th>Assigned Faculty</th>
                    <th>Average Attendance %</th>
                    <th>IA1 Pass Percentage</th>
                    <th>Curriculum Completion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CS601</strong> Distributed Systems</td>
                    <td>Prof. Ananya Iyer</td>
                    <td><span className="text-emerald font-bold">89.2%</span></td>
                    <td><span className="badge badge-success">96% Passed</span></td>
                    <td>85% Complete</td>
                  </tr>
                  <tr>
                    <td><strong>CS602</strong> Machine Learning Applications</td>
                    <td>Prof. Divya Menon</td>
                    <td><span className="text-emerald font-bold">87.5%</span></td>
                    <td><span className="badge badge-success">92% Passed</span></td>
                    <td>80% Complete</td>
                  </tr>
                  <tr>
                    <td><strong>CS603</strong> Cloud Computing Architecture</td>
                    <td>Prof. Ananya Iyer</td>
                    <td><span className="text-emerald font-bold">88.0%</span></td>
                    <td><span className="badge badge-success">94% Passed</span></td>
                    <td>82% Complete</td>
                  </tr>
                  <tr>
                    <td><strong>CS604</strong> Compiler Design</td>
                    <td>Dr. Vikramaditya Sen (HOD)</td>
                    <td><span className="text-emerald font-bold">91.4%</span></td>
                    <td><span className="badge badge-success">98% Passed</span></td>
                    <td>90% Complete</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DEPARTMENT AUDIT HISTORY (Requirement 70) --- */}
      {activeTab === 'hod_audit' && (
        <div className="hod-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Operational Audit Log</h3>
                <p className="panel-desc">Chronological register of faculty mark entries, timetable shifts, and attendance validations</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {window.masterDB.db.auditLogs.map(log => (
                    <tr key={log.id}>
                      <td><span className="text-muted text-sm">{log.dateTime}</span></td>
                      <td><strong>{log.user}</strong></td>
                      <td><span className="badge badge-purple">{log.role}</span></td>
                      <td><span className="badge badge-slate">{log.action}</span></td>
                      <td>{log.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Share Timetable Modal */}
      <Modal 
        isOpen={shareTtModalOpen} 
        onClose={() => setShareTtModalOpen(false)}
        title="Share Department Timetable (Photo / PDF / Typing)"
      >
        <form onSubmit={handleShareTimetableSubmit}>
          <div className="form-group">
            <label className="form-label">Type or Paste Timetable Changes / Schedule</label>
            <textarea 
              className="form-input" 
              rows="4" 
              placeholder="e.g. Revised CSE Sem 6 Lab Schedule: Monday CS-Lab 3, Wednesday CS-Lab 1..."
              value={shareTtNotes}
              onChange={(e) => setShareTtNotes(e.target.value)}
            ></textarea>
          </div>
          <FileUpload 
            label="Upload Timetable Image or PDF Document"
            onFileSelect={(file) => setShareTtFileName(file ? file.name : '')}
          />
          <div className="modal-actions-row mt-3">
            <button type="button" className="btn btn-secondary" onClick={() => setShareTtModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Broadcast Timetable to Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Publish Department Notice Modal */}
      <Modal
        isOpen={hodNoticeModalOpen}
        onClose={() => setHodNoticeModalOpen(false)}
        title="Publish Official Department Circular"
      >
        <form onSubmit={handleHodPublishNoticeSubmit}>
          <div className="form-group">
            <label className="form-label">Notice Headline</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Schedule for Phase 1 Capstone Project Review"
              value={hodNoticeTitle}
              onChange={(e) => setHodNoticeTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Notice Category</label>
              <select className="form-input" value={hodNoticeCategory} onChange={(e) => setHodNoticeCategory(e.target.value)}>
                <option value="Department">Department</option>
                <option value="Academic">Academic</option>
                <option value="Exam">Examination</option>
                <option value="Emergency">Emergency Closure</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={hodNoticePriority} onChange={(e) => setHodNoticePriority(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Detailed Notice Text</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Official instructions for students and teaching staff..."
              value={hodNoticeDesc}
              onChange={(e) => setHodNoticeDesc(e.target.value)}
              required
            ></textarea>
          </div>
          <FileUpload 
            label="Attach Circular Document (PDF or Image)"
            onFileSelect={(file) => setHodNoticeFileName(file ? file.name : '')}
          />
          <div className="modal-actions-row mt-3">
            <button type="button" className="btn btn-secondary" onClick={() => setHodNoticeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish & Broadcast
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={hodEventModalOpen}
        onClose={() => setHodEventModalOpen(false)}
        title="Schedule Department Event / Symposium"
      >
        <form onSubmit={handleHodCreateEventSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Frontier AI Systems Research Colloquium 2026"
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time Window</label>
              <input 
                type="text" 
                className="form-input" 
                value={evTime}
                onChange={(e) => setEvTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Venue</label>
              <input 
                type="text" 
                className="form-input" 
                value={evVenue}
                onChange={(e) => setEvVenue(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={evCategory} onChange={(e) => setEvCategory(e.target.value)}>
                <option value="Academic Hackathon">Academic Hackathon</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Research Conference">Research Conference</option>
                <option value="Project Expo">Project Expo</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description & Agenda</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Key topics, keynote speaker details, and registration criteria"
              value={evDesc}
              onChange={(e) => setEvDesc(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setHodEventModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Event
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 1. VIEW TEACHER MODAL (Requirement 11) */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!selectedTeacherForView}
        onClose={() => setSelectedTeacherForView(null)}
        title="Teacher Profile & Academic Allocation"
        maxWidth="680px"
      >
        {selectedTeacherForView && (() => {
          const t = selectedTeacherForView;
          const isInactive = t.accountStatus === 'INACTIVE' || t.status === 'Inactive';
          const facId = t.facultyId || t.empId || 'FAC-CSE';
          const subjects = Array.isArray(t.assignedSubjects) ? t.assignedSubjects.join(', ') : (t.subjectsHandled || 'CS501, CS504');

          return (
            <div className="teacher-view-modal-content">
              {/* Profile Header Card */}
              <div className="teacher-modal-hero">
                <img 
                  src={t.profilePhoto || t.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'} 
                  alt={t.name} 
                  className="modal-teacher-avatar" 
                />
                <div className="modal-teacher-hero-info">
                  <div className="hero-name-row">
                    <h3 className="modal-teacher-name">{t.name}</h3>
                    {isInactive ? (
                      <span className="badge badge-rose">INACTIVE</span>
                    ) : (
                      <span className="badge badge-emerald">ACTIVE</span>
                    )}
                  </div>
                  <div className="modal-teacher-sub">
                    <span className="badge badge-purple">{t.designation || 'Assistant Professor'}</span>
                    <span className="text-muted">&bull;</span>
                    <span className="text-slate-300">{t.department || 'Computer Science and Engineering'}</span>
                  </div>
                  <div className="modal-teacher-pills mt-2">
                    <span className="meta-pill"><strong>Faculty ID:</strong> {facId}</span>
                    <span className="meta-pill"><strong>Role:</strong> TEACHER</span>
                    <span className="meta-pill"><strong>Office:</strong> {t.officeRoom || t.office || 'Turing Block 204'}</span>
                  </div>
                </div>
              </div>

              {/* Personal & Contact Section */}
              <div className="modal-info-section mt-4">
                <h4 className="modal-section-title">Personal & Institutional Credentials</h4>
                <div className="grid-2-col modal-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">College Email:</span>
                    <code className="detail-value">{t.email}</code>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{t.phone || '+91 98450 12345'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Qualification:</span>
                    <span className="detail-value">{t.qualification || 'M.Tech, Ph.D'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Specialization:</span>
                    <span className="detail-value">{t.specialization || 'Distributed Computing'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Teaching Experience:</span>
                    <span className="detail-value">{t.experience || '8 Years'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Joining Date:</span>
                    <span className="detail-value">{(t.joiningDate || t.createdAt || '2024-01-10').split('T')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Academic Assignment Section */}
              <div className="modal-info-section mt-3">
                <h4 className="modal-section-title">Academic Assignments</h4>
                <div className="grid-2-col modal-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Subjects Handled:</span>
                    <span className="detail-value font-medium text-primary">{subjects}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Semester:</span>
                    <span className="detail-value">{t.assignedSemester || '5th & 6th Semester'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Section:</span>
                    <span className="detail-value">{t.assignedSection || 'Section A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Cohorts:</span>
                    <span className="detail-value">{t.assignedClasses || '5th Sem CSE A'}</span>
                  </div>
                </div>
              </div>

              {/* Institutional Audit Card */}
              <div className="modal-audit-banner mt-3">
                <div className="audit-banner-title">
                  <Icons.Shield size={14} className="text-emerald" />
                  <span>Institutional Record Governance</span>
                </div>
                <p className="text-xs text-muted mb-0">
                  Registered by HOD (<code>{t.createdBy || 'usr-hod-01'}</code>). All historical attendance registers, internal marks records, and timetable sessions remain tied to this teacher identity.
                </p>
              </div>

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTeacherForView(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const toEdit = selectedTeacherForView;
                    setSelectedTeacherForView(null);
                    handleOpenEditTeacher(toEdit);
                  }}
                >
                  <Icons.Edit size={14} /> Edit Information
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ======================================================== */}
      {/* 2. EDIT TEACHER MODAL (Requirement 12) */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!selectedTeacherForEdit}
        onClose={() => {
          setSelectedTeacherForEdit(null);
          setEditFormData(null);
        }}
        title="Edit Teacher Information"
        maxWidth="720px"
      >
        {editFormData && (
          <form onSubmit={handleSaveEditTeacher} className="edit-teacher-modal-form">
            <p className="modal-subtext mb-3">
              Only HOD and Admin are authorized to update faculty information and academic allocations.
            </p>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label required">College Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.facultyId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, facultyId: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-3-col">
              <div className="form-group">
                <label className="form-label">Designation</label>
                <select
                  className="form-input"
                  value={editFormData.designation || 'Assistant Professor'}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Senior Lecturer">Senior Lecturer</option>
                  <option value="Visiting Faculty">Visiting Faculty</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.department || 'Computer Science and Engineering'}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Office Cabin</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.officeRoom || editFormData.office || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, officeRoom: e.target.value, office: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3-col">
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.qualification || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.specialization || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.experience || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subjects Handled (comma separated)</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.subjectsHandled || ''}
                onChange={(e) => setEditFormData({ ...editFormData, subjectsHandled: e.target.value })}
              />
            </div>

            <div className="grid-3-col">
              <div className="form-group">
                <label className="form-label">Assigned Semester</label>
                <select
                  className="form-input"
                  value={editFormData.assignedSemester || '5th Semester'}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedSemester: e.target.value })}
                >
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="Multiple Semesters">Multiple Semesters</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Section</label>
                <select
                  className="form-input"
                  value={editFormData.assignedSection || 'Section A'}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedSection: e.target.value })}
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Both A & B">Both Section A & B</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Classes</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.assignedClasses || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedClasses: e.target.value })}
                />
              </div>
            </div>

            {/* Requirement 12: Role strictly remains TEACHER */}
            <div className="grid-2-col mt-2">
              <div className="form-group">
                <label className="form-label">Assigned Role</label>
                <input
                  type="text"
                  className="form-input"
                  value="TEACHER"
                  disabled
                  readOnly
                  style={{ background: '#1e293b', opacity: 0.8, cursor: 'not-allowed' }}
                />
                <span className="field-help-text text-muted">Role strictly locked to TEACHER. Cannot be changed.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select
                  className="form-input"
                  value={editFormData.accountStatus || 'ACTIVE'}
                  onChange={(e) => setEditFormData({ ...editFormData, accountStatus: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="modal-actions-row mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedTeacherForEdit(null);
                  setEditFormData(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Teacher Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 3. ACTIVATE / DEACTIVATE CONFIRMATION MODAL (Requirement 13) */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!teacherStatusModal}
        onClose={() => setTeacherStatusModal(null)}
        title={teacherStatusModal?.targetStatus === 'INACTIVE' ? 'Confirm Account Deactivation' : 'Confirm Account Activation'}
        maxWidth="500px"
      >
        {teacherStatusModal && (() => {
          const { teacher, targetStatus } = teacherStatusModal;
          const isDeactivating = targetStatus === 'INACTIVE';

          return (
            <div className="status-confirm-modal-content">
              <div className={`status-modal-banner ${isDeactivating ? 'banner-deactivate' : 'banner-activate'}`}>
                {isDeactivating ? (
                  <Icons.AlertTriangle size={28} className="text-rose" />
                ) : (
                  <Icons.CheckCircle size={28} className="text-emerald" />
                )}
                <div>
                  <h4 className="status-modal-heading">
                    {isDeactivating ? 'Are you sure you want to deactivate this teacher?' : 'Confirm Teacher Account Re-activation?'}
                  </h4>
                  <p className="text-sm text-slate-300 mb-0">
                    Faculty Member: <strong>{teacher.name}</strong> ({teacher.facultyId || teacher.empId})
                  </p>
                </div>
              </div>

              {isDeactivating ? (
                <div className="deactivation-terms-box mt-3">
                  <div className="deact-policy-title font-semibold text-white text-sm mb-2">
                    Security & Data Preservation Policy:
                  </div>
                  <ul className="deact-policy-list text-xs text-slate-300">
                    <li>Teacher will be immediately blocked from accessing SmartDept.</li>
                    <li>Existing student attendance records remain 100% intact.</li>
                    <li>Existing continuous assessment marks & grades remain preserved.</li>
                    <li>Existing official timetable allocations remain intact.</li>
                    <li>Existing live session engine history remains preserved.</li>
                    <li>Existing departmental academic records are NOT deleted.</li>
                  </ul>
                  <div className="alert-safe-deact mt-2">
                    <Icons.Shield size={14} /> Academic history is permanently safeguarded.
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-300 mt-3">
                  Re-activating this account will restore full faculty access to SmartDept for <strong>{teacher.name}</strong>, allowing them to mark attendance and record continuous marks.
                </p>
              )}

              <div className="modal-actions-row mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTeacherStatusModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={isDeactivating ? "btn btn-danger" : "btn btn-success"}
                  onClick={handleConfirmStatusToggle}
                >
                  {isDeactivating ? 'Yes, Deactivate Teacher' : 'Yes, Activate Teacher'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ======================================================== */}
      {/* 4. TEACHER MANAGEMENT AUDIT TRAIL MODAL (Requirement 14) */}
      {/* ======================================================== */}
      <Modal
        isOpen={showTeacherAuditModal}
        onClose={() => setShowTeacherAuditModal(false)}
        title="Teacher Governance Audit Trail"
        maxWidth="760px"
      >
        <div className="teacher-audit-modal-content">
          <p className="text-sm text-muted mb-3">
            Immutable audit record of all ADD_TEACHER, EDIT_TEACHER, ACTIVATE_TEACHER, and DEACTIVATE_TEACHER operations.
          </p>

          <div className="table-responsive">
            <table className="custom-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Target User</th>
                  <th>Operation Details</th>
                </tr>
              </thead>
              <tbody>
                {teacherAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  teacherAuditLogs.map((log) => {
                    const isAdd = log.action === 'ADD_TEACHER';
                    const isDeact = log.action === 'DEACTIVATE_TEACHER';
                    const isAct = log.action === 'ACTIVATE_TEACHER';
                    const badgeClass = isAdd ? 'badge-primary' : isDeact ? 'badge-rose' : isAct ? 'badge-emerald' : 'badge-purple';

                    return (
                      <tr key={log._id || log.id}>
                        <td>
                          <span className="text-muted font-mono">{log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : 'Just now'}</span>
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{log.action}</span>
                        </td>
                        <td>
                          <code>{log.performedBy || 'usr-hod-01'}</code>
                        </td>
                        <td>
                          <code>{String(log.targetUser).slice(0, 12)}...</code>
                        </td>
                        <td>
                          <span className="text-slate-300">{log.details}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-actions-row mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowTeacherAuditModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

window.HodDashboard = HodDashboard;

