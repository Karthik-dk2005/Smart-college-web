// CampusConnect Teacher Portal - Master Dashboard & Operational Router
// Session Engine, Daily Roll Call, Timetable Shifts, Continuous Gradebook, and Assignments

function TeacherDashboard({ activeTab }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const assignedCourses = window.masterDB.db.subjects.filter(s => s.teacherId === 'usr-tch-01' || s.dept === 'CSE');
  const [selectedSem, setSelectedSem] = React.useState(5);
  const [selectedSection, setSelectedSection] = React.useState('A');
  const [teacherSearch, setTeacherSearch] = React.useState('');
  const [selectedCourse, setSelectedCourse] = React.useState('CS501');
  const [activeSession, setActiveSession] = React.useState(null);
  const [sessionCountdown, setSessionCountdown] = React.useState(600); // 10 minutes in seconds
  const [attendanceDateFilter, setAttendanceDateFilter] = React.useState('2026-09-24');

  // Dynamic students in class based on selected semester, section, and search
  const studentsInClass = window.masterDB.db.users.filter(u => {
    const isStudent = u.role === 'Student';
    const isDept = u.department === 'CSE' || u.department === 'Computer Science and Engineering' || u.dept === 'CSE';
    const isSem = Number(u.semester) === Number(selectedSem);
    const isSec = selectedSection === 'All' || u.section === selectedSection;
    const isSearch = !teacherSearch || 
      (u.name && u.name.toLowerCase().includes(teacherSearch.toLowerCase())) ||
      (u.rollNo && u.rollNo.toLowerCase().includes(teacherSearch.toLowerCase())) ||
      (u.usn && u.usn.toLowerCase().includes(teacherSearch.toLowerCase()));
    return isStudent && isDept && isSem && isSec && isSearch;
  });

  const [attendanceMap, setAttendanceMap] = React.useState({});
  const [gradebookMarks, setGradebookMarks] = React.useState({});

  // Dynamic Shift Request Modal
  const [shiftModalOpen, setShiftModalOpen] = React.useState(false);
  const [shiftType, setShiftType] = React.useState('Room Change');
  const [shiftNewVal, setShiftNewVal] = React.useState('');
  const [shiftReason, setShiftReason] = React.useState('');

  // Assignments State
  const [assignmentsList, setAssignmentsList] = React.useState(window.masterDB.db.assignments || []);
  const [createAsgModalOpen, setCreateAsgModalOpen] = React.useState(false);
  const [asgTitle, setAsgTitle] = React.useState('');
  const [asgCourse, setAsgCourse] = React.useState('CS601');
  const [asgDeadline, setAsgDeadline] = React.useState('2026-10-15');
  const [asgMaxMarks, setAsgMaxMarks] = React.useState(10);
  const [asgDesc, setAsgDesc] = React.useState('');
  const [asgAttachmentName, setAsgAttachmentName] = React.useState('');

  // Submission Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [selectedAsgForReview, setSelectedAsgForReview] = React.useState(null);
  const [reviewScore, setReviewScore] = React.useState(9);
  const [reviewFeedback, setReviewFeedback] = React.useState('Good analysis, well structured.');

  // Materials State
  const [materialsList, setMaterialsList] = React.useState(window.masterDB.db.materials || []);
  const [uploadMatModalOpen, setUploadMatModalOpen] = React.useState(false);
  const [matTitle, setMatTitle] = React.useState('');
  const [matCourse, setMatCourse] = React.useState('CS601');
  const [matUnit, setMatUnit] = React.useState('Unit 3: Consensus & Storage');
  const [matType, setMatType] = React.useState('PDF Notes');
  const [matQuestionsAttached, setMatQuestionsAttached] = React.useState(true);
  const [matFileName, setMatFileName] = React.useState('');

  // Notices State
  const [publishNoticeModalOpen, setPublishNoticeModalOpen] = React.useState(false);
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeCategory, setNoticeCategory] = React.useState('Academic');
  const [noticePriority, setNoticePriority] = React.useState('Important');
  const [noticeDesc, setNoticeDesc] = React.useState('');

  // Start Session Countdown
  React.useEffect(() => {
    let interval = null;
    if (activeSession && sessionCountdown > 0) {
      interval = setInterval(() => {
        setSessionCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, sessionCountdown]);

  const handleStartSession = async () => {
    const newSess = await window.sessionService.startClassSession({
      subjectCode: selectedCourse,
      subjectName: assignedCourses.find(c => c.code === selectedCourse)?.name || selectedCourse,
      teacherId: user?.id || 'usr-tch-01',
      teacherName: user?.name || 'Prof. Ananya Iyer',
      room: selectedCourse === 'CS605' ? 'CS-Lab 3' : 'TB-201',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: '10:00 AM',
      dept: 'CSE',
      semester: 6,
      section: 'A'
    });
    setActiveSession(newSess);
    setSessionCountdown(600);
    addToast(`Class session ${newSess.sessionId} is now LIVE. Attendance window opened.`, 'success');
  };

  const handleSaveAttendance = async () => {
    if (!activeSession) {
      addToast('Please start an active session first before recording official attendance', 'warning');
      return;
    }
    await window.attendanceService.recordSessionAttendance(activeSession.sessionId, attendanceMap, user.name);
    addToast(`Official attendance locked for Session ${activeSession.sessionId}`, 'success');
    setActiveSession(null);
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    studentsInClass.forEach(s => { updated[s.id] = 'Present'; });
    setAttendanceMap(updated);
    addToast('Marked all students as Present', 'info');
  };

  const handleScoreChange = (studentId, field, val) => {
    const num = Number(val);
    setGradebookMarks(prev => {
      const cur = prev[studentId] || { ia1: 0, ia2: 0, assignment: 0, quiz: 0 };
      const updated = { ...cur, [field]: num };
      updated.total = (Number(updated.ia1) || 0) + (Number(updated.ia2) || 0) + (Number(updated.assignment) || 0) + (Number(updated.quiz) || 0);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleSaveMarks = async (submitForHOD = false) => {
    for (const s of studentsInClass) {
      const scores = gradebookMarks[s.id];
      await window.marksService.updateMarksDraft(s.id, selectedCourse, { ...scores, submitForApproval: submitForHOD }, user.name);
    }
    addToast(submitForHOD ? `Scores submitted to HOD for official finalization` : `Marks drafts saved successfully`, 'success');
  };

  const handleRequestShift = async (e) => {
    e.preventDefault();
    if (!shiftNewVal.trim() || !shiftReason.trim()) {
      addToast('Please specify the replacement value and reason', 'warning');
      return;
    }

    await window.timetableService.requestTimetableChange({
      timetableEntryId: 'tt-01',
      date: new Date().toISOString().slice(0, 10),
      changeType: shiftType,
      subjectCode: selectedCourse,
      oldValue: shiftType === 'Room Change' ? 'TB-201' : 'Prof. Ananya Iyer',
      newValue: shiftNewVal.trim(),
      reason: shiftReason.trim(),
      changedBy: user.name,
      approvedBy: 'Dr. Vikramaditya Sen (HOD)'
    });

    addToast(`Timetable shift notification dispatched to students and HOD`, 'success');
    setShiftModalOpen(false);
    setShiftNewVal('');
    setShiftReason('');
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgDesc.trim()) {
      addToast('Please enter assignment title and instructions', 'warning');
      return;
    }
    const newAsg = await window.assignmentService.createAssignment({
      title: asgTitle.trim(),
      subjectCode: asgCourse,
      subjectName: assignedCourses.find(c => c.code === asgCourse)?.name || asgCourse,
      semester: 6,
      section: 'A',
      deadline: asgDeadline,
      attachment: asgAttachmentName || `${asgCourse}_Specification.pdf`,
      description: asgDesc.trim(),
      createdBy: user?.name || 'Prof. Ananya Iyer',
      maxMarks: Number(asgMaxMarks) || 10
    });
    setAssignmentsList([...window.masterDB.db.assignments]);
    addToast(`Assignment "${newAsg.title}" published to student portal!`, 'success');
    setCreateAsgModalOpen(false);
    setAsgTitle('');
    setAsgDesc('');
  };

  const handleGradeSubmission = (studentId, asgId) => {
    const subs = window.masterDB.db.submissions[studentId] || [];
    const target = subs.find(s => s.assignmentId === asgId);
    if (target) {
      target.scoreObtained = Number(reviewScore);
      target.teacherFeedback = reviewFeedback;
      target.status = 'Reviewed';
      window.masterDB.saveDatabase(window.masterDB.db);
      addToast(`Evaluation recorded: Score ${reviewScore}/10 with feedback sent to student`, 'success');
      setReviewModalOpen(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle.trim()) {
      addToast('Please enter document title', 'warning');
      return;
    }
    const newMat = await window.materialService.uploadMaterial({
      subjectCode: matCourse,
      unit: matUnit,
      title: matTitle.trim(),
      type: matType,
      fileName: matFileName || `${matCourse}_Unit_${matTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: '3.8 MB',
      uploadedBy: user?.name || 'Prof. Ananya Iyer',
      importantQuestionsAttached: matQuestionsAttached
    });
    setMaterialsList([...window.masterDB.db.materials]);
    addToast(`Curriculum document "${newMat.title}" uploaded!`, 'success');
    setUploadMatModalOpen(false);
    setMatTitle('');
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDesc.trim()) {
      addToast('Please enter notice headline and description', 'warning');
      return;
    }
    await window.noticeService.publishNotice({
      title: noticeTitle.trim(),
      description: noticeDesc.trim(),
      category: noticeCategory,
      priority: noticePriority,
      publishedBy: user?.name || 'Prof. Ananya Iyer',
      attachment: null,
      dept: 'CSE'
    });
    addToast('Department announcement broadcast to students!', 'success');
    setPublishNoticeModalOpen(false);
    setNoticeTitle('');
    setNoticeDesc('');
  };

  return (
    <div className="teacher-dashboard">
      {/* Teacher Profile Banner */}
      <div className="teacher-profile-banner">
        <div className="profile-banner-left">
          <img src={user.avatar} alt={user.name} className="student-banner-avatar" />
          <div className="student-banner-info">
            <div className="student-name-row">
              <h1 className="student-display-name">{user.name}</h1>
              <span className="badge badge-purple">{user.empId || 'EMP-CSE-108'}</span>
              <span className="badge badge-primary">{user.designation || 'Associate Professor'}</span>
            </div>
            <div className="student-meta-pills">
              <span className="meta-pill"><strong>Department:</strong> Computer Science & Engineering</span>
              <span className="meta-pill"><strong>Office:</strong> Turing Block 214</span>
              <span className="meta-pill"><strong>Assigned Courses:</strong> CS601, CS603, CS605</span>
            </div>
          </div>
        </div>

        <div className="profile-banner-right">
          <div className="quick-metric">
            <span className="quick-metric-label">Active Cohorts</span>
            <span className="quick-metric-val">3 Classes</span>
          </div>
          <div className="quick-metric">
            <span className="quick-metric-label">Total Students</span>
            <span className="quick-metric-val text-primary">45 Enrolled</span>
          </div>
        </div>
      </div>

      {/* --- TAB: OVERVIEW --- */}
      {(activeTab === 'teacher_overview' || !activeTab) && (
        <div className="teacher-view-container">
          <div className="stat-cards-grid">
            <StatCard 
              title="Next Scheduled Session" 
              value="CS601 (09:00)" 
              subtitle="Distributed Systems (Room TB-201)"
              icon={Icons.Calendar}
              color="blue"
            />
            <StatCard 
              title="Attendance Status" 
              value={activeSession ? 'LIVE SESSION' : 'Ready'} 
              subtitle={activeSession ? `ID: ${activeSession.sessionId}` : 'Click Start Session to open roll call'}
              icon={Icons.Clock}
              color={activeSession ? 'rose' : 'emerald'}
            />
            <StatCard 
              title="Internal Marks" 
              value="Draft State" 
              subtitle="IA1 Ready for HOD Finalization"
              icon={Icons.Award}
              color="amber"
            />
            <StatCard 
              title="Assignments Pending" 
              value="3 Active" 
              subtitle="42 Submissions received on Raft"
              icon={Icons.FileText}
              color="purple"
            />
          </div>

          <div className="dashboard-columns-grid">
            {/* Quick Action Station */}
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Session Engine & Classroom Operations</h3>
              </div>
              <div className="teacher-quick-actions">
                {!activeSession ? (
                  <div className="action-tile" onClick={handleStartSession}>
                    <div className="action-tile-icon"><Icons.Clock size={20} /></div>
                    <div className="action-tile-text">
                      <strong>Start Class Session (Generate Session ID)</strong>
                      <span>Open 10-minute digital attendance window for {selectedCourse}</span>
                    </div>
                  </div>
                ) : (
                  <div className="action-tile live-action-tile" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'teacher_attendance' }))}>
                    <div className="action-tile-icon"><Icons.UserCheck size={20} /></div>
                    <div className="action-tile-text">
                      <strong>Session Active: {activeSession.sessionId}</strong>
                      <span>Window Closes In: {Math.floor(sessionCountdown / 60)}:{(sessionCountdown % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                )}

                <div className="action-tile" onClick={() => setShiftModalOpen(true)}>
                  <div className="action-tile-icon"><Icons.Calendar size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Request Dynamic Timetable Shift</strong>
                    <span>Substitute teacher, temporary room change or extra lecture</span>
                  </div>
                </div>

                <div className="action-tile" onClick={() => addToast('Syllabus milestone logged: Raft Log Replication complete', 'success')}>
                  <div className="action-tile-icon"><Icons.BookOpen size={20} /></div>
                  <div className="action-tile-text">
                    <strong>Log Class Memory Topic</strong>
                    <span>Record key concepts taught today into Class Memory ledger</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Subjects Summary */}
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Assigned Course Allocations</h3>
                <span className="badge badge-purple">CSE Sem 6</span>
              </div>
              <div className="course-allocations-list">
                {assignedCourses.map(course => (
                  <div key={course.code} className="allocation-card">
                    <div className="alloc-header">
                      <span className="badge badge-purple">{course.code}</span>
                      <span className="alloc-credits">{course.credits} Credits &bull; {course.type}</span>
                    </div>
                    <div className="alloc-name">{course.name}</div>
                    <div className="alloc-meta">Room: TB-201 &bull; Enrolled: 45 Students</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SESSION ATTENDANCE ROLL CALL --- */}
      {activeTab === 'teacher_attendance' && (() => {
        const sem5All = window.masterDB.db.users.filter(u => u.role === 'Student' && (u.department === 'CSE' || u.department === 'Computer Science and Engineering' || u.dept === 'CSE') && Number(u.semester) === 5);
        const count5A = sem5All.filter(s => s.section === 'A').length;
        const count5B = sem5All.filter(s => s.section === 'B').length;

        return (
          <div className="teacher-view-container">
            <div className="panel-card mb-4">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Session Engine & Daily Attendance Register</h3>
                  <p className="panel-desc">All student attendances are tied to valid Session IDs with location and device signature &bull; Maharaja Institute of Technology Thandavapura</p>
                </div>
                <div className="attendance-header-actions">
                  <button className="btn btn-secondary btn-sm" onClick={handleMarkAllPresent}>
                    <Icons.CheckCircle size={14} /> Mark All Present ({studentsInClass.length})
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveAttendance}>
                    <Icons.Award size={14} /> Save Session Attendance
                  </button>
                </div>
              </div>

              {/* Quick Cohort Section Switcher Buttons */}
              <div className="cohort-section-toggle-bar mb-3">
                <div className="section-pill-group">
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'A' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('A'); }}
                  >
                    A Section — 68 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'B' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('B'); }}
                  >
                    B Section — 67 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'All' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('All'); }}
                  >
                    All 5th Sem CSE ({sem5All.length})
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 6 ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(6); setSelectedSection('A'); }}
                  >
                    Semester 6 (Demo)
                  </button>
                </div>

                <div className="cohort-active-indicator">
                  <span className="badge badge-primary">
                    {selectedSem === 5 && selectedSection === 'A' ? 'A Section — 68 records' :
                     selectedSem === 5 && selectedSection === 'B' ? 'B Section — 67 records' :
                     `Active Roster: ${studentsInClass.length} Students`}
                  </span>
                </div>
              </div>

              {/* Attendance Controls & Search Filter */}
              <div className="user-directory-filters mb-3">
                <div className="search-box-wrapper">
                  <Icons.Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search students by name, USN, or roll number..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Course Subject:</label>
                  <select 
                    className="form-input filter-select" 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    {selectedSem === 5 ? (
                      <>
                        <option value="CS501">CS501 Software Eng & Agile</option>
                        <option value="CS502">CS502 Computer Networks</option>
                        <option value="CS503">CS503 Theory of Computation</option>
                        <option value="CS504">CS504 Database Management (DBMS)</option>
                        <option value="CS505">CS505 Networks & DBMS Lab</option>
                        <option value="CS506">CS506 Research Methodology & IPR</option>
                      </>
                    ) : (
                      <>
                        <option value="CS601">CS601 Distributed Systems</option>
                        <option value="CS602">CS602 Machine Learning</option>
                        <option value="CS603">CS603 Cloud Architecture</option>
                        <option value="CS604">CS604 Compiler Design</option>
                        <option value="CS605">CS605 Cloud Lab</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Semester:</label>
                  <select 
                    className="form-input filter-select" 
                    value={selectedSem} 
                    onChange={(e) => setSelectedSem(Number(e.target.value))}
                  >
                    <option value={5}>Semester 5 (Active 135 Cohort)</option>
                    <option value={6}>Semester 6</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Section:</label>
                  <select 
                    className="form-input filter-select" 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="A">Section A (68)</option>
                    <option value="B">Section B (67)</option>
                    <option value="All">All Sections (135)</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Filter Date:</label>
                  <input 
                    type="date" 
                    className="form-input filter-select" 
                    value={attendanceDateFilter}
                    onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* Session Status HUD */}
              <div className="session-status-hud mb-3">
                <div className="hud-metric">
                  <span className="hud-label">Active Session ID:</span>
                  <span className="hud-val text-primary font-mono">{activeSession ? activeSession.sessionId : (selectedCourse === 'CS501' ? 'SES-2026-0924-DS-001' : `SES-2026-0924-${selectedCourse}-001`)}</span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">Subject & Room:</span>
                  <span className="hud-val font-semibold">{selectedCourse === 'CS501' ? 'Data Structures (CS501)' : selectedCourse} &bull; Room CSE-204</span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">Session Status:</span>
                  <span className="badge badge-emerald">Attendance Active (9:55 AM – 10:15 AM)</span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">Attendance Rate:</span>
                  <span className="hud-val text-emerald font-bold">
                    {(() => {
                      const currentSessionId = activeSession ? activeSession.sessionId : (selectedCourse === 'CS501' ? 'SES-2026-0924-DS-001' : `SES-2026-0924-${selectedCourse}-001`);
                      const presentTotal = studentsInClass.filter(s => {
                        if (attendanceMap[s.id] !== undefined) return attendanceMap[s.id] === 'Present' || attendanceMap[s.id] === 'Late';
                        const rec = (window.masterDB.db.attendanceRecords || []).find(r => (r.studentId === s.id || r.usn === s.usn) && (r.sessionId === currentSessionId || r.subjectCode === selectedCourse));
                        return rec && (rec.status === 'PRESENT' || rec.status === 'Present');
                      }).length;
                      const pct = studentsInClass.length > 0 ? ((presentTotal / studentsInClass.length) * 100).toFixed(1) : 0;
                      return `${presentTotal} / ${studentsInClass.length} (${pct}%)`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Table with Required Columns: Student ID | Student Name | Face | Fingerprint | Attendance | Time */}
              <div className="table-responsive mt-3">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th style={{ textAlign: 'center' }}>Face</th>
                      <th style={{ textAlign: 'center' }}>Fingerprint</th>
                      <th style={{ textAlign: 'center' }}>Attendance</th>
                      <th style={{ textAlign: 'center' }}>Time</th>
                      <th style={{ textAlign: 'right' }}>Roll Call Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInClass.map((s, index) => {
                      const currentSessionId = activeSession ? activeSession.sessionId : (selectedCourse === 'CS501' ? 'SES-2026-0924-DS-001' : `SES-2026-0924-${selectedCourse}-001`);
                      const verifiedRecord = (window.masterDB.db.attendanceRecords || []).find(r => 
                        (r.studentId === s.id || r.usn === s.usn) && 
                        (r.sessionId === currentSessionId || r.subjectCode === selectedCourse)
                      );

                      const isMarkedInMap = attendanceMap[s.id] !== undefined;
                      const isPresent = isMarkedInMap 
                        ? (attendanceMap[s.id] === 'Present' || attendanceMap[s.id] === 'Late')
                        : (verifiedRecord && (verifiedRecord.status === 'PRESENT' || verifiedRecord.status === 'Present'));

                      const faceVerified = verifiedRecord ? verifiedRecord.faceVerified : (isMarkedInMap && isPresent);
                      const fingerprintVerified = verifiedRecord ? verifiedRecord.fingerprintVerified : (isMarkedInMap && isPresent);
                      const verifiedTime = verifiedRecord ? (verifiedRecord.time || '10:03') : (isPresent ? '10:05' : '—');
                      const isDiploma = s.studentType === 'Diploma' || s.usn === 'Not Available';

                      return (
                        <tr key={s.id}>
                          <td><span className="text-muted text-sm">{index + 1}</span></td>
                          <td>
                            {isDiploma ? (
                              <span className="badge badge-purple" title="Diploma Lateral: No USN Assigned">Not Available</span>
                            ) : s.usn ? (
                              <code className="text-primary font-bold">{s.usn}</code>
                            ) : (
                              <strong>{s.rollNo}</strong>
                            )}
                          </td>
                          <td>
                            <div className="student-cell-profile">
                              <img src={s.avatar} alt={s.name} className="cell-avatar" />
                              <div>
                                <strong className="student-exact-name">{s.name}</strong>
                                <div className="text-muted text-xs">Sec {s.section} &bull; {s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {faceVerified ? (
                              <span className="badge badge-emerald font-bold" title="Face verification verified">✓</span>
                            ) : (
                              <span className="text-muted font-bold">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {fingerprintVerified ? (
                              <span className="badge badge-emerald font-bold" title="Fingerprint verification verified">✓</span>
                            ) : (
                              <span className="text-muted font-bold">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${isPresent ? 'badge-emerald font-bold' : 'badge-slate'}`}>
                              {isPresent ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="font-mono text-sm">{verifiedTime}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="attendance-btn-group" style={{ justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                className={`att-btn att-present ${isPresent ? 'active' : ''}`}
                                onClick={() => setAttendanceMap(prev => ({ ...prev, [s.id]: 'Present' }))}
                                title="Mark Present"
                              >
                                Present
                              </button>
                              <button 
                                type="button" 
                                className={`att-btn att-absent ${!isPresent ? 'active' : ''}`}
                                onClick={() => setAttendanceMap(prev => ({ ...prev, [s.id]: 'Absent' }))}
                                title="Mark Absent"
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {studentsInClass.length === 0 && (
                  <div className="empty-state-card py-4 text-center">
                    <Icons.Users size={36} className="text-muted mx-auto mb-2" />
                    <h4>No student records found in this cohort</h4>
                    <p className="text-muted">Adjust section filter or search keywords.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB: GPS GEOFENCE ATTENDANCE ROSTER --- */}
      {activeTab === 'teacher_geo_roster' && (
        <div className="teacher-view-container">
          <GeofenceAdminConfig />
        </div>
      )}

      {/* --- TAB: CONTINUOUS INTERNAL MARKS --- */}
      {activeTab === 'teacher_marks' && (() => {
        const sem5All = window.masterDB.db.users.filter(u => u.role === 'Student' && (u.department === 'CSE' || u.department === 'Computer Science and Engineering' || u.dept === 'CSE') && Number(u.semester) === 5);

        return (
          <div className="teacher-view-container">
            <div className="panel-card mb-4">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Internal Marks Entry & Finalization Gateway</h3>
                  <p className="panel-desc">Scoring Rubric: IA1 (20) + IA2 (20) + Assignment (10) + Quiz (10) = Total (60) &bull; Maharaja Institute of Technology Thandavapura</p>
                </div>
                <div className="btn-group-sm">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSaveMarks(false)}>
                    Save Draft
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleSaveMarks(true)}>
                    Submit for HOD Approval
                  </button>
                </div>
              </div>

              {/* Quick Cohort Section Switcher Buttons */}
              <div className="cohort-section-toggle-bar mb-3">
                <div className="section-pill-group">
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'A' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('A'); }}
                  >
                    A Section — 68 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'B' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('B'); }}
                  >
                    B Section — 67 records
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 5 && selectedSection === 'All' ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(5); setSelectedSection('All'); }}
                  >
                    All 5th Sem CSE ({sem5All.length})
                  </button>
                  <button 
                    className={`section-toggle-btn ${selectedSem === 6 ? 'active' : ''}`}
                    onClick={() => { setSelectedSem(6); setSelectedSection('A'); }}
                  >
                    Semester 6
                  </button>
                </div>

                <div className="cohort-active-indicator">
                  <span className="badge badge-primary">
                    {selectedSem === 5 && selectedSection === 'A' ? 'A Section — 68 records' :
                     selectedSem === 5 && selectedSection === 'B' ? 'B Section — 67 records' :
                     `Active Roster: ${studentsInClass.length} Students`}
                  </span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="user-directory-filters mb-3">
                <div className="search-box-wrapper">
                  <Icons.Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search students..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Course Subject:</label>
                  <select 
                    className="form-input filter-select" 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    {selectedSem === 5 ? (
                      <>
                        <option value="CS501">CS501 Software Eng & Agile</option>
                        <option value="CS502">CS502 Computer Networks</option>
                        <option value="CS503">CS503 Theory of Computation</option>
                        <option value="CS504">CS504 Database Management (DBMS)</option>
                        <option value="CS505">CS505 Networks & DBMS Lab</option>
                        <option value="CS506">CS506 Research Methodology & IPR</option>
                      </>
                    ) : (
                      <>
                        <option value="CS601">CS601 Distributed Systems</option>
                        <option value="CS602">CS602 Machine Learning</option>
                        <option value="CS603">CS603 Cloud Architecture</option>
                        <option value="CS604">CS604 Compiler Design</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <label className="filter-label">Section:</label>
                  <select 
                    className="form-input filter-select" 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <option value="A">Section A (68)</option>
                    <option value="B">Section B (67)</option>
                    <option value="All">All Sections (135)</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>USN / Identifier</th>
                      <th>Student Name</th>
                      <th>Admission</th>
                      <th>IA 1 (20)</th>
                      <th>IA 2 (20)</th>
                      <th>Asg (10)</th>
                      <th>Quiz (10)</th>
                      <th>Total (60)</th>
                      <th>Calculated Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInClass.map((s, index) => {
                      const marks = gradebookMarks[s.id] || { ia1: 18, ia2: 17, assignment: 9, quiz: 8, total: 52, grade: 'A+' };
                      const isDiploma = s.studentType === 'Diploma' || s.usn === 'Not Available';
                      return (
                        <tr key={s.id}>
                          <td><span className="text-muted text-sm">{index + 1}</span></td>
                          <td>
                            {isDiploma ? (
                              <span className="badge badge-purple" title="Diploma Lateral: No USN Assigned">Not Available</span>
                            ) : s.usn ? (
                              <code className="text-primary font-bold">{s.usn}</code>
                            ) : (
                              <strong>{s.rollNo}</strong>
                            )}
                          </td>
                          <td>
                            <div className="student-cell-profile">
                              <img src={s.avatar} alt={s.name} className="cell-avatar" />
                              <strong className="student-exact-name">{s.name}</strong>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${isDiploma ? 'badge-amber' : 'badge-primary'}`}>
                              {s.studentType || (isDiploma ? 'Diploma' : 'Regular')}
                            </span>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input table-number-input" 
                              value={marks.ia1} 
                              min="0" 
                              max="20"
                              onChange={(e) => handleScoreChange(s.id, 'ia1', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input table-number-input" 
                              value={marks.ia2} 
                              min="0" 
                              max="20"
                              onChange={(e) => handleScoreChange(s.id, 'ia2', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input table-number-input" 
                              value={marks.assignment} 
                              min="0" 
                              max="10"
                              onChange={(e) => handleScoreChange(s.id, 'assignment', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input table-number-input" 
                              value={marks.quiz} 
                              min="0" 
                              max="10"
                              onChange={(e) => handleScoreChange(s.id, 'quiz', e.target.value)}
                            />
                          </td>
                          <td><strong className="text-primary">{marks.total} / 60</strong></td>
                          <td><span className="badge badge-emerald">{marks.total >= 54 ? 'O' : marks.total >= 48 ? 'A+' : 'A'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- TAB: TIMETABLE & DYNAMIC SHIFTS --- */}
      {activeTab === 'teacher_timetable' && (
        <div className="teacher-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Assigned Teaching Schedule</h3>
                <p className="panel-desc">All weekly lecture hours, laboratories, and classroom allocations</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShiftModalOpen(true)}>
                <Icons.Calendar size={16} /> Request Timetable Shift
              </button>
            </div>

            <div className="timetable-grid-full">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const daySlots = window.masterDB.db.timetable.filter(t => t.day === day && t.teacherId === 'usr-tch-01');
                return (
                  <div key={day} className="day-schedule-column">
                    <div className="day-col-header">{day}</div>
                    <div className="day-slots-list">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="slot-card">
                          <span className="slot-card-time">{slot.timeSlot}</span>
                          <span className="slot-card-title">{slot.subjectCode}: {slot.subjectName}</span>
                          <span className="slot-card-room">📍 {slot.room}</span>
                          <span className="slot-card-faculty">Cohort: Sem {slot.semester} Sec {slot.section}</span>
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

      {/* --- TAB: MANAGE ASSIGNMENTS (Requirements 43 & 44) --- */}
      {activeTab === 'teacher_assignments' && (
        <div className="teacher-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Assignments Management & Submission Evaluation</h3>
                <p className="panel-desc">Create assignments with rubric deadlines and grade student submissions with feedback</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateAsgModalOpen(true)}>
                <Icons.Plus size={16} /> Create Assignment
              </button>
            </div>

            <div className="assignment-cards-list">
              {assignmentsList.map(asg => (
                <div key={asg.id} className="assignment-item-card">
                  <div className="asg-card-top">
                    <div>
                      <span className="badge badge-purple">{asg.subjectCode}</span>
                      <h4 className="asg-title">{asg.title}</h4>
                    </div>
                    <div>
                      <span className="badge badge-primary">{asg.totalSubmissions || 42} Submissions</span>
                      <span className="badge badge-slate ml-2">Max Marks: {asg.maxMarks}</span>
                    </div>
                  </div>
                  <p className="asg-desc">{asg.description}</p>
                  <div className="asg-meta-row">
                    <span><strong>Deadline:</strong> {asg.deadline}</span>
                    <span><strong>Cohort:</strong> Sem {asg.semester} Sec {asg.section}</span>
                    <span><strong>Specification:</strong> <code>{asg.attachment}</code></span>
                  </div>
                  <div className="asg-action-bar mt-3">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedAsgForReview(asg);
                        setReviewModalOpen(true);
                      }}
                    >
                      <Icons.Award size={14} /> Review & Grade Submissions ({asg.totalSubmissions || 42})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: UPLOAD CURRICULUM MATERIALS (Requirements 45 & 46) --- */}
      {activeTab === 'teacher_materials' && (
        <div className="teacher-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Curriculum Study Materials Repository</h3>
                <p className="panel-desc">Publish lecture notes, presentation slides, lab instructions, and question banks</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setUploadMatModalOpen(true)}>
                <Icons.UploadCloud size={16} /> Upload Study Material
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject & Unit</th>
                    <th>Document Title</th>
                    <th>Format Type</th>
                    <th>File Size</th>
                    <th>Uploaded Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materialsList.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span className="badge badge-purple">{m.subjectCode}</span>
                        <div className="text-muted text-sm">{m.unit}</div>
                      </td>
                      <td>
                        <strong>{m.title}</strong>
                        {m.importantQuestionsAttached && (
                          <span className="badge badge-emerald ml-2 text-xs">Question Bank Included</span>
                        )}
                      </td>
                      <td><span className="badge badge-slate">{m.type}</span></td>
                      <td>{m.fileSize}</td>
                      <td>{m.uploadedDate}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Downloading ${m.fileName}`, 'success')}>
                          <Icons.Download size={14} /> View
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

      {/* --- TAB: EXAMINATION ROSTER & INVIGILATION (Requirement 35) --- */}
      {activeTab === 'teacher_exams' && (
        <div className="teacher-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Assigned Course Examinations & Invigilation Duties</h3>
                <p className="panel-desc">Scheduled continuous assessments, semester evaluations, and assigned exam hall duties</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Exam Type</th>
                    <th>Subject</th>
                    <th>Date & Day</th>
                    <th>Time Window</th>
                    <th>Hall / Room</th>
                    <th>Duty Role</th>
                  </tr>
                </thead>
                <tbody>
                  {(window.masterDB.db.exams || []).map(ex => (
                    <tr key={ex.id}>
                      <td><span className="badge badge-purple">{ex.type}</span></td>
                      <td><strong>{ex.subjectCode}</strong>: {ex.subjectName}</td>
                      <td>{ex.date} ({ex.day})</td>
                      <td>{ex.startTime} - {ex.endTime}</td>
                      <td><span className="badge badge-primary">{ex.room}</span></td>
                      <td>
                        <span className="badge badge-emerald font-semibold">Chief Invigilator</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: NOTICES & ANNOUNCEMENTS (Requirement 50) --- */}
      {activeTab === 'teacher_notices' && (
        <div className="teacher-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Department Announcements & Circulars</h3>
                <p className="panel-desc">Broadcast academic updates, assignment deadline adjustments, or lab advisories</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setPublishNoticeModalOpen(true)}>
                <Icons.Bell size={16} /> Broadcast Announcement
              </button>
            </div>

            <div className="notices-list-grid">
              {(window.masterDB.db.notices || []).map(notice => (
                <div key={notice.id} className="notice-item-card">
                  <div className="notice-card-header">
                    <span className="badge badge-purple">{notice.category}</span>
                    <span className="text-muted text-sm">{notice.date}</span>
                  </div>
                  <h4 className="notice-card-title mt-2">{notice.title}</h4>
                  <p className="notice-card-desc">{notice.description}</p>
                  <div className="notice-card-footer">
                    <span className="text-muted text-sm">By: {notice.publishedBy}</span>
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

      {/* Create Assignment Modal */}
      <Modal 
        isOpen={createAsgModalOpen} 
        onClose={() => setCreateAsgModalOpen(false)}
        title="Create Course Assignment"
      >
        <form onSubmit={handleCreateAssignment}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-input" value={asgCourse} onChange={(e) => setAsgCourse(e.target.value)}>
              {assignedCourses.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assignment Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Implementation of Three-Node Raft Consensus State Machine" 
              value={asgTitle}
              onChange={(e) => setAsgTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Submission Deadline</label>
              <input 
                type="date" 
                className="form-input" 
                value={asgDeadline}
                onChange={(e) => setAsgDeadline(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Marks</label>
              <input 
                type="number" 
                className="form-input" 
                value={asgMaxMarks}
                min="5" 
                max="50"
                onChange={(e) => setAsgMaxMarks(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Detailed Problem Statement / Instructions</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Specify requirements, constraints, test benchmarks, and submission archive format"
              value={asgDesc}
              onChange={(e) => setAsgDesc(e.target.value)}
              required
            ></textarea>
          </div>
          <FileUpload 
            label="Upload Assignment Specification Document (PDF)"
            onFileSelect={(file) => setAsgAttachmentName(file ? file.name : '')}
          />
          <div className="modal-actions-row mt-3">
            <button type="button" className="btn btn-secondary" onClick={() => setCreateAsgModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish Assignment to Cohort
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Submissions Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Evaluate Submissions: ${selectedAsgForReview?.title || 'Assignment'}`}
      >
        <div>
          <p className="text-muted text-sm mb-3">
            Review submitted student artifacts, award continuous evaluation marks, and return faculty remarks.
          </p>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Submitted Artifact</th>
                  <th>Award Marks (Max 10)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.slice(0, 3).map(s => {
                  const sub = (window.masterDB.db.submissions[s.id] || [])[0] || {
                    fileName: `${s.rollNo}_assignment_sol.pdf`,
                    status: 'Submitted',
                    scoreObtained: 9,
                    teacherFeedback: 'Good approach.'
                  };
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.rollNo}</strong></td>
                      <td>{s.name}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => addToast(`Opening ${sub.fileName}`, 'info')}
                        >
                          <Icons.Download size={12} /> {sub.fileName}
                        </button>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-input table-number-input" 
                          defaultValue={sub.scoreObtained || 9}
                          min="0" 
                          max="10"
                          onChange={(e) => setReviewScore(e.target.value)}
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleGradeSubmission(s.id, selectedAsgForReview?.id)}
                        >
                          Save Grade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Upload Study Material Modal */}
      <Modal
        isOpen={uploadMatModalOpen}
        onClose={() => setUploadMatModalOpen(false)}
        title="Upload Curriculum Study Material"
      >
        <form onSubmit={handleUploadMaterial}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-input" value={matCourse} onChange={(e) => setMatCourse(e.target.value)}>
              {assignedCourses.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Curriculum Unit</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Unit 3: Distributed Consensus & Storage Systems" 
              value={matUnit}
              onChange={(e) => setMatUnit(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Document Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Paxos & Raft State Machine Replication Guide" 
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Document Format Type</label>
              <select className="form-input" value={matType} onChange={(e) => setMatType(e.target.value)}>
                <option value="PDF Notes">PDF Notes</option>
                <option value="Presentation Slides">Presentation Slides</option>
                <option value="Important Questions">Important Questions Bank</option>
                <option value="Lab Manual">Lab Manual & Code Spec</option>
              </select>
            </div>
            <div className="form-group flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={matQuestionsAttached}
                  onChange={(e) => setMatQuestionsAttached(e.target.checked)}
                />
                <span className="text-sm font-semibold">Includes Question Bank</span>
              </label>
            </div>
          </div>
          <FileUpload 
            label="Upload Document File"
            onFileSelect={(file) => setMatFileName(file ? file.name : '')}
          />
          <div className="modal-actions-row mt-3">
            <button type="button" className="btn btn-secondary" onClick={() => setUploadMatModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Upload & Make Available to Students
            </button>
          </div>
        </form>
      </Modal>

      {/* Publish Announcement Modal */}
      <Modal
        isOpen={publishNoticeModalOpen}
        onClose={() => setPublishNoticeModalOpen(false)}
        title="Broadcast Class Announcement"
      >
        <form onSubmit={handlePublishNotice}>
          <div className="form-group">
            <label className="form-label">Announcement Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Compensatory Lab Session on Saturday 10 AM" 
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={noticeCategory} onChange={(e) => setNoticeCategory(e.target.value)}>
                <option value="Academic">Academic</option>
                <option value="Exam">Exam / IA Notice</option>
                <option value="Attendance">Attendance Advisory</option>
                <option value="Timetable">Timetable Adjustment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={noticePriority} onChange={(e) => setNoticePriority(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message Content</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Detailed instructions for student cohort"
              value={noticeDesc}
              onChange={(e) => setNoticeDesc(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setPublishNoticeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Broadcast Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Dynamic Shift Request Modal */}
      <Modal 
        isOpen={shiftModalOpen} 
        onClose={() => setShiftModalOpen(false)}
        title="Request Dynamic Timetable Shift"
      >
        <form onSubmit={handleRequestShift}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {assignedCourses.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Type of Adjustment</label>
            <select className="form-input" value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
              <option value="Room Change">Room Change (e.g. shift to Lab 3)</option>
              <option value="Substitute Teacher">Substitute Teacher (e.g. peer faculty replacement)</option>
              <option value="Time Slot Shift">Time Slot Shift (e.g. swap morning/afternoon)</option>
              <option value="Extra Class">Extra Compensatory Class</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">New Value (Room, Faculty or Time)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Lab 3 (Turing Block 3rd Floor)" 
              value={shiftNewVal}
              onChange={(e) => setShiftNewVal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Justification / Reason</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Explain academic requirement for timetable adjustment"
              value={shiftReason}
              onChange={(e) => setShiftReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setShiftModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Disptach Shift & Notify Students
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

window.TeacherDashboard = TeacherDashboard;
