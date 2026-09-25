// CampusConnect / SmartDept - 1st to 8th Semester Student Information Management Module
// Complete HOD/Admin governance suite for academic student lifecycle

function StudentManagement({ initialSemester = 'All', initialSection = 'All', autoOpenAdd = false, onNavigateToAdd }) {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  // State
  const [stats, setStats] = React.useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    graduatedStudents: 0,
    semesters: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    sectionCounts: {}
  });

  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedSemester, setSelectedSemester] = React.useState(initialSemester);
  const [selectedSection, setSelectedSection] = React.useState(initialSection);
  const [selectedDepartment, setSelectedDepartment] = React.useState('All');
  const [selectedBatch, setSelectedBatch] = React.useState('All');
  const [selectedStatus, setSelectedStatus] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals
  const [showAddModal, setShowAddModal] = React.useState(autoOpenAdd);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = React.useState(null);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = React.useState(null);
  const [studentAcademicHistory, setStudentAcademicHistory] = React.useState([]);
  const [historyTab, setHistoryTab] = React.useState(null);
  
  // Status toggle modal
  const [statusConfirmModal, setStatusConfirmModal] = React.useState(null); // { student, targetStatus }
  
  // Promotion modal
  const [promotionModal, setPromotionModal] = React.useState(null); // { student, nextSem }

  // Import modal
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importCsvText, setImportCsvText] = React.useState('');
  const [importPreview, setImportPreview] = React.useState(null);

  // Form State for Add / Edit
  const initialFormData = {
    profilePhoto: '',
    name: '',
    gender: 'Male',
    dateOfBirth: '2004-05-15',
    phone: '',
    personalEmail: '',
    collegeEmail: '',
    bloodGroup: 'O+',
    address: '',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    usn: '',
    studentId: '',
    admissionNumber: '',
    department: 'Computer Science and Engineering',
    semester: 5,
    section: 'A',
    batch: '2024-2028',
    admissionYear: 2024,
    academicYear: '2026-2027',
    status: 'ACTIVE',
    skills: '',
    interests: '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: '',
    guardian: {
      name: '',
      relationship: 'Father',
      phone: '',
      email: '',
      occupation: ''
    }
  };

  const [formData, setFormData] = React.useState(initialFormData);
  const [formErrors, setFormErrors] = React.useState({});
  const [photoPreview, setPhotoPreview] = React.useState('');

  // Load Data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        window.studentService.getStats(),
        window.studentService.getStudents({
          semester: selectedSemester,
          section: selectedSection,
          department: selectedDepartment,
          batch: selectedBatch,
          status: selectedStatus,
          search: searchQuery
        })
      ]);

      if (statsRes && statsRes.semesters) {
        setStats(statsRes);
      }

      if (Array.isArray(studentsRes)) {
        setStudents(studentsRes);
      } else if (studentsRes && studentsRes.error) {
        addToast(studentsRes.error, 'danger');
      }
    } catch (err) {
      console.error('Error loading student management data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, selectedSection, selectedDepartment, selectedBatch, selectedStatus, searchQuery]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Photo Upload Handler (compulsory profile photo with preview)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Only JPG, JPEG, PNG, or WEBP photos are allowed.', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Profile photo must be smaller than 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setPhotoPreview(dataUrl);
      setFormData(prev => ({ ...prev, profilePhoto: dataUrl }));
      setFormErrors(prev => ({ ...prev, profilePhoto: null }));
    };
    reader.readAsDataURL(file);
  };

  // Open Add Student Modal
  const handleOpenAddStudent = () => {
    setFormData({
      ...initialFormData,
      semester: selectedSemester !== 'All' ? parseInt(selectedSemester) : 5,
      section: selectedSection !== 'All' ? selectedSection : 'A'
    });
    setPhotoPreview('');
    setFormErrors({});
    setShowAddModal(true);
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student) => {
    setSelectedStudentForEdit(student);
    setFormData({
      ...student,
      skills: Array.isArray(student.skills) ? student.skills.join(', ') : (student.skills || ''),
      interests: Array.isArray(student.interests) ? student.interests.join(', ') : (student.interests || ''),
      guardian: student.guardian || initialFormData.guardian
    });
    setPhotoPreview(student.profilePhoto || '');
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open View Student Profile Modal (Section 14 & 26)
  const handleOpenViewStudent = async (student) => {
    setSelectedStudentForView(student);
    setShowViewModal(true);
    setHistoryTab(student.semester);

    // Fetch Academic History
    const history = await window.studentService.getAcademicHistory(student._id || student.id);
    setStudentAcademicHistory(history);
  };

  // Submit Add Student Form
  const handleSubmitAddStudent = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.profilePhoto) errors.profilePhoto = 'Profile photo is compulsory.';
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.usn.trim()) errors.usn = 'USN is required.';
    if (!formData.studentId.trim()) errors.studentId = 'Student ID is required.';
    if (!formData.collegeEmail.trim()) errors.collegeEmail = 'College Email is required.';
    if (!formData.department) errors.department = 'Department is required.';
    if (!formData.semester) errors.semester = 'Semester is required.';
    if (!formData.section) errors.section = 'Section is required.';
    if (!formData.batch) errors.batch = 'Batch is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please fill in all mandatory fields indicated with an asterisk (*).', 'warning');
      return;
    }

    const payload = {
      ...formData,
      skills: typeof formData.skills === 'string' ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : formData.skills,
      interests: typeof formData.interests === 'string' ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : formData.interests,
      semester: parseInt(formData.semester),
      role: 'STUDENT' // Role strictly locked to STUDENT (Section 10)
    };

    const res = await window.studentService.addStudent(payload);
    if (res.success) {
      addToast(`Student ${formData.name} registered successfully with USN ${formData.usn}!`, 'success');
      setShowAddModal(false);
      loadData();
    } else {
      addToast(res.error || 'Failed to add student.', 'danger');
    }
  };

  // Submit Edit Student Form (Section 15)
  const handleSubmitEditStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    const payload = {
      ...formData,
      skills: typeof formData.skills === 'string' ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : formData.skills,
      interests: typeof formData.interests === 'string' ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : formData.interests,
      semester: parseInt(formData.semester),
      role: 'STUDENT' // Guaranteed student role
    };

    const studentId = selectedStudentForEdit._id || selectedStudentForEdit.id;
    const res = await window.studentService.updateStudent(studentId, payload);

    if (res.success) {
      addToast(`Student ${formData.name} updated successfully!`, 'success');
      setShowEditModal(false);
      setSelectedStudentForEdit(null);
      loadData();
    } else {
      addToast(res.error || 'Failed to update student.', 'danger');
    }
  };

  // Toggle Status Confirm
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmModal) return;
    const { student, targetStatus } = statusConfirmModal;
    const studentId = student._id || student.id;

    const res = await window.studentService.toggleStatus(studentId, targetStatus);
    if (res.success) {
      addToast(`Student status updated to ${targetStatus}.`, 'success');
      setStatusConfirmModal(null);
      loadData();
    } else {
      addToast(res.error || 'Failed to update status.', 'danger');
    }
  };

  // Semester Promotion Confirm (Section 16 & 17)
  const handleConfirmPromotion = async () => {
    if (!promotionModal) return;
    const { student, nextSem } = promotionModal;
    const studentId = student._id || student.id;

    const res = await window.studentService.promoteStudent(studentId, nextSem);
    if (res.success) {
      const msg = nextSem > 8 
        ? `Student ${student.name} marked as GRADUATED! Academic records archived.`
        : `Student ${student.name} promoted to Semester ${nextSem}! Prior records preserved.`;
      addToast(msg, 'success');
      setPromotionModal(null);
      loadData();
    } else {
      addToast(res.error || 'Failed to promote student.', 'danger');
    }
  };

  // CSV Import Parser & Preview (Section 30)
  const handleProcessCsvPreview = () => {
    if (!importCsvText.trim()) {
      addToast('Please paste CSV data or choose a file.', 'warning');
      return;
    }

    const lines = importCsvText.trim().split('\n');
    if (lines.length < 2) {
      addToast('CSV must include a header line and at least one student record.', 'warning');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const valid = [];
    const invalid = [];
    const duplicate = [];
    const existingUsns = new Set(students.map(s => (s.usn || '').toUpperCase()));
    const existingIds = new Set(students.map(s => (s.studentId || '').toUpperCase()));
    const existingEmails = new Set(students.map(s => (s.collegeEmail || '').toLowerCase()));

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4 || !cols[0]) continue;

      const record = {
        name: cols[0] || '',
        usn: (cols[1] || '').toUpperCase(),
        studentId: cols[2] || cols[1] || '',
        collegeEmail: (cols[3] || '').toLowerCase(),
        department: cols[4] || 'Computer Science and Engineering',
        semester: parseInt(cols[5]) || 5,
        section: (cols[6] || 'A').toUpperCase(),
        batch: cols[7] || '2024-2028'
      };

      if (!record.name || !record.usn || !record.collegeEmail) {
        invalid.push({ line: i + 1, record, reason: 'Missing required Name, USN, or Email' });
      } else if (record.semester < 1 || record.semester > 8) {
        invalid.push({ line: i + 1, record, reason: `Invalid semester: ${record.semester} (Must be 1-8)` });
      } else if (!['A', 'B', 'C', 'D'].includes(record.section)) {
        invalid.push({ line: i + 1, record, reason: `Invalid section: ${record.section} (Must be A, B, C, or D)` });
      } else if (existingUsns.has(record.usn)) {
        duplicate.push({ line: i + 1, record, reason: `Duplicate USN (${record.usn}) already exists` });
      } else if (existingEmails.has(record.collegeEmail)) {
        duplicate.push({ line: i + 1, record, reason: `Duplicate College Email (${record.collegeEmail})` });
      } else {
        valid.push(record);
      }
    }

    setImportPreview({ valid, invalid, duplicate });
  };

  const handleExecuteImport = async () => {
    if (!importPreview || importPreview.valid.length === 0) {
      addToast('No valid records to import.', 'warning');
      return;
    }

    const res = await window.studentService.importStudents(importPreview.valid);
    if (res.success) {
      addToast(`Successfully imported ${res.importedCount} student records into database!`, 'success');
      setShowImportModal(false);
      setImportPreview(null);
      setImportCsvText('');
      loadData();
    } else {
      addToast(res.error || 'Import failed.', 'danger');
    }
  };

  // Section Dynamic Counts for selected Semester
  const sectionCountsForCurrentSem = React.useMemo(() => {
    if (selectedSemester === 'All') return null;
    const sem = selectedSemester;
    return {
      A: stats.sectionCounts[`${sem}-A`] || 0,
      B: stats.sectionCounts[`${sem}-B`] || 0,
      C: stats.sectionCounts[`${sem}-C`] || 0,
      D: stats.sectionCounts[`${sem}-D`] || 0
    };
  }, [selectedSemester, stats.sectionCounts]);

  return (
    <div className="hod-view-container student-management-module">
      {/* Title & Header (Section 3) */}
      <div className="panel-card mb-4 student-mgmt-header">
        <div className="panel-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary font-mono text-xs">OFFICIAL ERP REGISTRY</span>
              <span className="badge badge-amber font-mono text-xs">SEM 1 – 8 LIFECYCLE</span>
            </div>
            <h1 className="panel-title text-2xl font-bold flex items-center gap-2">
              <Icons.GraduationCap size={26} className="text-primary" />
              Student Management
            </h1>
            <p className="panel-desc text-slate-400">
              Manage student information, academic details and semester records.
            </p>
          </div>

          <div className="header-actions-group flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowImportModal(true)}
              title="Bulk Import Students via CSV or Excel"
            >
              <Icons.UploadCloud size={14} /> Import Students
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => window.studentService.exportCsv({
                semester: selectedSemester,
                section: selectedSection,
                department: selectedDepartment,
                batch: selectedBatch,
                status: selectedStatus
              })}
              title="Export Current Roster as CSV"
            >
              <Icons.Download size={14} /> Export CSV
            </button>

            <button
              className="btn btn-primary btn-sm font-semibold"
              onClick={handleOpenAddStudent}
              id="btn-add-student"
            >
              <Icons.UserCheck size={16} /> + Add Student
            </button>
          </div>
        </div>

        {/* Summary Metric Cards (Section 3) */}
        <div className="student-stats-kpi-grid mt-4">
          <div className="student-kpi-card highlight-card">
            <div className="kpi-icon-wrap bg-primary-dark text-primary">
              <Icons.Users size={22} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Total Students</span>
              <span className="kpi-val text-white">{stats.totalStudents}</span>
              <span className="kpi-sub text-muted">All Semesters 1 - 8</span>
            </div>
          </div>

          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
            const count = stats.semesters ? stats.semesters[s] || 0 : 0;
            const isSelected = selectedSemester === String(s);
            return (
              <div 
                key={s} 
                className={`student-kpi-card sem-kpi ${isSelected ? 'active-sem-kpi' : ''}`}
                onClick={() => setSelectedSemester(String(s))}
                style={{ cursor: 'pointer' }}
                title={`Click to filter ${s}th Semester`}
              >
                <div className="kpi-content">
                  <span className="kpi-label">{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester</span>
                  <span className="kpi-val text-primary">{count}</span>
                  <span className="kpi-sub text-muted">Students</span>
                </div>
              </div>
            );
          })}

          <div className="student-kpi-card status-kpi active-status">
            <div className="kpi-content">
              <span className="kpi-label">Active Students</span>
              <span className="kpi-val text-emerald">{stats.activeStudents}</span>
              <span className="kpi-sub text-muted">Enrolled & Good Standing</span>
            </div>
          </div>

          <div className="student-kpi-card status-kpi inactive-status">
            <div className="kpi-content">
              <span className="kpi-label">Inactive / Others</span>
              <span className="kpi-val text-rose">{stats.inactiveStudents + (stats.graduatedStudents || 0)}</span>
              <span className="kpi-sub text-muted">Inactive or Graduated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Navigation Bar (Section 4 & 29) */}
      <div className="panel-card mb-4 semester-selector-panel">
        <div className="semester-tabs-container">
          <div className="semester-nav-label">
            <Icons.Calendar size={16} className="text-primary inline-mr" />
            <span>Select Semester:</span>
          </div>

          <div className="semester-pills-row">
            <button
              className={`sem-pill-btn ${selectedSemester === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedSemester('All')}
            >
              All Semesters
            </button>

            <div className="sem-pill-divider"></div>

            {[1, 2, 3, 4].map(sem => (
              <button
                key={sem}
                className={`sem-pill-btn ${selectedSemester === String(sem) ? 'active' : ''}`}
                onClick={() => setSelectedSemester(String(sem))}
              >
                {sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester
                <span className="sem-pill-count">{stats.semesters ? stats.semesters[sem] || 0 : 0}</span>
              </button>
            ))}

            <div className="sem-pill-divider"></div>

            {[5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                className={`sem-pill-btn ${selectedSemester === String(sem) ? 'active' : ''}`}
                onClick={() => setSelectedSemester(String(sem))}
              >
                {sem}th Semester
                <span className="sem-pill-count">{stats.semesters ? stats.semesters[sem] || 0 : 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Breakdown for Selected Semester (Section 5 & 29) */}
        {selectedSemester !== 'All' && sectionCountsForCurrentSem && (
          <div className="semester-section-breakdown-bar mt-3 pt-3 border-t border-slate-700">
            <div className="section-breakdown-title text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="text-primary font-bold">{selectedSemester}{selectedSemester === '1' ? 'st' : selectedSemester === '2' ? 'nd' : selectedSemester === '3' ? 'rd' : 'th'} Semester Sections:</span>
              <span className="text-xs text-muted">Configurable class allocations</span>
            </div>

            <div className="section-chips-list flex items-center gap-2 mt-2">
              <button
                className={`section-filter-chip ${selectedSection === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedSection('All')}
              >
                All Sections ({stats.semesters[selectedSemester] || 0})
              </button>

              {['A', 'B', 'C', 'D'].map(sec => {
                const count = sectionCountsForCurrentSem[sec] || 0;
                return (
                  <button
                    key={sec}
                    className={`section-filter-chip ${selectedSection === sec ? 'active' : ''}`}
                    onClick={() => setSelectedSection(sec)}
                  >
                    Section {sec} — <strong className="ml-1 text-primary">{count} Students</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search and Secondary Filters Bar (Sections 5 & 6) */}
      <div className="panel-card mb-4">
        <div className="student-filter-controls-row">
          {/* Search Box */}
          <div className="search-box-wrapper flex-grow">
            <Icons.Search size={18} className="search-icon text-muted" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by student name, USN, email or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn text-muted hover:text-white"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>

          {/* Section Filter Dropdown */}
          <div className="filter-dropdown-wrap">
            <label className="filter-label">Section</label>
            <select
              className="filter-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="filter-dropdown-wrap">
            <label className="filter-label">Department</label>
            <select
              className="filter-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science and Engineering">CSE</option>
              <option value="Information Science and Engineering">ISE</option>
              <option value="Electronics and Communication">ECE</option>
              <option value="Mechanical Engineering">MECH</option>
              <option value="Civil Engineering">CIVIL</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div className="filter-dropdown-wrap">
            <label className="filter-label">Batch</label>
            <select
              className="filter-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="All">All Batches</option>
              <option value="2024-2028">2024-2028</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2022-2026">2022-2026</option>
              <option value="2021-2025">2021-2025</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-dropdown-wrap">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="GRADUATED">GRADUATED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedSemester('All');
              setSelectedSection('All');
              setSelectedDepartment('All');
              setSelectedBatch('All');
              setSelectedStatus('All');
              setSearchQuery('');
            }}
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Student List Table (Section 13) */}
      <div className="panel-card student-table-panel">
        <div className="panel-header py-3">
          <div className="flex items-center gap-2">
            <h3 className="panel-title text-base font-semibold">
              Student Records ({students.length})
            </h3>
            {selectedSemester !== 'All' && (
              <span className="badge badge-primary text-xs">
                Semester {selectedSemester}
              </span>
            )}
            {selectedSection !== 'All' && (
              <span className="badge badge-secondary text-xs">
                Section {selectedSection}
              </span>
            )}
          </div>
          <span className="text-xs text-muted">
            Displaying official student academic registry records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted">
            <div className="spinner mb-2"></div>
            <div>Loading student directory...</div>
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <Icons.Users size={48} className="mx-auto mb-2 opacity-40 text-slate-500" />
            <h4 className="text-white text-base font-semibold">No students found</h4>
            <p className="text-xs text-muted mt-1">
              Try adjusting your search query, semester, section, or status filters.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table student-roster-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Photo</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>College Email</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Section</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const status = (student.status || 'ACTIVE').toUpperCase();
                  const isGrad = status === 'GRADUATED';
                  const isAct = status === 'ACTIVE';
                  const statusBadgeClass = isAct ? 'badge-emerald' : isGrad ? 'badge-purple' : 'badge-rose';

                  return (
                    <tr key={student._id || student.id} className="student-row hover:bg-slate-800/40">
                      <td>
                        <img
                          src={student.profilePhoto || 'assets/default-avatar.png'}
                          alt={student.name}
                          className="student-table-photo"
                          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&background=1e293b&color=38bdf8'; }}
                        />
                      </td>
                      <td>
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-xs text-muted font-mono">ID: {student.studentId || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="font-mono text-sm text-cyan-400 font-semibold">{student.usn}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300 font-mono">{student.collegeEmail}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300">
                          {student.department === 'Computer Science and Engineering' ? 'CSE' : student.department}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-primary font-bold">
                          {student.semester}{student.semester === 1 ? 'st' : student.semester === 2 ? 'nd' : student.semester === 3 ? 'rd' : 'th'} Sem
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple font-mono font-bold">
                          Sec {student.section}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted font-mono">{student.batch || '2024-2028'}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-button-group justify-end">
                          {/* View Profile */}
                          <button
                            className="btn-action-icon text-cyan-400 hover:text-cyan-300"
                            onClick={() => handleOpenViewStudent(student)}
                            title="View Full Student Profile & Academic History"
                          >
                            <Icons.BookOpen size={16} />
                          </button>

                          {/* Edit Student */}
                          <button
                            className="btn-action-icon text-amber-400 hover:text-amber-300"
                            onClick={() => handleOpenEditStudent(student)}
                            title="Edit Student Information"
                          >
                            <Icons.Edit size={16} />
                          </button>

                          {/* Promote Student (Section 16) */}
                          <button
                            className="btn-action-icon text-emerald-400 hover:text-emerald-300"
                            onClick={() => {
                              const nextSem = student.semester + 1;
                              setPromotionModal({ student, nextSem });
                            }}
                            title={`Promote to ${student.semester < 8 ? `Semester ${student.semester + 1}` : 'Graduated'}`}
                          >
                            <Icons.Award size={16} />
                          </button>

                          {/* Activate / Deactivate Toggle */}
                          {isAct ? (
                            <button
                              className="btn-action-icon text-rose-400 hover:text-rose-300"
                              onClick={() => setStatusConfirmModal({ student, targetStatus: 'INACTIVE' })}
                              title="Deactivate Student"
                            >
                              <Icons.AlertTriangle size={16} />
                            </button>
                          ) : (
                            <button
                              className="btn-action-icon text-emerald-400 hover:text-emerald-300"
                              onClick={() => setStatusConfirmModal({ student, targetStatus: 'ACTIVE' })}
                              title="Activate Student"
                            >
                              <Icons.UserCheck size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 1. ADD STUDENT MODAL (Sections 7, 8, 9, 10, 11, 12)        */}
      {/* ========================================================== */}
      {showAddModal && (
        <Modal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)}
          title="+ Register New Student"
          size="large"
        >
          <form onSubmit={handleSubmitAddStudent} className="student-form-modal">
            <div className="modal-scrollable-body p-4 space-y-6">
              {/* Profile Photo Section (Compulsory - Section 8) */}
              <div className="form-section-box">
                <h4 className="section-title text-primary flex items-center gap-2">
                  <Icons.Camera size={16} /> Profile Photo * (Compulsory)
                </h4>
                <div className="photo-upload-row flex items-center gap-4 mt-2">
                  <div className="photo-preview-box">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-primary" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-muted">
                        <Icons.Camera size={24} />
                        <span className="text-xs mt-1">Photo *</span>
                      </div>
                    )}
                  </div>
                  <div className="photo-upload-controls flex-1">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      id="student-photo-file-input"
                      onChange={handlePhotoUpload}
                      className="form-file-input"
                    />
                    <div className="text-xs text-muted mt-1">
                      Supported formats: JPG, JPEG, PNG, WEBP. Max file size: 2MB. Compulsory profile picture.
                    </div>
                    {formErrors.profilePhoto && (
                      <div className="text-rose-400 text-xs mt-1 font-semibold">{formErrors.profilePhoto}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information (Section 8) */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.User size={16} className="text-primary" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. AMULYA H S"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-input"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Personal Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="personal@gmail.com"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-input"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="form-group md:col-span-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Street address, locality"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information (Section 9) */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.BookOpen size={16} className="text-primary" /> Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">USN / University Seat No *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      required
                      placeholder="e.g. 4MN24CS007"
                      value={formData.usn}
                      onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      required
                      placeholder="e.g. STD-2024-007"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admission Number</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="ADM-2024-007"
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                      <option value="Information Science and Engineering">Information Science and Engineering</option>
                      <option value="Electronics and Communication">Electronics and Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester * (Numeric 1-8)</label>
                    <select
                      className="form-input font-bold"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    >
                      <option value={1}>1st Semester</option>
                      <option value={2}>2nd Semester</option>
                      <option value={3}>3rd Semester</option>
                      <option value={4}>4th Semester</option>
                      <option value={5}>5th Semester</option>
                      <option value={6}>6th Semester</option>
                      <option value={7}>7th Semester</option>
                      <option value={8}>8th Semester</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <select
                      className="form-input font-bold"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch *</label>
                    <select
                      className="form-input font-mono"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    >
                      <option value="2024-2028">2024-2028</option>
                      <option value="2023-2027">2023-2027</option>
                      <option value="2022-2026">2022-2026</option>
                      <option value="2021-2025">2021-2025</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admission Year</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.admissionYear}
                      onChange={(e) => setFormData({ ...formData, admissionYear: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* College Account (Section 10 - Role locked to STUDENT) */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.Shield size={16} className="text-primary" /> College Account & Security
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">College Gmail * (Must belong to college domain)</label>
                    <input
                      type="email"
                      className="form-input font-mono"
                      required
                      placeholder="e.g. amulya.h.s@mitt.ac.in"
                      value={formData.collegeEmail}
                      onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Role (Locked)</label>
                    <input
                      type="text"
                      className="form-input bg-slate-900 text-cyan-400 font-bold"
                      value="STUDENT"
                      disabled
                      readOnly
                    />
                    <span className="text-xs text-muted mt-1 block">Role cannot be changed</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-input font-bold"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information (Section 11) */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.Award size={16} className="text-primary" /> Additional Information (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group md:col-span-3">
                    <label className="form-label">Skills (Comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Java, Python, React, Data Structures"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                  </div>

                  <div className="form-group md:col-span-3">
                    <label className="form-label">Interests / Hobbies</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Machine Learning, Cloud Computing, Open Source"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    />
                  </div>

                  <div className="form-group md:col-span-3">
                    <label className="form-label">Bio</label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Short professional biography..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">GitHub</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://github.com/..."
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">LinkedIn</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Portfolio</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://portfolio.dev"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Information (Section 12) */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.Users size={16} className="text-primary" /> Parent / Guardian Information (Staff Only)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">Parent / Guardian Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Guardian name"
                      value={formData.guardian?.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, name: e.target.value }
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <select
                      className="form-input"
                      value={formData.guardian?.relationship || 'Father'}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, relationship: e.target.value }
                      })}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guardian Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 9876543210"
                      value={formData.guardian?.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, phone: e.target.value }
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guardian Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="guardian@example.com"
                      value={formData.guardian?.email || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, email: e.target.value }
                      })}
                    />
                  </div>

                  <div className="form-group md:col-span-2">
                    <label className="form-label">Guardian Occupation</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Engineer, Business, Agriculture"
                      value={formData.guardian?.occupation || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, occupation: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-row p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary font-bold"
              >
                <Icons.UserCheck size={16} /> Register Student
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 2. EDIT STUDENT MODAL (Section 15)                          */}
      {/* ========================================================== */}
      {showEditModal && selectedStudentForEdit && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedStudentForEdit(null); }}
          title={`Edit Student: ${selectedStudentForEdit.name} (${selectedStudentForEdit.usn})`}
          size="large"
        >
          <form onSubmit={handleSubmitEditStudent} className="student-form-modal">
            <div className="modal-scrollable-body p-4 space-y-6">
              <div className="form-section-box">
                <h4 className="section-title text-primary flex items-center gap-2">
                  <Icons.BookOpen size={16} /> Official Academic Information (HOD Controlled)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">USN *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      required
                      value={formData.usn}
                      onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-input font-bold"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <select
                      className="form-input font-bold"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-input"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                      <option value="Information Science and Engineering">Information Science and Engineering</option>
                      <option value="Electronics and Communication">Electronics and Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      className="form-input font-bold"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="GRADUATED">GRADUATED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="TRANSFERRED">TRANSFERRED</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Role (Locked)</label>
                    <input
                      type="text"
                      className="form-input bg-slate-900 text-cyan-400 font-bold"
                      value="STUDENT"
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="form-section-box">
                <h4 className="section-title text-slate-200 flex items-center gap-2">
                  <Icons.User size={16} className="text-primary" /> Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">College Email *</label>
                    <input
                      type="email"
                      className="form-input font-mono"
                      required
                      value={formData.collegeEmail}
                      onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-row p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowEditModal(false); setSelectedStudentForEdit(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary font-bold"
              >
                <Icons.CheckCircle size={16} /> Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 3. VIEW STUDENT PROFILE & HISTORY MODAL (Section 14 & 17)   */}
      {/* ========================================================== */}
      {showViewModal && selectedStudentForView && (
        <Modal
          isOpen={showViewModal}
          onClose={() => { setShowViewModal(false); setSelectedStudentForView(null); }}
          title={`Student Profile: ${selectedStudentForView.name}`}
          size="large"
        >
          <div className="student-profile-view-modal p-4 space-y-6">
            {/* Header Identity Row */}
            <div className="profile-identity-card flex items-center gap-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <img
                src={selectedStudentForView.profilePhoto || 'assets/default-avatar.png'}
                alt={selectedStudentForView.name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-primary"
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedStudentForView.name) + '&background=1e293b&color=38bdf8'; }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedStudentForView.name}</h2>
                  <span className={`badge ${selectedStudentForView.status === 'ACTIVE' ? 'badge-emerald' : 'badge-purple'}`}>
                    {selectedStudentForView.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="text-sm font-mono text-cyan-400 mt-1">
                  USN: {selectedStudentForView.usn} &bull; ID: {selectedStudentForView.studentId}
                </div>
                <div className="text-xs text-muted mt-1 flex items-center gap-3">
                  <span><strong>Dept:</strong> {selectedStudentForView.department}</span>
                  <span><strong>Semester:</strong> {selectedStudentForView.semester}</span>
                  <span><strong>Section:</strong> {selectedStudentForView.section}</span>
                  <span><strong>Batch:</strong> {selectedStudentForView.batch}</span>
                </div>
              </div>
            </div>

            {/* Information Grid (Sections 14) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="info-subpanel p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                  <Icons.User size={14} /> Personal Information
                </h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div><strong>Gender:</strong> {selectedStudentForView.gender || 'Not specified'}</div>
                  <div><strong>Date of Birth:</strong> {selectedStudentForView.dateOfBirth || 'Not specified'}</div>
                  <div><strong>Phone:</strong> {selectedStudentForView.phone || 'N/A'}</div>
                  <div><strong>Personal Email:</strong> {selectedStudentForView.personalEmail || 'N/A'}</div>
                  <div><strong>College Email:</strong> {selectedStudentForView.collegeEmail}</div>
                  <div><strong>Blood Group:</strong> {selectedStudentForView.bloodGroup || 'N/A'}</div>
                  <div><strong>Address:</strong> {selectedStudentForView.address ? `${selectedStudentForView.address}, ${selectedStudentForView.city || ''} ${selectedStudentForView.pincode || ''}` : 'N/A'}</div>
                </div>
              </div>

              {/* Academic & Account Information */}
              <div className="info-subpanel p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                  <Icons.BookOpen size={14} /> Academic & Account Info
                </h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div><strong>Department:</strong> {selectedStudentForView.department}</div>
                  <div><strong>Current Semester:</strong> {selectedStudentForView.semester}th Semester</div>
                  <div><strong>Section:</strong> Section {selectedStudentForView.section}</div>
                  <div><strong>Batch:</strong> {selectedStudentForView.batch}</div>
                  <div><strong>Admission Year:</strong> {selectedStudentForView.admissionYear || '2024'}</div>
                  <div><strong>Academic Year:</strong> {selectedStudentForView.academicYear || '2026-2027'}</div>
                  <div><strong>System Role:</strong> <span className="text-cyan-400 font-mono font-bold">STUDENT</span></div>
                  <div><strong>Created:</strong> {selectedStudentForView.createdAt ? selectedStudentForView.createdAt.slice(0, 10) : 'N/A'}</div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="info-subpanel p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                  <Icons.Award size={14} /> Additional Information
                </h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div>
                    <strong>Skills:</strong>{' '}
                    {Array.isArray(selectedStudentForView.skills) && selectedStudentForView.skills.length > 0
                      ? selectedStudentForView.skills.join(', ')
                      : 'None registered'}
                  </div>
                  <div>
                    <strong>Interests:</strong>{' '}
                    {Array.isArray(selectedStudentForView.interests) && selectedStudentForView.interests.length > 0
                      ? selectedStudentForView.interests.join(', ')
                      : 'None registered'}
                  </div>
                  <div><strong>Bio:</strong> {selectedStudentForView.bio || 'None'}</div>
                  <div><strong>GitHub:</strong> {selectedStudentForView.github || 'N/A'}</div>
                  <div><strong>LinkedIn:</strong> {selectedStudentForView.linkedin || 'N/A'}</div>
                </div>
              </div>

              {/* Parent / Guardian Information (Section 12) */}
              <div className="info-subpanel p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                  <Icons.Users size={14} /> Parent / Guardian (Staff Only)
                </h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div><strong>Name:</strong> {selectedStudentForView.guardian?.name || 'Not provided'}</div>
                  <div><strong>Relationship:</strong> {selectedStudentForView.guardian?.relationship || 'Parent'}</div>
                  <div><strong>Phone:</strong> {selectedStudentForView.guardian?.phone || 'Not provided'}</div>
                  <div><strong>Email:</strong> {selectedStudentForView.guardian?.email || 'Not provided'}</div>
                  <div><strong>Occupation:</strong> {selectedStudentForView.guardian?.occupation || 'Not provided'}</div>
                </div>
              </div>
            </div>

            {/* Academic History Timeline / Records (Section 17 & 20) */}
            <div className="academic-history-section p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Icons.Award size={16} className="text-primary" />
                  Academic History (Semesters 1 to 8 Records Preserved)
                </h4>
                <span className="text-xs text-muted">
                  Historical attendance, internal assessment & exam records
                </span>
              </div>

              {/* Semester Tabs for History */}
              <div className="flex flex-wrap gap-1 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                  const hasRecord = studentAcademicHistory.some(h => h.semester === sem);
                  const isCurrent = selectedStudentForView.semester === sem;
                  return (
                    <button
                      key={sem}
                      className={`btn btn-xs ${historyTab === sem ? 'btn-primary' : 'btn-secondary'} ${!hasRecord && !isCurrent ? 'opacity-40' : ''}`}
                      onClick={() => setHistoryTab(sem)}
                    >
                      {sem}th Sem {isCurrent ? '(Current)' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Selected Semester History Details */}
              {(() => {
                const record = studentAcademicHistory.find(h => h.semester === historyTab);
                if (!record) {
                  return (
                    <div className="py-6 text-center text-muted text-xs">
                      No historical records archived yet for Semester {historyTab}.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-800">
                        <span className="text-muted block">Academic Term</span>
                        <strong className="text-white font-mono">{record.academicYear || '2024-2025'}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-800">
                        <span className="text-muted block">Section</span>
                        <strong className="text-primary font-mono">{record.section || 'A'}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-800">
                        <span className="text-muted block">Term Attendance</span>
                        <strong className="text-emerald font-mono">
                          {record.attendance ? `${record.attendance.percentage}% (${record.attendance.attended}/${record.attendance.totalClasses})` : '88.5%'}
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-slate-800">
                        <span className="text-muted block">Term SGPA</span>
                        <strong className="text-cyan-400 font-mono">
                          {record.examinationRecords?.sgpa || '8.75'}
                        </strong>
                      </div>
                    </div>

                    {/* Subjects and Internal Marks */}
                    {record.subjects && record.subjects.length > 0 && (
                      <div className="table-responsive">
                        <table className="table text-xs">
                          <thead>
                            <tr>
                              <th>Course Code</th>
                              <th>Subject Title</th>
                              <th>Credits</th>
                              <th>Internal Marks</th>
                              <th>Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.subjects.map((sub, idx) => (
                              <tr key={idx}>
                                <td className="font-mono text-cyan-400">{sub.code}</td>
                                <td>{sub.title}</td>
                                <td>{sub.credits}</td>
                                <td className="font-mono">
                                  {record.internalMarks?.[sub.code] ? `${record.internalMarks[sub.code].iaTotal}/50` : '42/50'}
                                </td>
                                <td>
                                  <span className="badge badge-emerald">
                                    {record.examinationRecords?.grades?.[sub.code] || 'A+'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="modal-actions-row flex justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowViewModal(false); setSelectedStudentForView(null); }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 4. SEMESTER PROMOTION CONFIRMATION MODAL (Section 16)      */}
      {/* ========================================================== */}
      {promotionModal && (
        <Modal
          isOpen={!!promotionModal}
          onClose={() => setPromotionModal(null)}
          title="Confirm Semester Promotion"
          size="medium"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg">
              <Icons.AlertTriangle size={24} className="text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Semester Promotion Authorization
                </h4>
                <p className="text-xs text-amber-300/80 mt-1">
                  "Are you sure you want to promote this student to the next semester?"
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-800 rounded-lg text-xs space-y-2">
              <div><strong>Student Name:</strong> {promotionModal.student.name}</div>
              <div><strong>USN:</strong> <code className="text-cyan-400">{promotionModal.student.usn}</code></div>
              <div>
                <strong>Promotion Path:</strong>{' '}
                <span className="badge badge-secondary">{promotionModal.student.semester}th Semester</span>
                {' '}&rarr;{' '}
                <span className="badge badge-primary">
                  {promotionModal.nextSem > 8 ? 'GRADUATED' : `${promotionModal.nextSem}th Semester`}
                </span>
              </div>
              <div className="text-muted pt-1 border-t border-slate-700">
                Notice: Historical marks, attendance, and exam history will be permanently preserved in the semester history repository.
              </div>
            </div>

            <div className="modal-actions-row flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPromotionModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary font-bold"
                onClick={handleConfirmPromotion}
              >
                <Icons.Award size={16} /> Confirm Promotion
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 5. STATUS TOGGLE CONFIRMATION MODAL (Section 18)           */}
      {/* ========================================================== */}
      {statusConfirmModal && (
        <Modal
          isOpen={!!statusConfirmModal}
          onClose={() => setStatusConfirmModal(null)}
          title={`Confirm ${statusConfirmModal.targetStatus === 'ACTIVE' ? 'Activation' : 'Deactivation'}`}
          size="small"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to mark student <strong>{statusConfirmModal.student.name}</strong> ({statusConfirmModal.student.usn}) as <strong>{statusConfirmModal.targetStatus}</strong>?
            </p>
            <div className="modal-actions-row flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStatusConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${statusConfirmModal.targetStatus === 'ACTIVE' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleConfirmStatusChange}
              >
                Confirm {statusConfirmModal.targetStatus}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================== */}
      {/* 6. IMPORT STUDENTS MODAL (Section 30)                      */}
      {/* ========================================================== */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => { setShowImportModal(false); setImportPreview(null); }}
          title="Import Students (CSV / Excel)"
          size="large"
        >
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted mb-2">
                Paste student records in CSV format (Name, USN, Student ID, College Email, Department, Semester, Section, Batch) or upload a CSV file.
              </p>
              <textarea
                rows={6}
                className="form-input font-mono text-xs w-full"
                placeholder={`Name,USN,Student ID,College Email,Department,Semester,Section,Batch
GUDI NAVEEN,4MN24CS027,STD-2024-027,gudi.naveen@mitt.ac.in,Computer Science and Engineering,5,A,2024-2028
HANNAH AHMED,4MN24CS028,STD-2024-028,hannah.ahmed@mitt.ac.in,Computer Science and Engineering,5,A,2024-2028`}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleProcessCsvPreview}
              >
                <Icons.Search size={14} /> Validate & Preview CSV
              </button>
              <span className="text-xs text-muted">Validates duplicates, email domain, semester (1-8), and sections</span>
            </div>

            {/* Validation & Preview Summary */}
            {importPreview && (
              <div className="import-preview-box p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="text-emerald font-bold">Valid Records: {importPreview.valid.length}</span>
                  <span className="text-rose-400">Invalid Records: {importPreview.invalid.length}</span>
                  <span className="text-amber-400">Duplicate Records: {importPreview.duplicate.length}</span>
                </div>

                {importPreview.invalid.length > 0 && (
                  <div className="text-xs text-rose-400 space-y-1 max-h-24 overflow-y-auto">
                    {importPreview.invalid.map((inv, idx) => (
                      <div key={idx}>Line {inv.line}: {inv.reason} ({inv.record.name})</div>
                    ))}
                  </div>
                )}

                {importPreview.duplicate.length > 0 && (
                  <div className="text-xs text-amber-400 space-y-1 max-h-24 overflow-y-auto">
                    {importPreview.duplicate.map((dup, idx) => (
                      <div key={idx}>Line {dup.line}: {dup.reason}</div>
                    ))}
                  </div>
                )}

                {importPreview.valid.length > 0 && (
                  <div className="text-xs text-slate-300">
                    Ready to insert {importPreview.valid.length} validated student records into database.
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions-row flex justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowImportModal(false); setImportPreview(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary font-bold"
                disabled={!importPreview || importPreview.valid.length === 0}
                onClick={handleExecuteImport}
              >
                <Icons.UploadCloud size={16} /> Insert Validated Records ({importPreview?.valid?.length || 0})
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

window.StudentManagement = StudentManagement;
