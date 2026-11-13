import React, { useState, useEffect, useMemo } from "react";
import { marksApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import TableSkeleton from "../components/TableSkeleton";
import {
  Award,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Users,
  GraduationCap,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
  PlusCircle,
} from "lucide-react";

const OFFICIAL_SUBJECT_LIST = [
  { code: "BCS501", name: "Software Engineering (SE)", short: "SE", max: 30, scaledMax: 25 },
  { code: "BCS502", name: "Computer Networks (CN)", short: "CN", max: 30, scaledMax: 15 },
  { code: "BCS503", name: "Theory of Computation (TOC)", short: "TOC", max: 30, scaledMax: 25 },
  { code: "BRMK557", name: "RM & IPR", short: "RM & IPR", max: 30, scaledMax: 25 },
  { code: "BCS515C", name: "UNIX", short: "UNIX", max: 30, scaledMax: 25 },
  { code: "BCS508", name: "Environmental Studies (ENV)", short: "ENV", max: 25, scaledMax: 25 },
];

export default function Marks() {
  const { user, role } = useAuth();
  const { success, error } = useToast();

  const isStudent = role?.toLowerCase() === "student";
  const canManage = ["admin", "hod", "teacher", "faculty"].includes(role?.toLowerCase());

  // View tabs for staff
  const [activeTab, setActiveTab] = useState(isStudent ? "student-card" : "table"); // 'table' | 'dashboard' | 'student-wise' | 'student-card'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [marksList, setMarksList] = useState([]);
  const [dashboardCards, setDashboardCards] = useState([]);
  const [studentWiseList, setStudentWiseList] = useState([]);
  const [myMarksProfile, setMyMarksProfile] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState(""); // "" = All, "A", "B"
  const [subjectFilter, setSubjectFilter] = useState(""); // "" = All, "BCS501", etc.
  const [statusFilter, setStatusFilter] = useState(""); // "" = All, "Present", "Absent"
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);

  // Edit / Enter Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [editForm, setEditForm] = useState({
    obtained_marks: "",
    is_absent: false,
    ia2_obtained_marks: "",
    ia2_is_absent: false,
    notes: "",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // PDF Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSection, setImportSection] = useState("A");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Initial data fetch
  const fetchData = async () => {
    try {
      setRefreshing(true);

      if (isStudent) {
        // Fetch personal marks profile
        const myRes = await marksApi.getMyMarks();
        if (myRes?.success) {
          setMyMarksProfile(myRes);
        }
      } else {
        // Fetch for Admin / HOD / Teacher
        const [marksRes, dashRes, stWiseRes] = await Promise.all([
          marksApi.getMarks({
            semester: 5,
            section: sectionFilter || undefined,
            subject_code: subjectFilter || undefined,
            status: statusFilter || undefined,
          }),
          marksApi.getDashboard({
            semester: 5,
            section: sectionFilter || undefined,
          }),
          marksApi.getStudentWiseMarks({
            semester: 5,
            section: sectionFilter || undefined,
          }),
        ]);

        if (marksRes?.marks) setMarksList(marksRes.marks);
        if (dashRes?.cards) setDashboardCards(dashRes.cards);
        if (stWiseRes?.students) setStudentWiseList(stWiseRes.students);
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
      error("Failed to load marks data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sectionFilter, subjectFilter, statusFilter, isStudent]);

  // Client-side instant search filter for marks list
  const filteredMarks = useMemo(() => {
    if (!search.trim()) return marksList;
    const term = search.toLowerCase().trim();
    return marksList.filter(
      (m) =>
        m.usn?.toLowerCase().includes(term) ||
        m.student_name?.toLowerCase().includes(term) ||
        m.subject_name?.toLowerCase().includes(term) ||
        m.subject_code?.toLowerCase().includes(term)
    );
  }, [marksList, search]);

  // Client-side instant search filter for student-wise list
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentWiseList;
    const term = search.toLowerCase().trim();
    return studentWiseList.filter(
      (s) =>
        s.usn?.toLowerCase().includes(term) ||
        s.student_name?.toLowerCase().includes(term)
    );
  }, [studentWiseList, search]);

  // Open Edit Modal
  const handleOpenEdit = (mark) => {
    setEditingMark(mark);
    setEditForm({
      obtained_marks: mark.is_absent ? "" : (mark.obtained_marks !== null ? mark.obtained_marks : ""),
      is_absent: Boolean(mark.is_absent),
      ia2_obtained_marks: mark.ia2_obtained_marks !== null ? mark.ia2_obtained_marks : "",
      ia2_is_absent: Boolean(mark.ia2_is_absent),
      notes: mark.notes || "",
    });
    setIsEditModalOpen(true);
  };

  // Submit Mark Edit
  const handleSaveMarkEdit = async (e) => {
    e.preventDefault();
    if (!editingMark) return;

    try {
      setSubmittingEdit(true);

      const payload = {
        is_absent: editForm.is_absent,
        notes: editForm.notes,
      };

      if (!editForm.is_absent) {
        if (editForm.obtained_marks === "" || editForm.obtained_marks === null) {
          error("Please enter obtained marks or check Absent.");
          setSubmittingEdit(false);
          return;
        }
        const val = parseFloat(editForm.obtained_marks);
        if (isNaN(val) || val < 0 || val > editingMark.maximum_marks) {
          error(`Marks must be between 0 and ${editingMark.maximum_marks}.`);
          setSubmittingEdit(false);
          return;
        }
        payload.obtained_marks = val;
      }

      // IA-2 marks if entered
      if (editForm.ia2_obtained_marks !== "") {
        const ia2Val = parseFloat(editForm.ia2_obtained_marks);
        if (!isNaN(ia2Val)) {
          payload.ia2_obtained_marks = ia2Val;
          payload.ia2_maximum_marks = editingMark.maximum_marks;
          payload.ia2_is_absent = editForm.ia2_is_absent;
        }
      }

      const res = await marksApi.updateMark(editingMark.id, payload);
      if (res?.success) {
        success(`Marks updated successfully for ${editingMark.student_name} (${editingMark.subject_code}).`);
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      error(err.response?.data?.detail || "Failed to update marks.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit PDF Import
  const handleImportPdf = async (e) => {
    e.preventDefault();
    if (!importFile) {
      error("Please select a PDF file to import.");
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("section", importSection);

      const res = await marksApi.importPdf(formData);
      if (res?.success) {
        success(res.message || "PDF marks successfully parsed and imported!");
        setIsImportModalOpen(false);
        setImportFile(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      error(err.response?.data?.detail || err.message || "Failed to import marks from PDF.");
    } finally {
      setImporting(false);
    }
  };

  // View specific student's card (Admin/Teacher clicking student in table)
  const handleViewStudentReport = async (usn) => {
    try {
      setLoading(true);
      const res = await marksApi.getStudentMarks(usn);
      if (res?.success) {
        setSelectedStudentForView(res);
        setActiveTab("student-card");
      }
    } catch (err) {
      console.error(err);
      error("Could not load student report card.");
    } finally {
      setLoading(false);
    }
  };

  // Quick export download helper
  const handleExport = (formatType) => {
    const params = {
      semester: 5,
      format_type: formatType,
    };
    if (sectionFilter) params.section = sectionFilter;
    if (subjectFilter) params.subject_code = subjectFilter;

    const downloadUrl = marksApi.getExportUrl(params);
    window.open(downloadUrl, "_blank");
  };

  // Render Student-Wise Report Card Banner & Subject Cards
  const renderStudentReportCard = (profile) => {
    if (!profile) return null;
    const studentData = profile;

    return (
      <div>
        {/* Navigation back button for Admin/Teachers */}
        {canManage && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setSelectedStudentForView(null);
                setActiveTab("table");
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>← Back to Marks Table</span>
            </button>
          </div>
        )}

        {/* Student Profile Official Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "1.75rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-20px",
              top: "-20px",
              opacity: 0.08,
              pointerEvents: "none",
            }}
          >
            <GraduationCap size={220} color="#818cf8" />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {studentData.assessment_name || "First Internal Assessment"}
                </span>
                <span className="badge badge-purple">
                  Section {studentData.section}
                </span>
              </div>

              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", margin: "0 0 6px 0" }}>
                {studentData.student_name}
              </h1>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", color: "#cbd5e1", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "#94a3b8" }}>USN: </span>
                  <strong style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "1rem" }}>
                    {studentData.usn}
                  </strong>
                </div>
                <div>•</div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Department: </span>
                  <strong style={{ color: "#fff" }}>
                    {studentData.department || "Computer Science and Engineering"}
                  </strong>
                </div>
                <div>•</div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Semester: </span>
                  <strong style={{ color: "#fff" }}>{studentData.semester || "5th Semester"}</strong>
                </div>
                <div>•</div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Academic Year: </span>
                  <strong style={{ color: "#fff" }}>{studentData.academic_year || "2024-2025"}</strong>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", alignSelf: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Subjects
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#818cf8" }}>
                6 / 6
              </div>
            </div>
          </div>
        </div>

        {/* Six Subjects Grid Cards */}
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <Award size={20} color="#818cf8" />
          <span>Internal Assessment Scores (All 6 Subjects)</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {studentData.subjects?.map((sub, idx) => {
            const isAb = sub.is_absent || sub.absent_status === "ABSENT" || sub.obtained_marks_display === "AB";
            const obtained = isAb ? "AB" : sub.obtained_marks_display || sub.obtained_marks;
            const pct = isAb ? 0 : Math.round((parseFloat(obtained) / sub.maximum_marks) * 100);

            return (
              <div
                key={sub.subject_code || idx}
                className="card"
                style={{
                  background: "rgba(17, 24, 39, 0.75)",
                  backdropFilter: "blur(8px)",
                  border: isAb ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span
                        style={{
                          backgroundColor: "rgba(99, 102, 241, 0.18)",
                          color: "#818cf8",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                        }}
                      >
                        {sub.subject_code}
                      </span>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginTop: "6px" }}>
                        {sub.subject_name}
                      </h3>
                    </div>

                    {isAb ? (
                      <span className="badge badge-danger" style={{ fontWeight: 800, letterSpacing: "0.05em" }}>
                        ABSENT
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        Present
                      </span>
                    )}
                  </div>

                  {/* Marks Numerical Presentation */}
                  <div
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.25)",
                      borderRadius: "10px",
                      padding: "0.85rem",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>First IA (IA-1)</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span
                          style={{
                            fontSize: "1.6rem",
                            fontWeight: 800,
                            color: isAb ? "#f87171" : "#fff",
                          }}
                        >
                          {obtained}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          / {sub.maximum_marks}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Scaled Score</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span
                          style={{
                            fontSize: "1.3rem",
                            fontWeight: 700,
                            color: isAb ? "#f87171" : "#38bdf8",
                          }}
                        >
                          {isAb ? "AB" : sub.scaled_marks_display || sub.scaled_marks || "-"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          / {sub.scaled_max_marks || sub.maximum_marks}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isAb && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "3px" }}>
                        <span>Performance</span>
                        <span style={{ color: pct >= 50 ? "#34d399" : "#fbbf24", fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, Math.max(0, pct))}%`,
                            backgroundColor: pct >= 75 ? "#10b981" : pct >= 50 ? "#6366f1" : "#f59e0b",
                            borderRadius: "999px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Second IA (IA-2) Status */}
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px" }}>
                    <span>Second IA (IA-2): </span>
                    <strong style={{ color: sub.ia2_marks ? "#fff" : "#94a3b8" }}>
                      {sub.ia2_marks || "Not yet conducted"}
                    </strong>
                  </div>
                </div>

                {canManage && sub.mark_id && (
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "right" }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={() =>
                        handleOpenEdit({
                          id: sub.mark_id,
                          usn: studentData.usn,
                          student_name: studentData.student_name,
                          subject_code: sub.subject_code,
                          subject_name: sub.subject_name,
                          maximum_marks: sub.maximum_marks,
                          obtained_marks: sub.obtained_marks,
                          is_absent: sub.is_absent,
                          ia2_obtained_marks: sub.ia2_marks,
                        })
                      }
                    >
                      <Edit2 size={12} />
                      <span>Edit Mark</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0.5rem 0 2rem 0" }}>
      {/* Page Header */}
      <div className="card-header" style={{ marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              5th Semester Continuous Assessment & IA Marks
            </h1>
            <span className="badge badge-purple">VTU Official</span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
            Maharaja Institute of Technology Thandavapura • Department of Computer Science and Engineering
          </p>
        </div>

        {/* Global actions: Refresh, Export, Import */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="btn btn-outline"
            onClick={fetchData}
            disabled={refreshing}
            title="Reload data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {canManage && (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setIsImportModalOpen(true)}
                title="Import from original college PDF"
              >
                <Upload size={14} />
                <span>Import PDF</span>
              </button>

              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("subject-wise")}
                  title="Export complete marks table as CSV"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("student-wise")}
                  title="Export student-wise matrix CSV"
                >
                  <FileSpreadsheet size={14} />
                  <span>Matrix CSV</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs for Admin / HOD / Teacher */}
      {canManage && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
            marginBottom: "1.5rem",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("table")}
            className={`btn ${activeTab === "table" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem" }}
          >
            <FileText size={15} />
            <span>Complete Marks Table</span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Award size={15} />
            <span>Subject Dashboard (6 Cards)</span>
          </button>

          <button
            onClick={() => setActiveTab("student-wise")}
            className={`btn ${activeTab === "student-wise" ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Users size={15} />
            <span>Student-Wise Gradebook ({studentWiseList.length})</span>
          </button>

          {selectedStudentForView && (
            <button
              onClick={() => setActiveTab("student-card")}
              className={`btn ${activeTab === "student-card" ? "btn-primary" : "btn-outline"}`}
              style={{ fontSize: "0.85rem" }}
            >
              <GraduationCap size={15} />
              <span>Report Card: {selectedStudentForView.usn}</span>
            </button>
          )}
        </div>
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <div className="card">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : isStudent ? (
        /* ------------------------------------------------------------- */
        /* STUDENT VIEW (Personal 6-Subject Marks Profile)               */
        /* ------------------------------------------------------------- */
        renderStudentReportCard(myMarksProfile)
      ) : activeTab === "student-card" && selectedStudentForView ? (
        /* ------------------------------------------------------------- */
        /* INDIVIDUAL STUDENT CARD PREVIEW (Staff viewing a student)     */
        /* ------------------------------------------------------------- */
        renderStudentReportCard(selectedStudentForView)
      ) : activeTab === "dashboard" ? (
        /* ------------------------------------------------------------- */
        /* TAB 2: SUBJECT-WISE MARKS DASHBOARD (6 Distinct Cards)        */
        /* ------------------------------------------------------------- */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                Subject Performance Dashboard
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Statistics and performance analytics for all 6 official 5th Semester courses
              </p>
            </div>

            {/* Section filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Section:</span>
              <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
                <button
                  className={`btn ${sectionFilter === "" ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 0, padding: "4px 12px", fontSize: "0.8rem", border: "none" }}
                  onClick={() => setSectionFilter("")}
                >
                  All (A & B)
                </button>
                <button
                  className={`btn ${sectionFilter === "A" ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 0, padding: "4px 12px", fontSize: "0.8rem", border: "none" }}
                  onClick={() => setSectionFilter("A")}
                >
                  Section A
                </button>
                <button
                  className={`btn ${sectionFilter === "B" ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: 0, padding: "4px 12px", fontSize: "0.8rem", border: "none" }}
                  onClick={() => setSectionFilter("B")}
                >
                  Section B
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            {dashboardCards.map((card, idx) => (
              <div
                key={card.subject_code}
                className="card"
                style={{
                  background: "rgba(17, 24, 39, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "1.35rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            background: "rgba(99, 102, 241, 0.2)",
                            color: "#818cf8",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {card.subject_code}
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>
                          Card #{idx + 1}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginTop: "6px" }}>
                        {card.subject_name}
                      </h3>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Max Marks</span>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8" }}>
                        {card.maximum_marks}
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      borderRadius: "10px",
                      padding: "0.75rem",
                      marginBottom: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Evaluated</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                        {card.total_students}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Present</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>
                        {card.present_count}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Absent</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: card.absent_count > 0 ? "#f87171" : "#94a3b8" }}>
                        {card.absent_count}
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Class Average</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                        {card.avg_marks} <span style={{ fontSize: "0.75rem", color: "#64748b" }}>/ {card.maximum_marks}</span>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Highest Score</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#34d399" }}>
                        {card.highest_marks} <span style={{ fontSize: "0.75rem", color: "#64748b" }}>/ {card.maximum_marks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section A & Section B comparison */}
                  <div style={{ fontSize: "0.8rem", color: "#cbd5e1", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>Sec A Avg: <strong style={{ color: "#fff" }}>{card.section_a?.avg_marks}</strong></span>
                      <span style={{ color: "#94a3b8" }}>({card.section_a?.present} Present, {card.section_a?.absent} Absent)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Sec B Avg: <strong style={{ color: "#fff" }}>{card.section_b?.avg_marks}</strong></span>
                      <span style={{ color: "#94a3b8" }}>({card.section_b?.present} Present, {card.section_b?.absent} Absent)</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Scaled IA: out of {card.scaled_max_marks}
                  </span>
                  <button
                    className="btn btn-outline"
                    style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                    onClick={() => {
                      setSubjectFilter(card.subject_code);
                      setActiveTab("table");
                    }}
                  >
                    <span>View Students</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "student-wise" ? (
        /* ------------------------------------------------------------- */
        /* TAB 3: STUDENT-WISE GRADEBOOK MATRIX                          */
        /* ------------------------------------------------------------- */
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 className="card-title">
                <Users size={18} color="#6366f1" />
                <span>Student Gradebook Matrix ({filteredStudents.length} Students)</span>
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                Displays all 6 subjects side-by-side for each student
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search USN or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: "32px", width: "220px", height: "36px", fontSize: "0.85rem" }}
                />
              </div>

              <select
                className="form-control"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                style={{ width: "120px", height: "36px", fontSize: "0.85rem" }}
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>Sl.</th>
                  <th>USN</th>
                  <th>Student Name</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Sec</th>
                  <th style={{ textAlign: "center" }}>SE (30)</th>
                  <th style={{ textAlign: "center" }}>CN (30)</th>
                  <th style={{ textAlign: "center" }}>TOC (30)</th>
                  <th style={{ textAlign: "center" }}>RM & IPR (30)</th>
                  <th style={{ textAlign: "center" }}>UNIX (30)</th>
                  <th style={{ textAlign: "center" }}>ENV (25)</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const subMap = {};
                    st.subjects?.forEach((s) => {
                      subMap[s.subject_code] = s;
                    });

                    return (
                      <tr key={st.usn}>
                        <td style={{ color: "#94a3b8" }}>{st.sl_no}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#38bdf8" }}>
                          {st.usn}
                        </td>
                        <td style={{ fontWeight: 600, color: "#fff" }}>
                          {st.student_name}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-purple" style={{ padding: "2px 6px" }}>
                            {st.section}
                          </span>
                        </td>

                        {/* 6 Subjects Columns */}
                        {["BCS501", "BCS502", "BCS503", "BRMK557", "BCS515C", "BCS508"].map((code) => {
                          const s = subMap[code];
                          if (!s) return <td key={code} style={{ textAlign: "center", color: "#64748b" }}>-</td>;
                          const isAb = s.is_absent || s.obtained_marks_display === "AB";
                          return (
                            <td key={code} style={{ textAlign: "center" }}>
                              {isAb ? (
                                <span className="badge badge-danger" style={{ fontSize: "0.75rem", padding: "1px 6px" }}>
                                  ABSENT
                                </span>
                              ) : (
                                <span style={{ fontWeight: 700, color: "#fff" }}>
                                  {s.obtained_marks_display || s.obtained_marks}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                            onClick={() => handleViewStudentReport(st.usn)}
                            title="View individual report card"
                          >
                            <span>Card</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* TAB 1: COMPLETE STUDENT MARKS TABLE                           */
        /* (Strictly matches the exact columns from user prompt)         */
        /* ------------------------------------------------------------- */
        <div className="card">
          <div className="card-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 className="card-title">
                <FileText size={18} color="#6366f1" />
                <span>Complete Student Marks Table ({filteredMarks.length} records)</span>
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                Preserves exact student USN, name, decimal marks, and ABSENT status
              </p>
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Search Bar */}
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search USN or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: "32px", width: "200px", height: "36px", fontSize: "0.85rem" }}
                />
              </div>

              {/* Semester Dropdown */}
              <select
                className="form-control"
                value="5"
                disabled
                style={{ width: "120px", height: "36px", fontSize: "0.85rem", opacity: 0.9 }}
              >
                <option value="5">5th Semester</option>
              </select>

              {/* Section Filter Dropdown */}
              <select
                className="form-control"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                style={{ width: "120px", height: "36px", fontSize: "0.85rem" }}
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>

              {/* Subject Selector Dropdown */}
              <select
                className="form-control"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={{ width: "190px", height: "36px", fontSize: "0.85rem" }}
              >
                <option value="">All Subjects (6)</option>
                {OFFICIAL_SUBJECT_LIST.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.short}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "120px", height: "36px", fontSize: "0.85rem" }}
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* TABLE MATCHING USER SPECIFICATION:
              | Sl. No. | USN | Student Name | Section | Subject Name | Subject Code | IA | Maximum Marks | Obtained Marks | Status |
          */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Sl. No.</th>
                  <th>USN</th>
                  <th>Student Name</th>
                  <th style={{ width: "70px", textAlign: "center" }}>Section</th>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th style={{ width: "70px", textAlign: "center" }}>IA</th>
                  <th style={{ textAlign: "right", width: "110px" }}>Maximum Marks</th>
                  <th style={{ textAlign: "right", width: "110px" }}>Obtained Marks</th>
                  <th style={{ textAlign: "center", width: "90px" }}>Status</th>
                  <th style={{ textAlign: "center", width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                      No student marks match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredMarks.map((m) => {
                    const isAb = m.is_absent || m.obtained_marks_display === "AB";
                    return (
                      <tr key={m.id} style={{ backgroundColor: isAb ? "rgba(239, 68, 68, 0.04)" : "transparent" }}>
                        <td style={{ color: "#94a3b8" }}>{m.sl_no}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#38bdf8" }}>
                          {m.usn}
                        </td>
                        <td style={{ fontWeight: 600, color: "#fff" }}>
                          {m.student_name}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge badge-purple" style={{ padding: "2px 8px" }}>
                            {m.section}
                          </span>
                        </td>
                        <td style={{ color: "#e2e8f0" }}>
                          {m.subject_name}
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: "rgba(99, 102, 241, 0.15)",
                              color: "#818cf8",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {m.subject_code}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                          {m.ia}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#cbd5e1" }}>
                          {m.maximum_marks}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isAb ? (
                            <span
                              style={{
                                color: "#f87171",
                                fontWeight: 800,
                                letterSpacing: "0.05em",
                                fontSize: "0.95rem",
                              }}
                            >
                              AB
                            </span>
                          ) : (
                            <strong style={{ color: "#fff", fontSize: "1rem" }}>
                              {m.obtained_marks_display || m.obtained_marks}
                            </strong>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isAb ? (
                            <span className="badge badge-danger" style={{ fontWeight: 800 }}>
                              ABSENT
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              Present
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              onClick={() => handleOpenEdit(m)}
                              title="Edit Marks"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              onClick={() => handleViewStudentReport(m.usn)}
                              title="View Student Card"
                            >
                              <GraduationCap size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ENTER / EDIT STUDENT MARKS                             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Enter / Edit Subject Marks"
        maxWidth="500px"
      >
        {editingMark && (
          <form onSubmit={handleSaveMarkEdit}>
            <div style={{ marginBottom: "1rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
                {editingMark.student_name}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.85rem", color: "#94a3b8" }}>
                <span>USN: <strong style={{ color: "#38bdf8", fontFamily: "monospace" }}>{editingMark.usn}</strong></span>
                <span>•</span>
                <span>Section: <strong style={{ color: "#fff" }}>{editingMark.section}</strong></span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                Subject: <strong style={{ color: "#818cf8" }}>{editingMark.subject_name} ({editingMark.subject_code})</strong>
              </div>
            </div>

            {/* Absent Toggle Checkbox */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: editForm.is_absent ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: editForm.is_absent ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: "1.25rem",
                cursor: "pointer",
              }}
              onClick={() => setEditForm({ ...editForm, is_absent: !editForm.is_absent })}
            >
              <input
                type="checkbox"
                checked={editForm.is_absent}
                onChange={(e) => setEditForm({ ...editForm, is_absent: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div>
                <label style={{ fontWeight: 700, color: editForm.is_absent ? "#f87171" : "#fff", cursor: "pointer" }}>
                  Mark Student as ABSENT (AB)
                </label>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Status will display as ABSENT and obtained marks will not be replaced with zero.
                </div>
              </div>
            </div>

            {/* Obtained Marks Input */}
            {!editForm.is_absent && (
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>First IA (IA-1) Obtained Marks *</span>
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                    Maximum: {editingMark.maximum_marks} (Decimals like 27.5 allowed)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={editingMark.maximum_marks}
                  className="form-control"
                  placeholder={`Enter score 0 - ${editingMark.maximum_marks}`}
                  value={editForm.obtained_marks}
                  onChange={(e) => setEditForm({ ...editForm, obtained_marks: e.target.value })}
                  required={!editForm.is_absent}
                />
              </div>
            )}

            {/* Optional IA-2 Marks Input */}
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Second IA (IA-2) Marks (Optional)</span>
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  Leave empty if IA-2 not yet conducted
                </span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={editingMark.maximum_marks}
                className="form-control"
                placeholder="Enter IA-2 score if available"
                value={editForm.ia2_obtained_marks}
                onChange={(e) => setEditForm({ ...editForm, ia2_obtained_marks: e.target.value })}
              />
            </div>

            {/* Evaluation Notes */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Notes / Remarks</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional remark or faculty note"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submittingEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingEdit}
              >
                {submittingEdit ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: IMPORT MARKS FROM ORIGINAL PDF                         */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Marks from Original PDF"
        maxWidth="500px"
      >
        <form onSubmit={handleImportPdf}>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Upload the official college IA marks PDF (e.g. <code>5th_SEM_A_SEC_1st_IA_Marks_List_2026.pdf</code> or Section B). The system will extract student USNs, names, subjects, and marks directly into the database.
          </p>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Target Section *</label>
            <select
              className="form-control"
              value={importSection}
              onChange={(e) => setImportSection(e.target.value)}
              required
            >
              <option value="A">Section A (66 students)</option>
              <option value="B">Section B (65 students)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label">Select PDF Document *</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="form-control"
              onChange={(e) => setImportFile(e.target.files[0] || null)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={importing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={importing}
            >
              {importing ? "Parsing PDF & Importing..." : "Start PDF Import"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

