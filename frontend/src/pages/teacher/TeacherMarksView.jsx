import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Award, PlusCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function TeacherMarksView() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Marks form
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState("Internal Assessment 1");
  const [ia1, setIa1] = useState(25);
  const [ia2, setIa2] = useState(25);
  const [assignment, setAssignment] = useState(18);
  const [test, setTest] = useState(15);
  const [quiz, setQuiz] = useState(5);

  const totalScore = parseFloat(ia1 || 0) + parseFloat(ia2 || 0) + parseFloat(assignment || 0) + parseFloat(test || 0) + parseFloat(quiz || 0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sRes = await api.getStudents();
      if (sRes && sRes.students) {
        setStudents(sRes.students);
        if (sRes.students.length > 0 && !studentId) {
          setStudentId(sRes.students[0].id);
        }
      }

      const dash = await api.getTeacherDashboard();
      if (dash && dash.subjects) {
        setSubjects(dash.subjects);
        if (dash.subjects.length > 0 && !subjectId) {
          setSubjectId(dash.subjects[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        student_id: parseInt(studentId),
        subject_id: parseInt(subjectId) || 1,
        exam_type: examType,
        ia1_score: parseFloat(ia1) || 0,
        ia2_score: parseFloat(ia2) || 0,
        assignment_score: parseFloat(assignment) || 0,
        test_score: parseFloat(test) || 0,
        quiz_score: parseFloat(quiz) || 0,
        semester_exam_score: 0,
        max_total: 100.0,
      };

      const res = await api.createMark(payload);
      setFeedback({
        success: true,
        message: `Evaluation recorded successfully! Total: ${res.data?.total || totalScore}/100 (Grade: ${res.data?.grade || "A"}). Status: DRAFT (Pending HOD lock).`,
      });
    } catch (err) {
      setFeedback({
        success: false,
        message: err.message || "Failed to record evaluation marks.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Faculty Marks Entry & Evaluation
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            VTU Continuous Assessment Scheme • Draft Scorebook Entry
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            background: feedback.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: feedback.success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            color: feedback.success ? "#34d399" : "#f87171",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {feedback.message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Award size={18} color="#6366f1" />
            <span>Enter Internal Assessment Scores</span>
          </h2>
          <span className="badge badge-info">Calculated Total: {totalScore} / 100</span>
        </div>

        <form onSubmit={handleSaveMarks}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Student</label>
              <select
                className="form-control"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name} ({st.usn}) - Sem {st.semester}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-control"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assessment Stage</label>
              <select
                className="form-control"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="Internal Assessment 1">Internal Assessment 1</option>
                <option value="Internal Assessment 2">Internal Assessment 2</option>
                <option value="Assignment & Quiz">Assignment & Quiz</option>
                <option value="Lab Practical Continuous">Lab Practical Continuous</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              padding: "1.25rem",
              borderRadius: "10px",
              margin: "1rem 0",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">IA 1 (Max 30)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                className="form-control"
                value={ia1}
                onChange={(e) => setIa1(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">IA 2 (Max 30)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                className="form-control"
                value={ia2}
                onChange={(e) => setIa2(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Assignment (Max 20)</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                className="form-control"
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Test Score (Max 15)</label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                className="form-control"
                value={test}
                onChange={(e) => setTest(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Quiz (Max 5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                className="form-control"
                value={quiz}
                onChange={(e) => setQuiz(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.85rem" }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Recording Draft Assessment...</span>
              </>
            ) : (
              <>
                <Award size={16} />
                <span>Save Assessment Marks (Draft)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
