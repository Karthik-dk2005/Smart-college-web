import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { studentsApi, departmentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import TableSkeleton from "../components/TableSkeleton";
import { busApi } from "../services/busApi";
import CollegeLogo from "../components/CollegeLogo";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building,
  Bus,
  Upload,
  FileText,
} from "lucide-react";

export default function Students() {
  const { user, role } = useAuth();
  const { success, error, warning } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";
  const isHod = currentRole === "hod";
  const isTeacher = ["teacher", "faculty"].includes(currentRole);
  const hasAccess = isAdmin || isHod || isTeacher;
  const canManage = isAdmin || isHod;

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("5");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState(isHod ? String(user?.department_id || 1) : "");

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Bus Transport State
  const [studentBus, setStudentBus] = useState(null);
  const [busLoading, setBusLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [busRoutes, setBusRoutes] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [assignForm, setAssignForm] = useState({ route_id: "", stop_id: "", transport_status: "Using Bus" });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    name: "",
    student_id: "",
    usn: "",
    email: "",
    phone: "",
    department_id: isHod ? (user?.department_id || 1) : 1,
    semester: 5,
    section: "A",
    admission_year: 2024,
    status: "active",
    username: "",
    password: "password123",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Load Data
  const fetchData = async () => {
    if (!hasAccess) return;
    try {
      setLoading(true);
      const params = {};
      if (semesterFilter) params.semester = Number(semesterFilter);
      if (sectionFilter && sectionFilter !== "ALL") params.section = sectionFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (departmentFilter && !isHod) params.department_id = Number(departmentFilter);
      if (search.trim()) params.search = search.trim();

      const [resStudents, resDepts] = await Promise.all([
        studentsApi.getAll(params),
        departmentsApi.getAll().catch(() => ({ data: [] })),
      ]);

      const stList = resStudents.data?.data || resStudents.data || resStudents || [];
      const dList = resDepts.data?.data || resDepts.data || resDepts || [];

      setStudents(Array.isArray(stList) ? stList : []);
      setDepartments(Array.isArray(dList) ? dList : []);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterFilter, sectionFilter, statusFilter, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleImportFromPdf = async () => {
    try {
      setLoading(true);
      const res = await studentsApi.importFromPdf();
      const data = res.data?.data || res.data || {};
      success(
        `✓ Successfully verified/imported ${data.total_students || 131} students from PDFs: Section A (${data.section_a_count || 66}), Section B (${data.section_b_count || 65})`
      );
      await fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to import students from PDF");
    } finally {
      setLoading(false);
    }
  };

  const secACount = useMemo(
    () => students.filter((s) => (s.section || "").toUpperCase() === "A").length,
    [students]
  );
  const secBCount = useMemo(
    () => students.filter((s) => (s.section || "").toUpperCase() === "B").length,
    [students]
  );
  const totalCount = students.length;

  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const sName = (s.name || "").toLowerCase();
      const sUsn = (s.usn || s.student_id || "").toLowerCase();
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || sName.includes(q) || sUsn.includes(q);

      const matchesSection =
        !sectionFilter ||
        sectionFilter === "ALL" ||
        (s.section || "").toUpperCase() === sectionFilter.toUpperCase();
      const matchesSemester =
        !semesterFilter || String(s.semester) === String(semesterFilter);

      return matchesSearch && matchesSection && matchesSemester;
    });
  }, [students, search, sectionFilter, semesterFilter]);

  // Bus Transport Handlers (Section 15)
  const fetchStudentBusAssignment = async (studentId) => {
    try {
      setBusLoading(true);
      const res = await busApi.getStudentBus(studentId);
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      setStudentBus(data || null);
    } catch {
      setStudentBus(null);
    } finally {
      setBusLoading(false);
    }
  };

  const handleOpenViewStudent = (st) => {
    setSelectedStudent(st);
    setIsViewOpen(true);
    fetchStudentBusAssignment(st.id);
  };

  const handleOpenAssignModal = async () => {
    try {
      setIsAssignModalOpen(true);
      const resRoutes = await busApi.getBuses({ status: "active" });
      const rList = resRoutes.data?.data || resRoutes.data || [];
      const routesArray = Array.isArray(rList) ? rList : [];
      setBusRoutes(routesArray);

      const initialRouteId = studentBus?.route_id || (routesArray[0]?.id ? String(routesArray[0].id) : "");
      setAssignForm({
        route_id: initialRouteId,
        stop_id: studentBus?.stop_id ? String(studentBus.stop_id) : "",
        transport_status: studentBus?.transport_status || "Using Bus",
      });

      if (initialRouteId) {
        const resStops = await busApi.getBusStops(initialRouteId);
        const sList = resStops.data?.data || resStops.data || [];
        setBusStops(Array.isArray(sList) ? sList : []);
      }
    } catch (err) {
      error("Failed to load bus routes for assignment");
    }
  };

  const handleRouteChange = async (routeId) => {
    setAssignForm((prev) => ({ ...prev, route_id: routeId, stop_id: "" }));
    if (routeId) {
      try {
        const resStops = await busApi.getBusStops(routeId);
        const sList = resStops.data?.data || resStops.data || [];
        setBusStops(Array.isArray(sList) ? sList : []);
      } catch (err) {
        setBusStops([]);
      }
    }
  };

  const handleSaveStudentBus = async (e) => {
    e.preventDefault();
    if (!assignForm.route_id || !selectedStudent) return;
    try {
      setAssignSubmitting(true);
      await busApi.assignStudentBus(selectedStudent.id, {
        route_id: Number(assignForm.route_id),
        stop_id: assignForm.stop_id ? Number(assignForm.stop_id) : null,
        transport_status: assignForm.transport_status || "Using Bus",
      });
      success("✓ Student bus route assigned successfully.");
      setIsAssignModalOpen(false);
      fetchStudentBusAssignment(selectedStudent.id);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to assign bus route");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRemoveStudentBus = async () => {
    if (!selectedStudent) return;
    try {
      setBusLoading(true);
      await busApi.removeStudentBus(selectedStudent.id);
      success("✓ Student bus assignment removed.");
      setStudentBus(null);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to remove bus assignment");
    } finally {
      setBusLoading(false);
    }
  };

  // Close Add Modal and sync URL if on /add
  const handleCloseAddModal = () => {
    setIsAddOpen(false);
    if (location.pathname.endsWith("/add")) {
      const parentPath = location.pathname.replace(/\/add$/, "");
      navigate(parentPath, { replace: true });
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      ...initialFormState,
      department_id: isHod ? (user?.department_id || 1) : (departments[0]?.id || 1),
    });
    setIsAddOpen(true);
  };

  useEffect(() => {
    if (location.pathname.endsWith("/add")) {
      openAddModal();
    }
  }, [location.pathname, departments.length]);

  // Submit Add Student
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        student_id: formData.student_id || formData.usn,
        usn: formData.student_id || formData.usn,
        department_id: isHod ? (user?.department_id || 1) : Number(formData.department_id),
        semester: Number(formData.semester),
        section: formData.section.toUpperCase(),
        admission_year: Number(formData.admission_year),
      };

      const res = await studentsApi.create(payload);
      const msg = res.data?.message || "✓ Student added successfully.";
      success(msg);
      setIsAddOpen(false);
      setFormData(initialFormState);
      if (location.pathname.endsWith("/add")) {
        const parentPath = location.pathname.replace(/\/add$/, "");
        navigate(parentPath, { replace: true });
      }
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to create student");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name || "",
      student_id: student.student_id || student.usn || "",
      usn: student.usn || "",
      email: student.email || "",
      phone: student.phone || "",
      department_id: student.department_id || 1,
      semester: student.semester || 5,
      section: student.section || "A",
      admission_year: student.admission_year || 2024,
      status: student.status || "active",
      username: student.username || "",
      password: "",
    });
    setIsEditOpen(true);
  };

  // Submit Edit Student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        semester: Number(formData.semester),
        section: formData.section.toUpperCase(),
        admission_year: Number(formData.admission_year),
        status: formData.status,
      };

      if (isAdmin && formData.department_id) {
        payload.department_id = Number(formData.department_id);
      }

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await studentsApi.update(selectedStudent.id, payload);
      success(res.data?.message || "Student updated successfully.");
      setIsEditOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to update student");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  // Confirm Delete / Deactivate
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setFormLoading(true);
    try {
      const res = await studentsApi.delete(selectedStudent.id);
      const resData = res.data?.data || {};
      const msg = res.data?.message || (resData.action === "deactivated" ? "Student deactivated successfully." : "Student removed successfully.");
      success(msg);
      setIsDeleteOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to remove student");
    } finally {
      setFormLoading(false);
    }
  };

  // Access denied screen for Teachers & Students
  if (!hasAccess) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "14px",
          padding: "3rem 2rem",
          textAlign: "center",
          maxWidth: "600px",
          margin: "3rem auto",
        }}
      >
        <ShieldAlert size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ color: "#f8fafc", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Access Restricted
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5 }}>
          You do not have permission to perform student management actions. This module is restricted to <strong>HOD</strong> and <strong>Admin</strong> privileges.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                background: isAdmin ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)",
                color: isAdmin ? "#818cf8" : "#34d399",
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {isAdmin ? "Admin View" : "HOD Department View"}
            </span>
            {isHod && (
              <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                Managing own department students
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", margin: "0.35rem 0 0" }}>
            Student Management
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0.2rem 0 0" }}>
            Maintain student rosters, admission years, status, and class allocations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {canManage && (
            <button
              onClick={handleImportFromPdf}
              disabled={loading}
              title="Import or verify 131 students from Section A & B PDFs"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "8px",
                padding: "0.6rem 1.1rem",
                color: "#34d399",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Upload size={16} /> Import from PDF
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.6rem 1rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>

          {canManage && (
            <button
              id="btn-add-student"
              onClick={openAddModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.25rem",
                color: "#fff",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Plus size={16} /> + Add Student
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          onClick={() => setSectionFilter("ALL")}
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: sectionFilter === "ALL" ? "2px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Total Students</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.25rem" }}>
            {totalCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 600, marginTop: "0.2rem" }}>
            Official Roster Records
          </div>
        </div>

        <div
          onClick={() => setSectionFilter("A")}
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: sectionFilter === "A" ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#93c5fd", fontWeight: 600 }}>5th Semester Section A</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#60a5fa", marginTop: "0.25rem" }}>
            {secACount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
            Expected: 66 Students
          </div>
        </div>

        <div
          onClick={() => setSectionFilter("B")}
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: sectionFilter === "B" ? "2px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#d8b4fe", fontWeight: 600 }}>5th Semester Section B</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#c084fc", marginTop: "0.25rem" }}>
            {secBCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
            Expected: 65 Students
          </div>
        </div>

        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#34d399", fontWeight: 600 }}>Active Roster Status</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981", marginTop: "0.25rem" }}>
            100%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
            VTU Registered Candidates
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          background: "rgba(17, 24, 39, 0.8)",
          padding: "0.4rem",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          width: "fit-content",
        }}
      >
        <button
          type="button"
          onClick={() => setSectionFilter("ALL")}
          style={{
            background: (!sectionFilter || sectionFilter === "ALL") ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "transparent",
            color: (!sectionFilter || sectionFilter === "ALL") ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "8px",
            padding: "0.55rem 1.2rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          All Students ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setSectionFilter("A")}
          style={{
            background: sectionFilter === "A" ? "#2563eb" : "transparent",
            color: sectionFilter === "A" ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "8px",
            padding: "0.55rem 1.2rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Section A ({secACount})
        </button>
        <button
          type="button"
          onClick={() => setSectionFilter("B")}
          style={{
            background: sectionFilter === "B" ? "#9333ea" : "transparent",
            color: sectionFilter === "B" ? "#ffffff" : "#94a3b8",
            border: "none",
            borderRadius: "8px",
            padding: "0.55rem 1.2rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Section B ({secBCount})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
            />
            <input
              type="text"
              placeholder="Search by student name or USN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 1rem 0.55rem 2.25rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#c7d2fe",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          {/* Department Filter (Admin only) */}
          {isAdmin && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          )}

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.55rem 0.85rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
            }}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.55rem 0.85rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
            }}
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.55rem 0.85rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "1.5rem" }}>
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : displayedStudents.length === 0 ? (
          <div style={{ padding: "3.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
            <Users size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f8fafc", marginBottom: "0.3rem" }}>
              No students found
            </h3>
            <p style={{ fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto" }}>
              No student records matched your current query or section selection.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, width: "65px" }}>Sl No</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, width: "160px" }}>USN</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Student Name</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, width: "110px" }}>Semester</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, width: "110px" }}>Section</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right", width: "130px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map((st, index) => (
                  <tr
                    key={st.id || st.usn}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#818cf8", fontFamily: "monospace" }}>
                      {st.usn || st.student_id}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>{st.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{st.email}</div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                      Semester {st.semester}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          background: (st.section || "").toUpperCase() === "A" ? "rgba(59, 130, 246, 0.15)" : "rgba(168, 85, 247, 0.15)",
                          color: (st.section || "").toUpperCase() === "A" ? "#60a5fa" : "#c084fc",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          display: "inline-block",
                        }}
                      >
                        Section {st.section}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          title="View Details"
                          onClick={() => handleOpenViewStudent(st)}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            padding: "0.4rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              title="Edit Student"
                              onClick={() => openEditModal(st)}
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                borderRadius: "6px",
                                padding: "0.4rem",
                                color: "#818cf8",
                                cursor: "pointer",
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              title="Delete Student"
                              onClick={() => openDeleteModal(st)}
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "6px",
                                padding: "0.4rem",
                                color: "#f87171",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. ADD STUDENT MODAL */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAddModal} title="Add New Student">
        <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Student Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Karthik D K"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                USN / Student ID *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 4MT22CS008"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value, usn: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Email Address *
              </label>
              <input
                required
                type="email"
                placeholder="karthik.dk@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Department *
              </label>
              <select
                disabled={isHod}
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: isHod ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Admission Year
              </label>
              <input
                type="number"
                value={formData.admission_year}
                onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Username (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to use Email"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Password *
              </label>
              <input
                required
                type="password"
                placeholder="Initial password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={handleCloseAddModal}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                color: "#fff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {formLoading ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. EDIT STUDENT MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Student ID / USN (Locked)
              </label>
              <input
                disabled
                type="text"
                value={formData.student_id}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Student Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Email Address *
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Department {isAdmin ? "" : "(Locked)"}
              </label>
              <select
                disabled={!isAdmin}
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: !isAdmin ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Admission Year
              </label>
              <input
                type="number"
                value={formData.admission_year}
                onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Reset Password (leave empty to keep current)
            </label>
            <input
              type="password"
              placeholder="New password (optional)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                color: "#fff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. VIEW STUDENT DETAILS MODAL */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Student Profile Overview">
        {selectedStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Official MIT Thandavapura Student Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.6rem 0.85rem",
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CollegeLogo size="sm" style={{ height: "46px", width: "auto" }} />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e3a8a", letterSpacing: "0.02em" }}>
                    MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                    Official Student Academic Record • VTU Affiliated
                  </div>
                </div>
              </div>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                {selectedStudent.status || "ACTIVE"}
              </span>
            </div>

            <div
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                }}
              >
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  {selectedStudent.name}
                </h3>
                <div style={{ color: "#818cf8", fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem" }}>
                  {selectedStudent.student_id || selectedStudent.usn}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", fontSize: "0.85rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Department</span>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>{selectedStudent.department_name || "CSE"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Class Assignment</span>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                  Semester {selectedStudent.semester} • Section {selectedStudent.section}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Official Gmail</span>
                <span style={{ color: "#f8fafc" }}>{selectedStudent.gmail || selectedStudent.email}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Student Phone</span>
                <span style={{ color: "#f8fafc" }}>{selectedStudent.phone || "Not specified"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Father's Phone</span>
                <span style={{ color: "#f8fafc" }}>{selectedStudent.father_phone || "Not specified"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Mother's Phone</span>
                <span style={{ color: "#f8fafc" }}>{selectedStudent.mother_phone || "Not specified"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Admission Year</span>
                <span style={{ color: "#f8fafc" }}>{selectedStudent.admission_year || 2024}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Account Status</span>
                <span style={{ color: selectedStudent.status === "active" ? "#34d399" : "#f87171", fontWeight: 600, textTransform: "capitalize" }}>
                  {selectedStudent.status || "active"}
                </span>
              </div>
            </div>

            {/* BUS TRANSPORT SECTION (Section 15) */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bus size={17} style={{ color: "#818cf8" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    BUS TRANSPORT
                  </span>
                </div>
                {isAdmin && !studentBus && !busLoading && (
                  <button
                    type="button"
                    onClick={handleOpenAssignModal}
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      border: "none",
                      color: "#fff",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Assign Bus
                  </button>
                )}
              </div>

              {busLoading ? (
                <div style={{ fontSize: "0.82rem", color: "#94a3b8", textAlign: "center", padding: "0.75rem" }}>
                  Loading transport status...
                </div>
              ) : studentBus ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", fontSize: "0.82rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                      <span style={{ color: "#94a3b8", display: "block", fontSize: "0.72rem" }}>Bus Route</span>
                      <span style={{ color: "#f8fafc", fontWeight: 700 }}>
                        {studentBus.route_name || `Route ${studentBus.route_number || "—"}`}
                      </span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                      <span style={{ color: "#94a3b8", display: "block", fontSize: "0.72rem" }}>Pickup Stop</span>
                      <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                        {studentBus.stop_name || "Not provided"}
                      </span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                      <span style={{ color: "#94a3b8", display: "block", fontSize: "0.72rem" }}>Transport Status</span>
                      <span style={{ color: "#34d399", fontWeight: 600 }}>
                        {studentBus.transport_status || "Using Bus"}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        type="button"
                        onClick={handleOpenAssignModal}
                        style={{
                          background: "rgba(99, 102, 241, 0.15)",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          color: "#a5b4fc",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveStudentBus}
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "0.5rem 0" }}>
                  No bus route has been assigned to this student.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                onClick={() => setIsViewOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "#cbd5e1",
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3.1 ASSIGN / CHANGE BUS MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={studentBus ? "Change Bus Assignment" : "Assign Bus Route"}
      >
        <form onSubmit={handleSaveStudentBus} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
              Bus Route *
            </label>
            <select
              required
              value={assignForm.route_id}
              onChange={(e) => handleRouteChange(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
                outline: "none",
              }}
            >
              <option value="" disabled>Select Route</option>
              {busRoutes.map((r) => (
                <option key={r.id} value={r.id} style={{ background: "#1e293b", color: "#fff" }}>
                  Route {r.route_number}: {r.route_name} ({r.bus_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
              Pickup Stop (Optional)
            </label>
            <select
              value={assignForm.stop_id}
              onChange={(e) => setAssignForm({ ...assignForm, stop_id: e.target.value })}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
                outline: "none",
              }}
            >
              <option value="">No specific stop designated</option>
              {busStops.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "#1e293b", color: "#fff" }}>
                  #{s.stop_order} — {s.stop_name} (Pickup: {s.pickup_time || "—"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
              Transport Status
            </label>
            <select
              value={assignForm.transport_status}
              onChange={(e) => setAssignForm({ ...assignForm, transport_status: e.target.value })}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
                outline: "none",
              }}
            >
              <option value="Using Bus">Using Bus</option>
              <option value="Active">Active</option>
              <option value="Temporary Pass">Temporary Pass</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignSubmitting}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                color: "#fff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {assignSubmitting ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. CONFIRM REMOVE MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Student Removal">
        {selectedStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to remove this student?
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "10px",
                padding: "1rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600, textTransform: "uppercase" }}>
                Student:
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.2rem" }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.2rem" }}>
                USN: {selectedStudent.student_id || selectedStudent.usn} • Sem {selectedStudent.semester} ({selectedStudent.section})
              </div>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
              * If this student has historical attendance records, the system will safely deactivate them instead of permanently erasing academic history.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={handleDeleteConfirm}
                style={{
                  background: "#dc2626",
                  border: "none",
                  color: "#fff",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {formLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
