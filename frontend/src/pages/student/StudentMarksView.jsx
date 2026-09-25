import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Award, CheckCircle2, Clock, Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function StudentMarksView() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const res = await api.getMyMarks();
      if (res && res.marks) {
        setMarks(res.marks);
      }
    } catch (err) {
      console.error("Marks fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const getGradeBadge = (grade) => {
    switch (grade) {
      case "O":
      case "A+":
        return "badge-success";
      case "A":
      case "B+":
        return "badge-info";
      case "B":
      case "C":
        return "badge-warning";
      default:
        return "badge-danger";
    }
  };

  if (loading && marks.length === 0) {
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
            Continuous Evaluation & Internal Marks
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            VTU Continuous Assessment Scheme (IA-1, IA-2, Assignments, Quizzes & Semester Total)
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchMarks}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Award size={18} color="#6366f1" />
            <span>Course Gradebook</span>
          </h2>
          <span className="badge badge-info">{marks.length} Subjects Evaluated</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Subject Code & Title</th>
                <th>Assessment</th>
                <th>IA 1 (30)</th>
                <th>IA 2 (30)</th>
                <th>Assignment (20)</th>
                <th>Quiz/Test (20)</th>
                <th>Total (100)</th>
                <th>Grade</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {marks.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No continuous evaluation marks entered yet by faculty.
                  </td>
                </tr>
              ) : (
                marks.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{m.subject_name}</div>
                      <span className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "1px 5px", marginTop: "2px" }}>
                        {m.subject_code}
                      </span>
                    </td>
                    <td>{m.exam_type}</td>
                    <td>{m.ia1_score}</td>
                    <td>{m.ia2_score}</td>
                    <td>{m.assignment_score}</td>
                    <td>{m.quiz_score + m.test_score}</td>
                    <td>
                      <strong style={{ color: "#fff", fontSize: "1rem" }}>{m.total_score}</strong> / {m.max_total}
                    </td>
                    <td>
                      <span className={`badge ${getGradeBadge(m.grade_letter)}`} style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        {m.grade_letter}
                      </span>
                    </td>
                    <td>
                      {m.status === "FINALIZED" ? (
                        <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} />
                          <span>Locked & Finalized</span>
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} />
                          <span>Draft (Pending HOD)</span>
                        </span>
                      )}
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
