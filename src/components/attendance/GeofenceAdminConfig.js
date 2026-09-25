// CampusConnect Geofence Administration & Live Faculty Roster
// Allows HOD and Admin to configure campus coordinates, geofence radius, and accuracy threshold.
// Allows Teachers, HOD, and Admin to view the live GPS Geofence attendance check-in roster.

function GeofenceAdminConfig() {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const [config, setConfig] = React.useState({
    institutionName: "CampusConnect Institute of Technology",
    campusName: "Thandavapura Main Campus",
    address: "Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India",
    latitude: 12.183700,
    longitude: 76.694200,
    geofenceRadiusMeters: 300,
    accuracyThresholdMeters: 80
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [records, setRecords] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().slice(0, 10));

  const canEditConfig = role === 'HOD' || role === 'Admin';

  // Load config & records
  const loadData = React.useCallback(async () => {
    if (window.geofenceService) {
      const c = await window.geofenceService.fetchConfig();
      if (c) setConfig(c);
    }

    if (window.attendanceValidationService) {
      const recs = await window.attendanceValidationService.getAllGeoRecords({ date: selectedDate });
      setRecords(recs);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle configuration update
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!canEditConfig) {
      addToast({ type: 'warning', message: 'You do not have permission to modify geofence settings.' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await window.geofenceService.updateConfig(config, {
        'x-user-role': role.toUpperCase(),
        'x-user-id': user?.id || 'admin'
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Geofence Updated',
          message: `Campus geofence radius set to ${config.geofenceRadiusMeters}m.`
        });
      } else {
        throw new Error(res.error || 'Failed to update configuration.');
      }
    } catch (err) {
      addToast({ type: 'danger', title: 'Update Failed', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered attendance roster
  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      (r.studentName && r.studentName.toLowerCase().includes(term)) ||
      (r.usn && r.usn.toLowerCase().includes(term)) ||
      (r.department && r.department.toLowerCase().includes(term))
    );
  });

  return (
    <div className="geofence-admin-container">
      {/* 1. Header */}
      <div className="panel-card mb-4">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">🌐 Institutional GPS Geofence Command Center</h3>
            <p className="panel-desc">
              Manage physical geofence boundaries for Thandavapura Campus and audit student check-ins
            </p>
          </div>
          <span className="badge badge-emerald">
            Campus: Thandavapura Main Campus
          </span>
        </div>

        {/* 2. Geofence Configuration Controls (HOD / Admin only) */}
        {canEditConfig && (
          <form onSubmit={handleSaveConfig} className="geofence-config-form">
            <div className="config-form-grid">
              
              <div className="form-group">
                <label className="form-label">Campus Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={config.campusName}
                  onChange={e => setConfig({ ...config, campusName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Address</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={config.address}
                  onChange={e => setConfig({ ...config, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Latitude (° N)</label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="form-control font-mono"
                  value={config.latitude}
                  onChange={e => setConfig({ ...config, latitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Longitude (° E)</label>
                <input 
                  type="number" 
                  step="0.000001"
                  className="form-control font-mono"
                  value={config.longitude}
                  onChange={e => setConfig({ ...config, longitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Attendance Radius: <strong>{config.geofenceRadiusMeters} meters</strong>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="2000" 
                  step="25"
                  className="form-range"
                  value={config.geofenceRadiusMeters}
                  onChange={e => setConfig({ ...config, geofenceRadiusMeters: parseInt(e.target.value) })}
                />
                <span className="text-muted text-xs">Students beyond this radius are marked as Outside Attendance Area</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Max GPS Accuracy Threshold: <strong>±{config.accuracyThresholdMeters} meters</strong>
                </label>
                <input 
                  type="range" 
                  min="20" 
                  max="250" 
                  step="10"
                  className="form-range"
                  value={config.accuracyThresholdMeters}
                  onChange={e => setConfig({ ...config, accuracyThresholdMeters: parseInt(e.target.value) })}
                />
                <span className="text-muted text-xs">Anti-spoofing gate: GPS readings coarser than this threshold are rejected</span>
              </div>
            </div>

            <div className="form-actions-row mt-3">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving Configuration...' : '💾 Save Geofence Configuration'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfig({
                  institutionName: "CampusConnect Institute of Technology",
                  campusName: "Thandavapura Main Campus",
                  address: "Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India",
                  latitude: 12.183700,
                  longitude: 76.694200,
                  geofenceRadiusMeters: 300,
                  accuracyThresholdMeters: 80
                })}
              >
                Reset to Default Coordinates
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Live Geofence Attendance Roster */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">📋 Live GPS Geofence Attendance Roster</h3>
            <p className="panel-desc">Real-time log of verified physical check-ins for {selectedDate}</p>
          </div>
          <div className="roster-filters-row">
            <input 
              type="date" 
              className="form-control"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: '160px' }}
            />
            <input 
              type="text" 
              className="form-control"
              placeholder="Search by student name or USN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '240px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Check-in Time</th>
                <th>Distance to Campus</th>
                <th>GPS Accuracy</th>
                <th>Coordinates (Lat, Lon)</th>
                <th>Status</th>
                <th>Verification Token</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No geofence check-ins recorded for this date.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r._id || r.id}>
                    <td>
                      <strong>{r.studentName}</strong>
                      <div className="text-muted text-xs">USN: {r.usn} &bull; Sem {r.semester || 6}</div>
                    </td>
                    <td>
                      <strong>{r.time || r.checkInTime}</strong>
                      <div className="text-muted text-xs">{r.date}</div>
                    </td>
                    <td>
                      <span className="font-semibold text-emerald">{r.distance}m</span>
                    </td>
                    <td>
                      <span className="text-sm">±{r.accuracy}m</span>
                    </td>
                    <td className="font-mono text-xs">
                      {r.latitude ? `${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}` : '--'}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <Icons.CheckCircle size={12} className="inline-icon" /> {r.status || 'PRESENT'}
                      </span>
                    </td>
                    <td>
                      <code className="text-xs" style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.verificationHash || r.verificationReference || `GEO-VER-${r._id?.slice(-8)}`}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Global Export for Babel SPA
window.GeofenceAdminConfig = GeofenceAdminConfig;
