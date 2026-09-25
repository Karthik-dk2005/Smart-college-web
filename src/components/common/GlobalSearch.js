// CampusConnect Global Search Component (Requirement 75)
// Grouped instant search across Students, Teachers, Subjects, Rooms, Timetable, Exams, Materials, Notices, Bus

function GlobalSearch({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = React.useState('');
  const db = window.masterDB.db;

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results = {
    students: q ? db.users.filter(u => u.role === 'Student' && (u.name.toLowerCase().includes(q) || u.rollNo?.toLowerCase().includes(q))) : [],
    teachers: q ? db.users.filter(u => u.role === 'Teacher' && (u.name.toLowerCase().includes(q) || u.assignedSubjects?.some(s => s.toLowerCase().includes(q)))) : [],
    subjects: q ? db.subjects.filter(s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : [],
    rooms: q ? db.rooms.filter(r => r.number.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)) : [],
    notices: q ? db.notices.filter(n => n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)) : [],
    busRoutes: q ? db.busRoutes.filter(b => b.busNumber.toLowerCase().includes(q) || b.routeName.toLowerCase().includes(q)) : []
  };

  const totalResults = Object.values(results).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-input-row">
          <Icons.Search size={20} className="search-modal-icon" />
          <input 
            type="text" 
            className="global-search-field"
            placeholder="Search students, faculty, subjects, rooms, exams, bus routes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="search-close-btn" onClick={onClose}>
            <Icons.X size={18} />
          </button>
        </div>

        <div className="global-search-body">
          {!q ? (
            <div className="search-suggestions-box">
              <span className="search-suggestions-title">Quick Searches:</span>
              <div className="suggestion-tags">
                <button className="suggestion-tag" onClick={() => setQuery('Distributed Systems')}>Distributed Systems</button>
                <button className="suggestion-tag" onClick={() => setQuery('TB-201')}>Room TB-201</button>
                <button className="suggestion-tag" onClick={() => setQuery('Bus 04')}>Bus 04</button>
                <button className="suggestion-tag" onClick={() => setQuery('Exam')}>Final Exams</button>
                <button className="suggestion-tag" onClick={() => setQuery('Prof. Ananya')}>Prof. Ananya Iyer</button>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="search-empty-state">
              <Icons.AlertTriangle size={32} className="text-muted mb-2" />
              <p>No matches found for "{query}".</p>
            </div>
          ) : (
            <div className="search-results-container">
              {results.subjects.length > 0 && (
                <div className="result-group">
                  <div className="group-heading">Subjects ({results.subjects.length})</div>
                  {results.subjects.map(s => (
                    <div key={s.id} className="search-result-row" onClick={() => { onSelectResult && onSelectResult('subject', s); onClose(); }}>
                      <span className="badge badge-purple">{s.code}</span>
                      <div className="result-main">
                        <strong>{s.name}</strong>
                        <div className="text-muted text-sm">{s.dept} Sem {s.semester} &bull; {s.teacherName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.rooms.length > 0 && (
                <div className="result-group">
                  <div className="group-heading">Rooms & Laboratories ({results.rooms.length})</div>
                  {results.rooms.map(r => (
                    <div key={r.id} className="search-result-row" onClick={() => { onSelectResult && onSelectResult('room', r); onClose(); }}>
                      <span className="badge badge-primary">{r.number}</span>
                      <div className="result-main">
                        <strong>{r.building} ({r.floor})</strong>
                        <div className="text-muted text-sm">{r.type} &bull; Capacity: {r.capacity} &bull; Status: {r.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.busRoutes.length > 0 && (
                <div className="result-group">
                  <div className="group-heading">College Bus Transport ({results.busRoutes.length})</div>
                  {results.busRoutes.map(b => (
                    <div key={b.busNumber} className="search-result-row" onClick={() => { onSelectResult && onSelectResult('bus', b); onClose(); }}>
                      <span className="badge badge-amber">{b.busNumber}</span>
                      <div className="result-main">
                        <strong>{b.routeName}</strong>
                        <div className="text-muted text-sm">Departure: {b.morningDeparture} &bull; Driver: {b.driverName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.notices.length > 0 && (
                <div className="result-group">
                  <div className="group-heading">Notices & Circulars ({results.notices.length})</div>
                  {results.notices.map(n => (
                    <div key={n.id} className="search-result-row" onClick={() => { onSelectResult && onSelectResult('notice', n); onClose(); }}>
                      <span className="badge badge-rose">{n.category}</span>
                      <div className="result-main">
                        <strong>{n.title}</strong>
                        <div className="text-muted text-sm">{n.date} &bull; By {n.publishedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.teachers.length > 0 && (
                <div className="result-group">
                  <div className="group-heading">Faculty Members ({results.teachers.length})</div>
                  {results.teachers.map(t => (
                    <div key={t.id} className="search-result-row" onClick={() => { onSelectResult && onSelectResult('teacher', t); onClose(); }}>
                      <span className="badge badge-purple">Faculty</span>
                      <div className="result-main">
                        <strong>{t.name}</strong>
                        <div className="text-muted text-sm">{t.designation} &bull; {t.department} &bull; {t.office}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.GlobalSearch = GlobalSearch;
