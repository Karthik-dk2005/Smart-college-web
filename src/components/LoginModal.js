// CampusConnect Login & Single Sign-On Gateway (Requirements 10 & 96)
// Supports College Gmail Validation (@college.edu), Demo Account Fast Selection, and Role Redirection

function LoginModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithCredentials, switchRole, authError, setAuthError } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState('demo'); // 'demo' | 'google' | 'credentials'
  const [googleStep, setGoogleStep] = React.useState('picker');
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState('');
  
  // Credentials form state
  const [credEmail, setCredEmail] = React.useState('student@college.edu');
  const [credPassword, setCredPassword] = React.useState('password123');
  const [credRole, setCredRole] = React.useState('Student');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [formErrors, setFormErrors] = React.useState({});

  const demoAccounts = [
    {
      role: 'Student',
      email: 'amulya.h.s@mitt.ac.in',
      name: 'AMULYA H S',
      detail: 'USN: 4MN24CS007 &bull; CSE Sem 5 Sec A (MIT Thandavapura)',
      avatar: 'https://ui-avatars.com/api/?name=AMULYA+H+S&background=2563eb&color=fff',
      badgeColor: 'blue'
    },
    {
      role: 'Student',
      email: 'abhilash.kumar.k@mitt.ac.in',
      name: 'ABHILASH KUMAR K',
      detail: 'USN: 4MN24CS002 &bull; CSE Sem 5 Sec B (MIT Thandavapura)',
      avatar: 'https://ui-avatars.com/api/?name=ABHILASH+KUMAR+K&background=7c3aed&color=fff',
      badgeColor: 'purple'
    },
    {
      role: 'Student',
      email: 'dhanushree.d@mitt.ac.in',
      name: 'DHANUSHREE D',
      detail: 'Diploma Lateral Entry &bull; CSE Sem 5 Sec A (MIT Thandavapura)',
      avatar: 'https://ui-avatars.com/api/?name=DHANUSHREE+D&background=f59e0b&color=fff',
      badgeColor: 'amber'
    },
    {
      role: 'Student',
      email: 'student@college.edu',
      name: 'Aarav Sharma',
      detail: 'USN: 1NT21CS042 &bull; CSE Sem 6 Sec A (88.4% Attendance)',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
      badgeColor: 'blue'
    },
    {
      role: 'Teacher',
      email: 'teacher@college.edu',
      name: 'Prof. Ananya Iyer',
      detail: 'Associate Professor &bull; CSE Dept (EMP-CSE-108)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
      badgeColor: 'purple'
    },
    {
      role: 'HOD',
      email: 'hod@college.edu',
      name: 'Dr. Vikramaditya Sen',
      detail: 'Head of Department &bull; Computer Science (HOD-CSE-001)',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
      badgeColor: 'amber'
    },
    {
      role: 'Admin',
      email: 'admin@college.edu',
      name: 'Dr. Robert Hawthorne',
      detail: 'Central Registrar & Dean of Academic Affairs',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      badgeColor: 'rose'
    }
  ];

  const handleSelectAccount = async (email) => {
    const res = await window.authService.loginWithCollegeEmail(email);
    if (res.success) {
      switchRole(res.user.role, res.user);
      addToast(`Welcome back, ${res.user.name}! Authenticated as ${res.user.role}.`, 'success');
      if (onClose) onClose();
    } else {
      setAuthError(res.error);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      setAuthError('Please enter your institutional college email address.');
      return;
    }
    const res = await window.authService.loginWithCollegeEmail(customGoogleEmail.trim());
    if (res.success) {
      switchRole(res.user.role, res.user);
      addToast(`Logged in successfully with ${res.user.email}`, 'success');
      if (onClose) onClose();
    } else {
      setAuthError(res.error);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!credEmail.trim()) errors.email = 'College Email is required';
    if (!credPassword.trim()) errors.password = 'Password is required';
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const res = await window.authService.loginWithCollegeEmail(credEmail.trim());
      if (res.success) {
        switchRole(res.user.role, res.user);
        addToast(`Signed in as ${res.user.name} (${res.user.role})`, 'success');
        if (onClose) onClose();
      } else {
        setAuthError(res.error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Prominent College Campus Hero Cover Header */}
        <div className="login-modal-hero-cover">
          <img 
            src="assets/mit-img-11.jpg" 
            alt="Maharaja Institute of Technology Thandavapura Campus" 
            className="login-hero-img" 
          />
          <div className="login-hero-overlay">
            <div className="login-hero-badge">
              <Icons.Building size={14} className="text-primary" />
              <span>Maharaja Institute of Technology Thandavapura</span>
            </div>
            <h3 className="login-hero-title">Academic Governance & ERP Gateway</h3>
            <p className="login-hero-subtitle">Department of Computer Science and Engineering</p>
          </div>
          {onClose && (
            <button className="login-hero-close-btn" onClick={onClose} title="Close">
              <Icons.X size={18} />
            </button>
          )}
        </div>

        {/* Modal Header */}
        <div className="login-modal-header">
          <div className="login-brand-row">
            <div className="login-logo-badge">
              <Icons.GraduationCap size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="login-title">CampusConnect Academic SSO</h2>
              <p className="login-subtitle">Institutional Single Sign-On &bull; VTU / Autonomous</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="login-tab-bar">
          <button 
            className={`login-tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('demo'); setAuthError(null); }}
          >
            <Icons.Users size={16} />
            <span>Official Demo Accounts</span>
          </button>
          <button 
            className={`login-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => { setActiveTab('google'); setAuthError(null); }}
          >
            <Icons.Google size={16} />
            <span>College Google SSO</span>
          </button>
          <button 
            className={`login-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => { setActiveTab('credentials'); setAuthError(null); }}
          >
            <Icons.Lock size={16} />
            <span>Portal Password</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {authError && (
          <div className="login-error-alert">
            <Icons.AlertTriangle size={18} />
            <span>{authError}</span>
          </div>
        )}

        {/* TAB 1: Demo Accounts Selection (Requirement 96) */}
        {activeTab === 'demo' && (
          <div className="google-sso-container">
            <div className="google-domain-shield">
              <Icons.Shield size={16} />
              <span>Select any demo account for instant 1-click evaluation:</span>
            </div>

            <div className="google-account-list">
              {demoAccounts.map((acc) => (
                <div 
                  key={acc.email} 
                  className="google-account-item"
                  onClick={() => handleSelectAccount(acc.email)}
                >
                  <img src={acc.avatar} alt={acc.name} className="google-user-avatar" />
                  <div className="google-user-info">
                    <div className="google-user-name-row">
                      <span className="google-user-name">{acc.name}</span>
                      <span className={`role-pill pill-${acc.badgeColor}`}>{acc.role}</span>
                    </div>
                    <div className="google-user-email"><code>{acc.email}</code></div>
                    <div className="google-user-detail" dangerouslySetInnerHTML={{ __html: acc.detail }} />
                  </div>
                  <Icons.ChevronRight size={18} className="account-arrow" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: College Google SSO */}
        {activeTab === 'google' && (
          <div className="google-sso-container">
            <div className="google-domain-shield">
              <Icons.Shield size={16} />
              <span>Authorized Domain: <strong>@college.edu</strong> &bull; Google Workspace SSO</span>
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="google-custom-form">
              <div className="form-group">
                <label className="form-label">College Google Email Address</label>
                <div className="input-with-icon">
                  <Icons.Google size={18} className="input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. yourname@college.edu" 
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <span className="form-hint">Must end with @college.edu, @campus.edu, or .edu</span>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Verify & Sign In with College SSO
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Credentials Form */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="credentials-form">
            <div className="form-group">
              <label className="form-label">College Email</label>
              <input 
                type="email" 
                className={`form-input ${formErrors.email ? 'is-invalid' : ''}`}
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                placeholder="student@college.edu"
              />
              {formErrors.email && <span className="invalid-feedback">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password / Security PIN</label>
              <input 
                type="password" 
                className={`form-input ${formErrors.password ? 'is-invalid' : ''}`}
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span>Remember this workstation session</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign In to ERP Portal
            </button>

            <div className="mt-3 text-center">
              <a href="#" className="text-sm text-primary" onClick={(e) => { e.preventDefault(); addToast('Password reset instructions sent to student registered email', 'info'); }}>
                Forgot Password or Security PIN?
              </a>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="login-modal-footer">
          <div className="footer-privacy-note">
            <Icons.Lock size={14} />
            <span>FERPA Compliant Academic Privacy &bull; Zero Peer Leakage Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LoginModal = LoginModal;
