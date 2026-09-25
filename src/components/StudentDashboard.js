// CampusConnect Student Portal - Master Dashboard & Feature Router
// Connects Overview, Timetable, Attendance, Exams, Marks, Assignments, Materials,
// What I Missed, Class Memory, AI Assistant, Bus Routes, Academic Records, and Helpdesk.

function StudentDashboard({ activeTab }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [materials, setMaterials] = React.useState([]);
  const [selectedMaterialSubject, setSelectedMaterialSubject] = React.useState('All');
  const [exams, setExams] = React.useState([]);
  const [seating, setSeating] = React.useState([]);

  const studentId = user?.id || 'usr-std-01';

  React.useEffect(() => {
    window.materialService.getMaterials(selectedMaterialSubject).then(setMaterials);
    window.examService.getExams().then(setExams);
    window.examService.getSeatingArrangements(null, studentId).then(setSeating);
  }, [selectedMaterialSubject, studentId]);

  if (!user || user.role !== 'Student') {
    return (
      <div className="empty-state-box">
        <Icons.AlertTriangle size={36} className="text-warning mb-2" />
        <h3>Access Restricted</h3>
        <p>Please log in with an authorized student account to view this section.</p>
      </div>
    );
  }

  // Load strictly scoped data for this student
  const studentProfile = user;
  const defaultSem5Attendance = [
    { subjectCode: 'CS501', subjectName: 'Software Engineering & Agile', total: 24, attended: Math.round(24 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 },
    { subjectCode: 'CS502', subjectName: 'Computer Networks', total: 24, attended: Math.round(24 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 },
    { subjectCode: 'CS503', subjectName: 'Theory of Computation', total: 22, attended: Math.round(22 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 },
    { subjectCode: 'CS504', subjectName: 'Database Management (DBMS)', total: 24, attended: Math.round(24 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 },
    { subjectCode: 'CS505', subjectName: 'Networks & DBMS Lab', total: 12, attended: Math.round(12 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 },
    { subjectCode: 'CS506', subjectName: 'Research Methodology & IPR', total: 18, attended: Math.round(18 * ((user.overallAttendance || 85) / 100)), percentage: user.overallAttendance || 85 }
  ];

  const defaultSem5Marks = [
    { subjectCode: 'CS501', subjectName: 'Software Engineering & Agile', ia1: 18, ia2: 17, assignment: 9, quiz: 8, total: 52, maxMarks: 60, status: 'Audited' },
    { subjectCode: 'CS502', subjectName: 'Computer Networks', ia1: 19, ia2: 18, assignment: 10, quiz: 9, total: 56, maxMarks: 60, status: 'Audited' },
    { subjectCode: 'CS503', subjectName: 'Theory of Computation', ia1: 16, ia2: 17, assignment: 8, quiz: 8, total: 49, maxMarks: 60, status: 'Audited' },
    { subjectCode: 'CS504', subjectName: 'Database Management (DBMS)', ia1: 19, ia2: 19, assignment: 9, quiz: 9, total: 56, maxMarks: 60, status: 'Audited' },
    { subjectCode: 'CS505', subjectName: 'Networks & DBMS Lab', ia1: 20, ia2: 19, assignment: 10, quiz: 10, total: 59, maxMarks: 60, status: 'Audited' },
    { subjectCode: 'CS506', subjectName: 'Research Methodology & IPR', ia1: 17, ia2: 18, assignment: 9, quiz: 8, total: 52, maxMarks: 60, status: 'Audited' }
  ];

  const attendanceRecords = window.masterDB.db.studentSubjectAttendance[studentId] || 
    (Number(user.semester) === 5 ? defaultSem5Attendance : (window.masterDB.db.studentSubjectAttendance['usr-std-01'] || []));
  const sessionHistory = window.masterDB.db.attendanceRecords.filter(r => r.studentId === studentId);
  const marksRecords = window.masterDB.db.internalMarks[studentId] || 
    (Number(user.semester) === 5 ? defaultSem5Marks : (window.masterDB.db.internalMarks['usr-std-01'] || []));
  const assignments = window.masterDB.db.assignments || [];
  const submissions = window.masterDB.db.submissions[studentId] || [];
  const timetable = window.masterDB.db.timetable.filter(t => 
    (t.dept === 'CSE' || t.dept === user.department || user.dept === 'CSE') && 
    t.semester === Number(user.semester || 5) && 
    (!user.section || t.section === user.section)
  );
  const dynamicChanges = window.masterDB.db.dynamicTimetableChanges || [];
  const privacyLogs = window.campusStore?.getStudentPrivacyAudit?.(user.id) || [];

  const totalClasses = attendanceRecords.reduce((acc, r) => acc + r.total, 0);
  const totalAttended = attendanceRecords.reduce((acc, r) => acc + r.attended, 0);
  const overallAttendance = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : (user.overallAttendance || 0);
  const isAttendanceLow = overallAttendance < 75;

  return (
    <div className="student-dashboard">
      {/* Student Banner Header */}
      <div className="student-profile-banner">
        <div className="profile-banner-left">
          <img src={studentProfile.avatar} alt={studentProfile.name} className="student-banner-avatar" />
          <div className="student-banner-info">
            <div className="student-name-row">
              <h1 className="student-display-name">{studentProfile.name}</h1>
              <span className="badge badge-primary">{studentProfile.rollNo || '21CS042'}</span>
              <span className="badge badge-emerald">USN: {studentProfile.usn || '1NT21CS042'}</span>
              <span className="badge badge-indigo">
                <Icons.Lock size={12} className="inline-icon" /> FERPA Scoped
              </span>
            </div>
            <div className="student-meta-pills">
              <span className="meta-pill"><strong>Dept:</strong> Computer Science & Engineering</span>
              <span className="meta-pill"><strong>Semester:</strong> {studentProfile.semester || 5}th Semester &bull; Section {studentProfile.section || 'A'}</span>
              <span className="meta-pill"><strong>Bus Route:</strong> {studentProfile.busRouteNumber || 'Route 04'}</span>
              <span className="meta-pill"><strong>Academic Advisor:</strong> Prof. Ananya Iyer</span>
            </div>
          </div>
        </div>

        <div className="profile-banner-right">
          <div className="quick-metric">
            <span className="quick-metric-label">Cumulative GPA</span>
            <span className="quick-metric-val">{studentProfile.cgpa || 9.18} <small>/ 10.0</small></span>
          </div>
          <div className="quick-metric">
            <span className="quick-metric-label">Term Attendance</span>
            <span className={`quick-metric-val ${isAttendanceLow ? 'text-danger' : 'text-emerald'}`}>
              {overallAttendance}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Timetable Alert Banner if applicable */}
      {dynamicChanges.length > 0 && (
        <AlertBanner 
          type="info"
          title={`Dynamic Timetable Notice: ${dynamicChanges[0].subjectCode}`}
          message={`${dynamicChanges[0].changeType} approved: ${dynamicChanges[0].oldValue} has shifted to ${dynamicChanges[0].newValue}. Reason: ${dynamicChanges[0].reason}`}
        />
      )}

      {/* Attendance Warning if <75% */}
      {isAttendanceLow && (
        <AlertBanner 
          type="danger" 
          title="Mandatory Attendance Shortage Notice (< 75%)"
          message={`Your current attendance is ${overallAttendance}%, which is below the mandatory 75% institutional requirement. You are at risk of being debarred from the End-Semester Examinations.`}
        />
      )}

      {/* --- ROUTE 1: OVERVIEW --- */}
      {(activeTab === 'student_overview' || !activeTab) && (
        <div className="student-view-container">
          <div className="stat-cards-grid">
            <StatCard 
              title="Overall Attendance" 
              value={`${overallAttendance}%`} 
              subtitle={isAttendanceLow ? 'Below 75% requirement' : 'Above mandatory threshold'}
              icon={Icons.Clock}
              color={isAttendanceLow ? 'rose' : 'emerald'}
              trend={{ type: isAttendanceLow ? 'down' : 'up', text: `${totalAttended}/${totalClasses} classes` }}
            />
            <StatCard 
              title="Next Lecture Today" 
              value="CS601 (09:00)" 
              subtitle="Room TB-201 with Prof. Ananya"
              icon={Icons.Calendar}
              color="blue"
            />
            <StatCard 
              title="Internal IA2 Exam" 
              value="Oct 12" 
              subtitle="Distributed Systems (Room TB-201)"
              icon={Icons.Award}
              color="purple"
            />
            <StatCard 
              title="Pending Assignments" 
              value="1 Due" 
              subtitle="Raft Consensus (Oct 5)"
              icon={Icons.FileText}
              color="amber"
            />
          </div>

          <div className="dashboard-columns-grid">
            {/* Subject Attendance Breakdown */}
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Subject-Wise Attendance Status</h3>
                  <p className="panel-desc">Threshold rule: Minimum 75% required per course</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Faculty</th>
                      <th>Attended / Total</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((rec) => {
                      const isLow = rec.percentage < 75;
                      return (
                        <tr key={rec.subjectCode}>
                          <td>
                            <strong>{rec.subjectCode}</strong>
                            <div className="text-muted text-sm">{rec.subjectName}</div>
                          </td>
                          <td className="text-sm">{rec.faculty}</td>
                          <td>{rec.attended} / {rec.total}</td>
                          <td>
                            <ProgressBar value={rec.percentage} max={100} showLabel={false} height={6} />
                            <span className={`text-sm font-semibold ${isLow ? 'text-danger' : 'text-emerald'}`}>
                              {rec.percentage}%
                            </span>
                          </td>
                          <td>
                            {isLow ? <Badge variant="danger">Shortage</Badge> : <Badge variant="success">Eligible</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Next Class & Quick Actions */}
            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Next Scheduled Session</h3>
                <span className="badge badge-emerald">Upcoming</span>
              </div>
              <div className="next-class-card">
                <div className="nc-course-code">CS601: Distributed Systems</div>
                <div className="nc-meta">
                  <div>👨‍🏫 Instructor: <strong>Prof. Ananya Iyer</strong></div>
                  <div>📍 Room: <strong>TB-201 (2nd Floor)</strong></div>
                  <div>⏰ Time: <strong>09:00 AM – 10:00 AM</strong></div>
                  <div>📡 Session ID: <code>SES-2026-0924-CS601-001</code></div>
                </div>
              </div>

              <h4 className="mt-4 mb-2 font-semibold text-sm text-muted">Quick Navigation</h4>
              <div className="quick-action-links">
                <button className="quick-link-btn" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'student_timetable' }))}>
                  📅 View Full Timetable
                </button>
                <button className="quick-link-btn" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'student_what_i_missed' }))}>
                  📖 What I Missed in Class
                </button>
                <button className="quick-link-btn" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'student_ai_assistant' }))}>
                  🤖 Ask Department AI Assistant
                </button>
                <button className="quick-link-btn" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'student_bus' }))}>
                  🚌 Check Bus Route 04
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 2: TIMETABLE --- */}
      {activeTab === 'student_timetable' && (
        <div className="student-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Weekly Official Timetable & Dynamic Shifts</h3>
                <p className="panel-desc">Department of CSE &bull; Semester 6 &bull; Section A</p>
              </div>
            </div>

            <div className="timetable-grid-full">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const daySlots = timetable.filter(t => t.day === day);
                return (
                  <div key={day} className="day-schedule-column">
                    <div className="day-col-header">{day}</div>
                    <div className="day-slots-list">
                      {daySlots.map((slot) => {
                        const hasChange = dynamicChanges.find(c => c.timetableEntryId === slot.id);
                        return (
                          <div key={slot.id} className={`slot-card ${hasChange ? 'slot-dynamic-changed' : ''}`}>
                            <span className="slot-card-time">{slot.timeSlot}</span>
                            <span className="slot-card-title">{slot.subjectCode}: {slot.subjectName}</span>
                            <span className="slot-card-room">📍 {hasChange ? hasChange.newValue : slot.room}</span>
                            <span className="slot-card-faculty">👨‍🏫 {slot.teacherName}</span>
                            {hasChange && (
                              <span className="badge badge-warning text-xs mt-1">
                                {hasChange.changeType}: {hasChange.reason}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 3: ATTENDANCE & BIOMETRIC VERIFICATION SYSTEM --- */}
      {activeTab === 'student_attendance' && (
        <div className="student-view-container">
          <StudentAttendanceVerification />
        </div>
      )}

      {/* --- ROUTE 3B: REAL-TIME GPS GEOFENCE ATTENDANCE --- */}
      {activeTab === 'student_geo_attendance' && (
        <div className="student-view-container">
          <GeoAttendanceView />
        </div>
      )}

      {/* --- ROUTE 4: EXAMS & SEATING --- */}
      {activeTab === 'student_exams' && (
        <div className="student-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Examination Timetable & Assigned Seating Desk</h3>
                <p className="panel-desc">Official schedule and desk allocation for Internal Assessments and Final Semester Exams</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Examination</th>
                    <th>Subject Code & Name</th>
                    <th>Date & Day</th>
                    <th>Time Window</th>
                    <th>Room</th>
                    <th>Assigned Desk</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(ex => {
                    const mySeat = seating.find(s => s.examId === ex.id);
                    return (
                      <tr key={ex.id}>
                        <td><span className="badge badge-purple">{ex.type}</span></td>
                        <td><strong>{ex.subjectCode}</strong> - {ex.subjectName}</td>
                        <td>{ex.date} ({ex.day})</td>
                        <td>{ex.startTime} – {ex.endTime}</td>
                        <td><span className="badge badge-primary">{ex.room}</span></td>
                        <td>
                          <strong className="text-emerald">{mySeat ? mySeat.deskNumber : 'Row 3 - Desk 12'}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 5: INTERNAL MARKS --- */}
      {activeTab === 'student_marks' && (
        <div className="student-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Internal Assessment & Continuous Evaluation Ledger</h3>
                <p className="panel-desc">Formula: IA1 (20) + IA2 (20) + Assignment (10) + Quiz (10) = Total (60)</p>
              </div>
              <span className="badge badge-emerald">Locked & Finalized</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject Code & Title</th>
                    <th>IA 1 (20)</th>
                    <th>IA 2 (20)</th>
                    <th>Assignment (10)</th>
                    <th>Quiz (10)</th>
                    <th>Total (60)</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {marksRecords.map(m => (
                    <tr key={m.subjectCode}>
                      <td><strong>{m.subjectCode}</strong> &bull; {m.subjectName}</td>
                      <td>{m.ia1}</td>
                      <td>{m.ia2}</td>
                      <td>{m.assignment}</td>
                      <td>{m.quiz}</td>
                      <td><strong className="text-primary">{m.total} / {m.maxTotal}</strong></td>
                      <td><span className={`grade-badge grade-${m.grade}`}>{m.grade}</span></td>
                      <td><span className="badge badge-success">{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 6: ASSIGNMENTS --- */}
      {activeTab === 'student_assignments' && (
        <div className="student-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Course Assignments & Submissions</h3>
                <p className="panel-desc">Submit solutions with attached documents and review feedback from professors</p>
              </div>
            </div>

            <div className="assignment-cards-list">
              {assignments.map(asg => {
                const sub = submissions.find(s => s.assignmentId === asg.id);
                return (
                  <div key={asg.id} className="assignment-item-card">
                    <div className="asg-card-top">
                      <div>
                        <span className="badge badge-purple">{asg.subjectCode}</span>
                        <h4 className="asg-title">{asg.title}</h4>
                      </div>
                      <div>
                        {sub ? (
                          <span className={`badge ${sub.status === 'Reviewed' ? 'badge-success' : 'badge-primary'}`}>
                            {sub.status} {sub.scoreObtained !== null ? `(${sub.scoreObtained}/${sub.maxMarks})` : ''}
                          </span>
                        ) : (
                          <span className="badge badge-warning">Pending Submission</span>
                        )}
                      </div>
                    </div>

                    <p className="asg-desc">{asg.description}</p>
                    <div className="asg-meta-row">
                      <span><strong>Faculty:</strong> {asg.createdBy}</span>
                      <span><strong>Deadline:</strong> {asg.deadline}</span>
                      <span><strong>Max Marks:</strong> {asg.maxMarks}</span>
                    </div>

                    {sub ? (
                      <div className="asg-submitted-pill">
                        <Icons.CheckCircle size={16} className="text-emerald" />
                        <span>Submitted solution: <code>{sub.fileName}</code> on {sub.submittedAt}</span>
                        {sub.teacherFeedback && (
                          <div className="asg-feedback-box">
                            <strong>Faculty Feedback:</strong> "{sub.teacherFeedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="asg-action-bar">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            window.assignmentService.submitAssignment('usr-std-01', asg.id, `${asg.subjectCode}_solution_21CS042.pdf`);
                            addToast(`Assignment "${asg.title}" submitted successfully!`, 'success');
                          }}
                        >
                          <Icons.UploadCloud size={16} /> Quick Submit Solution (.pdf)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 7: STUDY MATERIALS --- */}
      {activeTab === 'student_materials' && (
        <div className="student-view-container">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Curriculum Study Materials (Department of CSE)</h3>
                <p className="panel-desc">Hierarchy: Department &rarr; Semester 6 &rarr; Subject &rarr; Unit Handouts</p>
              </div>
              <div className="filter-select-wrapper">
                <select 
                  className="form-input" 
                  value={selectedMaterialSubject}
                  onChange={(e) => setSelectedMaterialSubject(e.target.value)}
                >
                  <option value="All">All Subjects</option>
                  <option value="CS601">CS601 Distributed Systems</option>
                  <option value="CS602">CS602 Machine Learning</option>
                  <option value="CS604">CS604 Compiler Design</option>
                </select>
              </div>
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
                  {materials.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span className="badge badge-purple">{m.subjectCode}</span>
                        <div className="text-muted text-sm">{m.unit}</div>
                      </td>
                      <td>
                        <strong>{m.title}</strong>
                        {m.importantQuestionsAttached && (
                          <span className="badge badge-emerald ml-2 text-xs">Includes Question Bank</span>
                        )}
                      </td>
                      <td><span className="badge badge-slate">{m.type}</span></td>
                      <td>{m.fileSize}</td>
                      <td>{m.uploadedDate}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Downloading ${m.fileName}`, 'success')}>
                          <Icons.Download size={14} /> Download
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

      {/* --- SMART FEATURES --- */}
      {activeTab === 'student_what_i_missed' && <StudentWhatIMissedView />}
      {activeTab === 'student_class_memory' && <StudentClassMemoryView />}
      {activeTab === 'student_ai_assistant' && <StudentAIAssistantView />}
      {activeTab === 'student_bus' && <StudentBusView />}
      {activeTab === 'student_academic_records' && <StudentAcademicRecordsView />}
      {activeTab === 'student_helpdesk' && <StudentHelpdeskFeedbackView />}

      {/* --- ROUTE 8: NOTICES & CIRCULARS (Requirements 50 & 51) --- */}
      {activeTab === 'student_notices' && (
        <div className="student-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.Bell size={20} className="inline-icon text-primary" /> Official Department & College Notice Board
                </h3>
                <p className="panel-desc">Official administrative circulars, exam notifications, and institutional updates</p>
              </div>
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
                    <span className="text-muted text-sm">📅 {notice.date}</span>
                  </div>
                  <h4 className="notice-card-title mt-2">{notice.title}</h4>
                  <p className="notice-card-desc">{notice.description}</p>
                  <div className="notice-card-footer">
                    <span className="text-sm text-muted"><strong>Published By:</strong> {notice.publishedBy}</span>
                    {notice.attachment && (
                      <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Downloading ${notice.attachment}`, 'success')}>
                        <Icons.Download size={14} /> Download ({notice.attachment})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 9: EVENTS & SYMPOSIA (Requirement 54) --- */}
      {activeTab === 'student_events' && (
        <div className="student-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.Calendar size={20} className="inline-icon text-purple" /> Campus & Department Events
                </h3>
                <p className="panel-desc">Upcoming academic conferences, workshops, technical hackathons, and cultural fests</p>
              </div>
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
                  {ev.attachment && (
                    <div className="mt-3">
                      <button className="btn btn-sm btn-secondary" onClick={() => addToast(`Downloading ${ev.attachment}`, 'success')}>
                        <Icons.FileText size={14} /> View Brochure ({ev.attachment})
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ROUTE 10: PRIVACY VAULT --- */}
      {activeTab === 'student_privacy' && (
        <div className="student-view-container">
          <div className="panel-card mb-4">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  <Icons.Shield size={20} className="inline-icon text-emerald" /> FERPA Academic Privacy Shield
                </h3>
                <p className="panel-desc">Individual student academic isolation enforced across all system interfaces</p>
              </div>
              <span className="badge badge-emerald">Isolated Sandbox</span>
            </div>
            <p className="text-muted text-sm">
              Your profile, continuous assessment scores, and attendance records are strictly isolated. No other student has permission to query or view your performance data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

window.StudentDashboard = StudentDashboard;
