import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { GraduationCap, Calendar, Clock, Building, Loader2, RefreshCw } from "lucide-react";

export default function StudentExamsView() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.getExams();
      if (Array.isArray(res)) {
        setExams(res);
      }
    } catch (err) {
      console.error("Exams fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading && exams.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Examination Schedule
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Semester End Examinations & Continuous Internal Assessment Timetable
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchExams}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <GraduationCap size={18} color="#6366f1" />
            <span>Scheduled Examinations</span>
          </h2>
          <span className="badge badge-info">{exams.length} Upcoming Papers</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room Allocation</th>
                <th>Max Marks</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No examinations currently scheduled for this semester.
                  </td>
                </tr>
              ) : (
                exams.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{ex.exam_title}</div>
                      {ex.instructions && (
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{ex.instructions}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-purple">{ex.exam_type}</span>
                    </td>
                    <td>{ex.subject?.name || `Subject #${ex.subject_id}`}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} color="#06b6d4" />
                        <span>{ex.date}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} color="#6366f1" />
                        <span>{ex.start_time} - {ex.end_time}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Building size={14} color="#10b981" />
                        <span>{ex.room?.room_number || "To Be Announced"}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{ex.max_marks}</strong> Marks
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
