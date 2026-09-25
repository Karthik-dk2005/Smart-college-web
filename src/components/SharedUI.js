// CampusConnect Shared UI Component Library

const Badge = ({ children, variant = 'primary', className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

const StatCard = ({ title, value, subtitle, icon: IconComponent, color = 'blue', trend = null, onClick = null }) => {
  return (
    <div className={`stat-card stat-${color} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {IconComponent && (
          <div className={`stat-icon-wrapper icon-${color}`}>
            <IconComponent size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {(subtitle || trend) && (
        <div className="stat-card-footer">
          {trend && (
            <span className={`stat-trend ${trend.type === 'up' ? 'trend-up' : trend.type === 'down' ? 'trend-down' : 'trend-neutral'}`}>
              {trend.text}
            </span>
          )}
          {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ value, max = 100, showLabel = true, height = 8, warningThreshold = 75 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  let statusColor = 'var(--emerald-500)';
  if (percentage < warningThreshold) {
    statusColor = 'var(--rose-500)';
  } else if (percentage < 80) {
    statusColor = 'var(--amber-500)';
  }

  return (
    <div className="progress-container">
      {showLabel && (
        <div className="progress-labels">
          <span className="progress-sub">Threshold: {warningThreshold}%</span>
          <span className="progress-value" style={{ color: statusColor }}>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div 
          className="progress-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: statusColor 
          }}
        />
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = '550px' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icons.X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const AlertBanner = ({ type = 'info', title, message, actionText, onAction, children }) => {
  const icons = {
    info: Icons.Clock,
    warning: Icons.AlertTriangle,
    success: Icons.CheckCircle,
    danger: Icons.AlertTriangle
  };
  const Icon = icons[type] || Icons.Clock;

  return (
    <div className={`alert-banner alert-${type}`}>
      <div className="alert-icon">
        <Icon size={20} />
      </div>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        {message && <div className="alert-message">{message}</div>}
        {children}
      </div>
      {actionText && onAction && (
        <button className="alert-action-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

// Global Toast System
const ToastContext = React.createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-portal">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && <Icons.CheckCircle size={18} />}
              {toast.type === 'warning' && <Icons.AlertTriangle size={18} />}
              {toast.type === 'danger' && <Icons.AlertTriangle size={18} />}
              {toast.type === 'info' && <Icons.Clock size={18} />}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <Icons.X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return { addToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
}

window.Badge = Badge;
window.StatCard = StatCard;
window.ProgressBar = ProgressBar;
window.Modal = Modal;
window.AlertBanner = AlertBanner;
window.ToastProvider = ToastProvider;
window.useToast = useToast;
