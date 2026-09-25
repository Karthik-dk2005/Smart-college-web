// CampusConnect Student Smart Views:
// What I Missed, Class Memory, AI Assistant, Bus Information, Academic Records, Helpdesk & Feedback

// 1. "What I Missed" (Requirement 47)
function StudentWhatIMissedView({ onNavigate }) {
  const { user } = useAuth();
  const [missedRecords, setMissedRecords] = React.useState([]);
  const { addToast } = useToast();

  React.useEffect(() => {
    window.smartFeaturesService.getWhatIMissed(user?.id || 'usr-std-01').then(setMissedRecords);
  }, [user]);

  return (
    <div className="smart-view-container">
      <div className="panel-card mb-4">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Icons.Clock size={20} className="inline-icon text-amber" /> What I Missed During Absences
            </h3>
            <p className="panel-desc">Curated academic catch-up briefings generated automatically whenever attendance is missed</p>
          </div>
          <span className="badge badge-warning">{missedRecords.length} Missed Lectures</span>
        </div>

        <div className="what-missed-list">
          {missedRecords.map(item => (
            <div key={item.id} className="what-missed-card">
              <div className="wim-header">
                <div>
                  <span className="badge badge-purple">{item.subjectCode}</span>
                  <span className="wim-subject-title">{item.subjectName}</span>
                </div>
                <div className="wim-date">📅 Missed on: <strong>{item.date}</strong></div>
              </div>

              <div className="wim-body">
                <div className="wim-meta-row">
                  <span>👨‍🏫 Faculty: <strong>{item.teacher}</strong></span>
                  <span>📍 Room: <strong>{item.room}</strong></span>
                </div>

                <div className="wim-highlight-box">
                  <div className="wim-field-label">Core Topic Covered in Class:</div>
                  <div className="wim-topic-text">{item.topicCovered}</div>
                </div>

                <div className="wim-homework-box">
                  <div className="wim-field-label">Assigned Homework & Practice:</div>
                  <div className="wim-hw-text">📝 {item.homework}</div>
                </div>

                {item.attachedMaterials && item.attachedMaterials.length > 0 && (
                  <div className="wim-attachments">
                    <span className="wim-field-label">Download Catch-Up Material:</span>
                    <div className="attachment-pills">
                      {item.attachedMaterials.map((f, i) => (
                        <button key={i} className="attachment-download-pill" onClick={() => addToast(`Downloading ${f}`, 'success')}>
                          <Icons.Download size={14} /> {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="wim-footer">
                  <div className="wim-announcement">
                    <strong>Notice Given:</strong> {item.announcements}
                  </div>
                  <div className="wim-next-preview">
                    <strong>Next Class:</strong> {item.nextClassPreview}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. "Class Memory" (Chronological Class History) (Requirement 48)
function StudentClassMemoryView() {
  const [memoryList, setMemoryList] = React.useState([]);

  React.useEffect(() => {
    window.smartFeaturesService.getClassMemory().then(setMemoryList);
  }, []);

  return (
    <div className="smart-view-container">
      <div className="panel-card mb-4">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Icons.BookOpen size={20} className="inline-icon text-primary" /> Class Memory & Lecture Archive
            </h3>
            <p className="panel-desc">Chronological repository of classroom topics, derivations, algorithms, and assigned exercises</p>
          </div>
        </div>

        <div className="class-memory-timeline">
          {memoryList.map((entry, index) => (
            <div key={entry.id} className="memory-timeline-item">
              <div className="memory-badge-dot"></div>
              <div className="memory-card">
                <div className="memory-card-top">
                  <div className="memory-subject-badge">
                    <span className="badge badge-purple">{entry.subjectCode}</span>
                    <strong className="memory-subj-name">{entry.subjectName}</strong>
                  </div>
                  <div className="memory-time-meta">
                    <span>{entry.date}</span> &bull; <span>{entry.timeSlot}</span> &bull; <span className="text-emerald">{entry.room}</span>
                  </div>
                </div>

                <div className="memory-faculty">Instructor: {entry.teacher}</div>

                <div className="memory-topics-box">
                  <span className="memory-label">Key Concepts & Topics Addressed:</span>
                  <div className="topic-tags-row">
                    {entry.topicsCovered.map((topic, ti) => (
                      <span key={ti} className="topic-tag">&bull; {topic}</span>
                    ))}
                  </div>
                </div>

                <div className="memory-hw-strip">
                  <strong>Assigned Homework:</strong> {entry.homework}
                </div>

                <div className="memory-takeaway-strip">
                  <strong>Key Takeaway:</strong> <em>"{entry.keyTakeaways}"</em>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. AI Department Assistant (Requirement 49)
function StudentAIAssistantView() {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'Aarav'}! I am your CampusConnect AI Department Assistant. I can answer questions about your next class, room locations, what you missed, upcoming internal exams, assignments, or college bus schedules.`,
      time: 'Just now'
    }
  ]);
  const [inputVal, setInputVal] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = React.useState([
    'What is my next class?',
    'What did I miss yesterday?',
    'When is my next exam?',
    'When is my assignment due?',
    'What room is my next class in?',
    'Show today\'s timetable.'
  ]);

  const handleSend = async (questionText) => {
    const q = (questionText || inputVal).trim();
    if (!q) return;

    const userMsg = { sender: 'user', text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(async () => {
      const resp = await window.aiAssistantService.askAssistant(q, user);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: resp.answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      if (resp.suggestedNext && resp.suggestedNext.length > 0) {
        setSuggestedQuestions(resp.suggestedNext);
      }
    }, 450);
  };

  return (
    <div className="ai-assistant-container">
      <div className="panel-card ai-chat-card">
        <div className="ai-card-header">
          <div className="ai-bot-profile">
            <div className="ai-avatar-circle">
              <Icons.Shield size={22} className="text-white" />
            </div>
            <div>
              <h3 className="ai-title">CampusConnect Academic AI Assistant</h3>
              <p className="ai-status"><span className="live-dot"></span> Online &bull; Department AI Model (CSE)</p>
            </div>
          </div>
          <span className="badge badge-primary">Department Context Locked</span>
        </div>

        <div className="ai-messages-box">
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-message-row ${m.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
              <div className="message-bubble">
                <div className="msg-text" dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                <div className="msg-time">{m.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-message-row msg-ai">
              <div className="message-bubble typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Pills */}
        <div className="suggested-prompts-bar">
          <span className="suggested-label">Suggested:</span>
          <div className="prompts-scroll-row">
            {suggestedQuestions.map((sq, i) => (
              <button key={i} className="prompt-pill" onClick={() => handleSend(sq)}>
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form className="ai-input-form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input 
            type="text" 
            className="ai-chat-input" 
            placeholder="Ask about timetable, next class, exams, attendance, or bus..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button type="submit" className="btn btn-primary ai-send-btn">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// 4. College Bus Transport View (Requirements 57 - 60)
function StudentBusView() {
  const [routes, setRoutes] = React.useState([]);
  const [selectedRoute, setSelectedRoute] = React.useState(null);

  React.useEffect(() => {
    window.busService.getBusRoutes().then(data => {
      setRoutes(data);
      if (data.length > 0) setSelectedRoute(data[0]);
    });
  }, []);

  return (
    <div className="bus-view-container">
      <div className="panel-card mb-4">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              🚌 College Bus Routes & Realtime Transit Schedule
            </h3>
            <p className="panel-desc">Official morning and evening departure timings, designated pickup points, and schedule advisories</p>
          </div>
          <span className="badge badge-emerald">Active Fleet</span>
        </div>

        {/* Active Bus Alerts */}
        {routes.filter(r => r.activeAlert).map((b, i) => (
          <AlertBanner 
            key={i}
            type="warning"
            title={`Transit Advisory: ${b.busNumber} (${b.routeNumber})`}
            message={b.activeAlert}
          />
        ))}

        <div className="bus-routes-grid">
          {routes.map(bus => (
            <div 
              key={bus.busNumber} 
              className={`bus-card ${selectedRoute?.busNumber === bus.busNumber ? 'selected-bus' : ''}`}
              onClick={() => setSelectedRoute(bus)}
            >
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
            </div>
          ))}
        </div>

        {selectedRoute && (
          <div className="route-stops-panel mt-4">
            <h4 className="font-semibold mb-3">
              Stops & Timetable Schedule: {selectedRoute.busNumber} - {selectedRoute.routeName}
            </h4>
            <div className="stops-timeline">
              {selectedRoute.stops.map((stop, sidx) => (
                <div key={sidx} className="stop-item">
                  <div className="stop-circle">{sidx + 1}</div>
                  <div className="stop-details">
                    <strong className="stop-name">{stop.name}</strong>
                    <div className="stop-times">
                      <span>Pickup: {stop.timeMorning}</span> | <span>Drop: {stop.timeEvening}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 5. Academic Records (Semesters 1 - 6) (Requirement 61)
function StudentAcademicRecordsView() {
  const { user } = useAuth();
  const records = window.masterDB.db.academicRecords[user?.id] || window.masterDB.db.academicRecords['usr-std-01'] || [];

  return (
    <div className="academic-records-container">
      <div className="panel-card mb-4">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <Icons.Award size={20} className="inline-icon text-primary" /> Permanent Academic Record & Transcripts
            </h3>
            <p className="panel-desc">Cumulative progression across Semester 1 to Semester 6 with SGPA, credits earned, and standing</p>
          </div>
          <span className="badge badge-emerald">CGPA 9.18 / 10.0</span>
        </div>

        <div className="semesters-history-grid">
          {records.map(rec => (
            <div key={rec.semester} className="semester-transcript-card">
              <div className="sem-trans-header">
                <div>
                  <h4 className="sem-title">Semester {rec.semester}</h4>
                  <span className="text-muted text-sm">{rec.term}</span>
                </div>
                <div className="sem-sgpa-badge">
                  <span className="sgpa-num">{rec.sgpa}</span>
                  <span className="sgpa-lbl">SGPA</span>
                </div>
              </div>

              <div className="sem-trans-body">
                <div className="trans-metric-row">
                  <span>Credits Earned:</span>
                  <strong>{rec.credits} Credits</strong>
                </div>
                <div className="trans-metric-row">
                  <span>Term Attendance:</span>
                  <strong className="text-emerald">{rec.attendancePct}%</strong>
                </div>
                <div className="trans-metric-row">
                  <span>Classification:</span>
                  <span className="text-primary text-sm font-semibold">{rec.status}</span>
                </div>
              </div>

              <div className="sem-trans-footer">
                <button className="btn btn-sm btn-secondary btn-block">
                  <Icons.FileText size={14} /> View Semester Grade Sheet
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 6. Helpdesk & Feedback (Requirements 55 & 56)
function StudentHelpdeskFeedbackView() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tickets, setTickets] = React.useState([]);
  const [activeSubTab, setActiveSubTab] = React.useState('helpdesk');

  // Ticket Form
  const [ticketSubject, setTicketSubject] = React.useState('');
  const [ticketCategory, setTicketCategory] = React.useState('Attendance');
  const [ticketDesc, setTicketDesc] = React.useState('');

  // Feedback Form
  const [fbTarget, setFbTarget] = React.useState('CS601 Distributed Systems');
  const [fbRating, setFbRating] = React.useState(5);
  const [fbComments, setFbComments] = React.useState('');

  React.useEffect(() => {
    window.helpdeskService.getTickets(user?.id).then(setTickets);
  }, [user]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      addToast('Please enter a ticket subject and description', 'warning');
      return;
    }

    const t = await window.helpdeskService.createTicket({
      studentId: user?.id || 'usr-std-01',
      studentName: user?.name || 'Aarav Sharma',
      subject: ticketSubject.trim(),
      category: ticketCategory,
      description: ticketDesc.trim()
    });

    setTickets(prev => [t, ...prev]);
    addToast(`Helpdesk ticket ${t.id} submitted successfully!`, 'success');
    setTicketSubject('');
    setTicketDesc('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!fbComments.trim()) {
      addToast('Please provide feedback comments', 'warning');
      return;
    }

    await window.helpdeskService.submitFeedback({
      studentId: user?.id || 'usr-std-01',
      category: 'Faculty Instruction',
      target: fbTarget,
      rating: Number(fbRating),
      comments: fbComments.trim(),
      anonymous: true
    });

    addToast('Anonymous feedback submitted to Department Academic Committee', 'success');
    setFbComments('');
  };

  return (
    <div className="helpdesk-feedback-container">
      <div className="sub-tab-bar mb-3">
        <button 
          className={`sub-tab-btn ${activeSubTab === 'helpdesk' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('helpdesk')}
        >
          <Icons.HelpCircle size={16} /> Helpdesk Tickets
        </button>
        <button 
          className={`sub-tab-btn ${activeSubTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('feedback')}
        >
          <Icons.Award size={16} /> Course & Facility Feedback
        </button>
      </div>

      {activeSubTab === 'helpdesk' ? (
        <div className="dashboard-columns-grid">
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">My Support Tickets</h3>
              <span className="badge badge-primary">{tickets.length} Total</span>
            </div>
            <div className="tickets-list">
              {tickets.map(t => (
                <div key={t.id} className="ticket-item-card">
                  <div className="ticket-header">
                    <div>
                      <span className="badge badge-purple">{t.category}</span>
                      <strong className="ticket-subj ml-2">{t.subject}</strong>
                    </div>
                    <span className={`badge ${t.status === 'Resolved' ? 'badge-success' : 'badge-amber'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="ticket-desc">{t.description}</p>
                  <div className="ticket-resp-box">
                    <strong>Resolution Note:</strong> {t.response}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">Log New Support Ticket</h3>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                  <option value="Attendance">Attendance Condonation</option>
                  <option value="Marks">Internal Marks Discrepancy</option>
                  <option value="Timetable">Timetable & Classroom Conflict</option>
                  <option value="Exam">Examination & Seating</option>
                  <option value="Bus">College Bus Route Query</option>
                  <option value="Technical">Portal Technical Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Summary of issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  placeholder="Provide complete facts, dates, subject codes, and reference numbers"
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Submit Helpdesk Ticket
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="panel-card max-w-xl mx-auto">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Anonymous Academic & Facility Feedback</h3>
              <p className="panel-desc">All responses are anonymized to protect student privacy and promote genuine institutional improvement</p>
            </div>
          </div>
          <form onSubmit={handleSubmitFeedback}>
            <div className="form-group">
              <label className="form-label">Course / Facility Evaluated</label>
              <select className="form-input" value={fbTarget} onChange={(e) => setFbTarget(e.target.value)}>
                <option value="CS601 Distributed Systems (Prof. Ananya Iyer)">CS601 Distributed Systems (Prof. Ananya Iyer)</option>
                <option value="CS602 Machine Learning Applications (Prof. Divya Menon)">CS602 Machine Learning Applications (Prof. Divya Menon)</option>
                <option value="CS604 Compiler Design (Dr. Vikramaditya Sen)">CS604 Compiler Design (Dr. Vikramaditya Sen)</option>
                <option value="CS-Lab 3 Computing Hardware">CS-Lab 3 Computing Infrastructure</option>
                <option value="Central Library & Digital Resources">Central Library & Digital Resources</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    className={`star-btn ${fbRating >= star ? 'star-active' : ''}`}
                    onClick={() => setFbRating(star)}
                  >
                    ⭐ {star}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comments & Constructive Suggestions</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Share your experience regarding pedagogical clarity, lab support, or facility maintenance..."
                value={fbComments}
                onChange={(e) => setFbComments(e.target.value)}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Anonymous Feedback
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

window.StudentWhatIMissedView = StudentWhatIMissedView;
window.StudentClassMemoryView = StudentClassMemoryView;
window.StudentAIAssistantView = StudentAIAssistantView;
window.StudentBusView = StudentBusView;
window.StudentAcademicRecordsView = StudentAcademicRecordsView;
window.StudentHelpdeskFeedbackView = StudentHelpdeskFeedbackView;
