// CampusConnect / SmartDept - Add New Teacher Form
// Secure HOD/Admin Component to Register New Department Faculty

function AddTeacherForm({ onCancel, onSuccess }) {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  // Form State
  const [formData, setFormData] = React.useState({
    // Personal Information
    profilePhoto: '',
    name: '',
    phone: '',
    email: '',

    // Professional Information
    facultyId: '',
    designation: 'Assistant Professor',
    department: 'Computer Science and Engineering',
    qualification: 'M.Tech, Ph.D',
    specialization: 'Artificial Intelligence & Machine Learning',
    experience: '5 Years',
    officeRoom: 'Turing Block 204',
    joiningDate: new Date().toISOString().split('T')[0],

    // Academic Assignment
    subjectsHandled: 'CS501 (Software Engineering), CS504 (DBMS)',
    assignedSemester: '5th Semester',
    assignedSection: 'Section A',
    assignedClasses: '5th Sem CSE A',

    // Account Information
    role: 'TEACHER', // Strictly locked to TEACHER
    accountStatus: 'ACTIVE'
  });

  const [photoPreview, setPhotoPreview] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState({});

  // Sample curated avatar options for quick selection in demo
  const sampleAvatars = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Strictly prevent modifying role
    if (name === 'role') return;

    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle Photo File Upload (Compulsory: JPG, JPEG, PNG, WEBP)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpg|jpeg|png|webp)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setFormErrors(prev => ({
        ...prev,
        profilePhoto: 'Only JPG, JPEG, PNG, and WEBP image formats are supported.'
      }));
      addToast('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size exceeds 5MB limit. Please choose a smaller photo.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      setPhotoPreview(dataUri);
      setFormData(prev => ({ ...prev, profilePhoto: dataUri }));
      setFormErrors(prev => ({ ...prev, profilePhoto: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleAvatar = (url) => {
    setPhotoPreview(url);
    setFormData(prev => ({ ...prev, profilePhoto: url }));
    setFormErrors(prev => ({ ...prev, profilePhoto: null }));
  };

  const handleClearPhoto = () => {
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, profilePhoto: '' }));
  };

  // Submit Handler with Client & Backend Verification
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    // 1. Profile photo compulsory validation
    if (!formData.profilePhoto || !formData.profilePhoto.trim()) {
      errors.profilePhoto = 'Teacher profile photo is required.';
    }

    // 2. Personal info validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    }

    // 3. Email validation
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      errors.email = 'College email address is required.';
    } else if (!email.includes('@')) {
      errors.email = 'Please enter a valid college Gmail/college email address.';
    }

    // 4. Faculty ID validation
    const facultyId = formData.facultyId.trim().toUpperCase();
    if (!facultyId) {
      errors.facultyId = 'Faculty ID is required (e.g. FAC001).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.profilePhoto) {
        addToast('Teacher profile photo is required.', 'danger');
      } else {
        addToast('Please complete all required fields.', 'warning');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionPayload = {
        ...formData,
        email: email,
        facultyId: facultyId,
        role: 'TEACHER', // Strictly forced to TEACHER
        createdBy: user?.id || 'usr-hod-01'
      };

      const result = await window.teacherService.addTeacher(submissionPayload);

      if (result.success) {
        addToast('Teacher added successfully.', 'success');
        if (onSuccess) {
          onSuccess(result.teacher);
        } else {
          // Trigger navigation to /admin/teachers
          window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_teachers' }));
        }
      } else {
        addToast(result.error || 'Failed to add teacher.', 'danger');
        if (result.error.includes('Faculty ID already exists')) {
          setFormErrors(prev => ({ ...prev, facultyId: 'Faculty ID already exists.' }));
        } else if (result.error.includes('college Gmail') || result.error.includes('college email')) {
          setFormErrors(prev => ({ ...prev, email: result.error }));
        } else if (result.error.includes('photo')) {
          setFormErrors(prev => ({ ...prev, profilePhoto: result.error }));
        }
      }
    } catch (err) {
      console.error('Error submitting teacher form:', err);
      addToast('An unexpected error occurred while adding the teacher.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-teacher-container">
      {/* Header Breadcrumb & Title */}
      <div className="add-teacher-header">
        <div className="add-teacher-breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => {
              if (onCancel) onCancel();
              else window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_teachers' }));
            }}
          >
            Faculty Management
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Add New Teacher</span>
        </div>
        <div className="add-teacher-title-row">
          <div>
            <h2 className="add-teacher-title">Add New Teacher</h2>
            <p className="add-teacher-subtitle">
              Create a new teacher account and assign department information.
            </p>
          </div>
          <div className="badge-hod-auth">
            <Icons.Shield size={16} />
            <span>HOD Authorized Access</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-teacher-form">
        {/* ======================================================== */}
        {/* SECTION 1: PERSONAL INFORMATION */}
        {/* ======================================================== */}
        <div className="form-card-section">
          <div className="section-header">
            <div className="section-number">1</div>
            <div>
              <h3 className="section-title">Personal Information</h3>
              <p className="section-desc">Teacher identity, profile photograph, and contact credentials</p>
            </div>
          </div>

          <div className="photo-upload-container">
            <label className="field-label required">
              Profile Photo <span className="label-required">*</span>
              <span className="label-hint">(Compulsory &bull; JPG, JPEG, PNG, WEBP &bull; Max 5MB)</span>
            </label>

            <div className="photo-upload-row">
              <div className="photo-preview-box">
                {photoPreview ? (
                  <div className="photo-preview-wrapper">
                    <img src={photoPreview} alt="Teacher preview" className="preview-image" />
                    <button 
                      type="button" 
                      onClick={handleClearPhoto} 
                      className="photo-clear-btn"
                      title="Remove Photo"
                    >
                      <Icons.X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="photo-placeholder-box">
                    <Icons.Camera size={32} className="text-muted" />
                    <span className="placeholder-text">No Photo Uploaded</span>
                  </div>
                )}
              </div>

              <div className="photo-actions-box">
                <div className="photo-drop-zone">
                  <input
                    type="file"
                    id="teacher-photo-file-input"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="file-input-hidden"
                  />
                  <label htmlFor="teacher-photo-file-input" className="btn btn-secondary btn-sm">
                    <Icons.UploadCloud size={16} /> Choose Photo from Device
                  </label>
                  <span className="upload-note">Drag & drop or click to upload profile photo</span>
                </div>

                <div className="sample-avatars-row">
                  <span className="sample-label">Or select high-res faculty portrait:</span>
                  <div className="sample-avatar-chips">
                    {sampleAvatars.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`sample-avatar-chip ${photoPreview === s.url ? 'selected' : ''}`}
                        onClick={() => handleSelectSampleAvatar(s.url)}
                      >
                        <img src={s.url} alt={s.label} />
                      </button>
                    ))}
                  </div>
                </div>

                {formErrors.profilePhoto && (
                  <div className="field-error-msg">
                    <Icons.AlertTriangle size={14} /> {formErrors.profilePhoto}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="field-label required">
                Full Name <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Dr. Raghavan Iyer"
                className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                required
              />
              {formErrors.name && (
                <span className="field-error-msg">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label className="field-label required">
                Phone Number <span className="label-required">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 98450 12345"
                className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                required
              />
              {formErrors.phone && (
                <span className="field-error-msg">{formErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label className="field-label required">
                College Gmail / Institutional Email <span className="label-required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="faculty@yourcollege.edu.in"
                className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                required
              />
              <span className="field-help-text">Must match college email domain configuration</span>
              {formErrors.email && (
                <span className="field-error-msg">{formErrors.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: PROFESSIONAL INFORMATION */}
        {/* ======================================================== */}
        <div className="form-card-section">
          <div className="section-header">
            <div className="section-number">2</div>
            <div>
              <h3 className="section-title">Professional Information</h3>
              <p className="section-desc">Institutional credentials, academic ranks, and department affiliation</p>
            </div>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="field-label required">
                Faculty ID <span className="label-required">*</span>
              </label>
              <input
                type="text"
                name="facultyId"
                value={formData.facultyId}
                onChange={handleInputChange}
                placeholder="e.g. FAC005"
                className={`form-input ${formErrors.facultyId ? 'input-error' : ''}`}
                required
              />
              <span className="field-help-text">Unique departmental faculty identification</span>
              {formErrors.facultyId && (
                <span className="field-error-msg">{formErrors.facultyId}</span>
              )}
            </div>

            <div className="form-group">
              <label className="field-label required">Designation</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
                <option value="Adjunct Professor">Adjunct Professor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label required">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication (ECE)</option>
                <option value="Information Technology">Information Technology (IT)</option>
                <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                <option value="Electrical & Electronics Engineering">Electrical & Electronics (EEE)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                placeholder="e.g. B.E, M.Tech, Ph.D"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-4 mt-3">
            <div className="form-group">
              <label className="field-label">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g. Cloud Architecture & AI"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="field-label">Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="e.g. 8 Years"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="field-label">Office Room / Cabin</label>
              <input
                type="text"
                name="officeRoom"
                value={formData.officeRoom}
                onChange={handleInputChange}
                placeholder="e.g. Turing Block 304"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="field-label">Joining Date</label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: ACADEMIC ASSIGNMENT */}
        {/* ======================================================== */}
        <div className="form-card-section">
          <div className="section-header">
            <div className="section-number">3</div>
            <div>
              <h3 className="section-title">Academic Assignment</h3>
              <p className="section-desc">Course allocations, semester assignments, and section responsibilities</p>
            </div>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="field-label">Subjects Handled</label>
              <input
                type="text"
                name="subjectsHandled"
                value={formData.subjectsHandled}
                onChange={handleInputChange}
                placeholder="e.g. CS501, CS504"
                className="form-input"
              />
              <span className="field-help-text">Comma separated subject codes</span>
            </div>

            <div className="form-group">
              <label className="field-label">Assigned Semester</label>
              <select
                name="assignedSemester"
                value={formData.assignedSemester}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="Multiple Semesters">Multiple Semesters</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Assigned Section</label>
              <select
                name="assignedSection"
                value={formData.assignedSection}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Both A & B">Both Section A & B</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Assigned Classes</label>
              <input
                type="text"
                name="assignedClasses"
                value={formData.assignedClasses}
                onChange={handleInputChange}
                placeholder="e.g. 5th Sem CSE A, 5th Sem CSE B"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: ACCOUNT INFORMATION */}
        {/* ======================================================== */}
        <div className="form-card-section">
          <div className="section-header">
            <div className="section-number">4</div>
            <div>
              <h3 className="section-title">Account Information</h3>
              <p className="section-desc">Access role security policy and activation status</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="field-label">
                Assigned Role <span className="label-required">*</span>
              </label>
              <div className="role-locked-field">
                <input
                  type="text"
                  name="role"
                  value="TEACHER"
                  readOnly
                  disabled
                  className="form-input role-locked-input"
                />
                <span className="badge badge-primary role-locked-badge">
                  <Icons.Lock size={12} /> Strictly Locked to TEACHER
                </span>
              </div>
              <span className="field-help-text text-muted">
                Security enforcement: HOD cannot assign Student, Lab Faculty, or HOD roles from this form.
              </span>
            </div>

            <div className="form-group">
              <label className="field-label">
                Account Status <span className="label-required">*</span>
              </label>
              <div className="status-selector-row">
                <label className={`status-radio-card ${formData.accountStatus === 'ACTIVE' ? 'selected active-card' : ''}`}>
                  <input
                    type="radio"
                    name="accountStatus"
                    value="ACTIVE"
                    checked={formData.accountStatus === 'ACTIVE'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div className="status-radio-title">ACTIVE</div>
                    <div className="status-radio-sub">Teacher can log in and manage classes</div>
                  </div>
                </label>

                <label className={`status-radio-card ${formData.accountStatus === 'INACTIVE' ? 'selected inactive-card' : ''}`}>
                  <input
                    type="radio"
                    name="accountStatus"
                    value="INACTIVE"
                    checked={formData.accountStatus === 'INACTIVE'}
                    onChange={handleInputChange}
                  />
                  <div>
                    <div className="status-radio-title">INACTIVE</div>
                    <div className="status-radio-sub">Account suspended, academic data preserved</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="form-actions-bar">
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => {
              if (onCancel) onCancel();
              else window.dispatchEvent(new CustomEvent('changeTab', { detail: 'hod_teachers' }));
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span>
                <span>Registering Teacher...</span>
              </>
            ) : (
              <>
                <Icons.UserCheck size={18} />
                <span>+ Register & Create Teacher Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

window.AddTeacherForm = AddTeacherForm;
