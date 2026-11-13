import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { teachersApi, departmentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import TableSkeleton from "../components/TableSkeleton";
import CollegeLogo from "../components/CollegeLogo";
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building,
} from "lucide-react";

export default function Teachers() {
  const { user, role } = useAuth();
  const { success, error, warning } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";
  const isHod = currentRole === "hod";
  const hasAccess = isAdmin || isHod;

  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState(isHod ? String(user?.department_id || 1) : "");

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    name: "",
    employee_id: "",
    email: "",
    phone: "",
    department_id: isHod ? (user?.department_id || 1) : 1,
    designation: "Assistant Professor",
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
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (departmentFilter && !isHod) params.department_id = Number(departmentFilter);
      if (search.trim()) params.search = search.trim();

      const [resTeachers, resDepts] = await Promise.all([
        teachersApi.getAll(params),
        departmentsApi.getAll().catch(() => ({ data: [] })),
      ]);

      const tList = resTeachers.data?.data || resTeachers.data || resTeachers || [];
      const dList = resDepts.data?.data || resDepts.data || resDepts || [];

      setTeachers(Array.isArray(tList) ? tList : []);
      setDepartments(Array.isArray(dList) ? dList : []);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
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

  // Submit Add Teacher
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        employee_id: formData.employee_id.trim().toUpperCase(),
        department_id: isHod ? (user?.department_id || 1) : Number(formData.department_id),
      };

      const res = await teachersApi.create(payload);
      const msg = res.data?.message || "✓ Teacher added successfully.";
      success(msg);
      setIsAddOpen(false);
      setFormData(initialFormState);
      if (location.pathname.endsWith("/add")) {
        const parentPath = location.pathname.replace(/\/add$/, "");
        navigate(parentPath, { replace: true });
      }
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to create teacher");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      employee_id: teacher.employee_id || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      department_id: teacher.department_id || 1,
      designation: teacher.designation || "Assistant Professor",
      status: teacher.status || "active",
      username: teacher.username || "",
      password: "",
    });
    setIsEditOpen(true);
  };

  // Submit Edit Teacher
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        status: formData.status,
      };

      if (isAdmin && formData.department_id) {
        payload.department_id = Number(formData.department_id);
      }

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await teachersApi.update(selectedTeacher.id, payload);
      success(res.data?.message || "Teacher updated successfully.");
      setIsEditOpen(false);
      setSelectedTeacher(null);
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to update teacher");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  // Confirm Delete / Deactivate
  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;
    setFormLoading(true);
    try {
      const res = await teachersApi.delete(selectedTeacher.id);
      const resData = res.data?.data || {};
      const msg = res.data?.message || (resData.action === "deactivated" ? "Teacher deactivated successfully." : "Teacher removed successfully.");
      success(msg);
      setIsDeleteOpen(false);
      setSelectedTeacher(null);
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to remove teacher");
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
          You do not have permission to perform teacher management actions. This module is restricted to <strong>HOD</strong> and <strong>Admin</strong> privileges.
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
                Managing own department faculty & teachers
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", margin: "0.35rem 0 0" }}>
            Teacher Management
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0.2rem 0 0" }}>
            Manage faculty records, employee designations, department allocations, and credentials.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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

          <button
            id="btn-add-teacher"
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
            <Plus size={16} /> + Add Teacher
          </button>
        </div>
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
              placeholder="Search by name / employee ID / email..."
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

      {/* Teachers Data Table */}
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
        ) : teachers.length === 0 ? (
          <div style={{ padding: "3.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
            <GraduationCap size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f8fafc", marginBottom: "0.3rem" }}>
              No teachers found
            </h3>
            <p style={{ fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto" }}>
              No teacher records matched your query. Use "+ Add Teacher" to register new faculty members.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Employee ID</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Department</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Designation</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#818cf8" }}>
                      {t.employee_id}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>{t.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.email}</div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                      {t.department_name || "CSE"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                      {t.designation || "Assistant Professor"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          background: t.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: t.status === "active" ? "#34d399" : "#f87171",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        {t.status === "active" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {t.status || "active"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          title="View Details"
                          onClick={() => {
                            setSelectedTeacher(t);
                            setIsViewOpen(true);
                          }}
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
                        <button
                          title="Edit Teacher"
                          onClick={() => openEditModal(t)}
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
                          title="Remove Teacher"
                          onClick={() => openDeleteModal(t)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. ADD TEACHER MODAL */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAddModal} title="Add New Teacher">
        <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Teacher Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Employee ID *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. FAC-CSE-002"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
                placeholder="rajesh.kumar@faculty.campus.edu"
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
                placeholder="+91 98765 10002"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                Designation *
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Professor & Head of Department">Professor & Head of Department</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
                <option value="Lab Instructor">Lab Instructor</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Initial Password *
            </label>
            <input
              required
              type="password"
              placeholder="Initial password for login"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
            />
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
              {formLoading ? "Adding..." : "Add Teacher"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. EDIT TEACHER MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Teacher Profile">
        <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Employee ID (Locked)
              </label>
              <input
                disabled
                type="text"
                value={formData.employee_id}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Teacher Name *
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                Designation *
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Professor & Head of Department">Professor & Head of Department</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
                <option value="Lab Instructor">Lab Instructor</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Reset Password (optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: "100%", padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
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

      {/* 3. VIEW TEACHER MODAL */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Teacher Profile Overview">
        {selectedTeacher && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Official MIT Thandavapura Faculty Header */}
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
                    Official Faculty Credentials • Department of CSE
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
                {selectedTeacher.status || "ACTIVE"}
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
                {selectedTeacher.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  {selectedTeacher.name}
                </h3>
                <div style={{ color: "#818cf8", fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem" }}>
                  {selectedTeacher.employee_id} • {selectedTeacher.designation}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", fontSize: "0.85rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Department</span>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>{selectedTeacher.department_name || "CSE"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Designation</span>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>{selectedTeacher.designation}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Email</span>
                <span style={{ color: "#f8fafc" }}>{selectedTeacher.email}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Phone</span>
                <span style={{ color: "#f8fafc" }}>{selectedTeacher.phone || "Not specified"}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Account Status</span>
                <span style={{ color: selectedTeacher.status === "active" ? "#34d399" : "#f87171", fontWeight: 600, textTransform: "capitalize" }}>
                  {selectedTeacher.status || "active"}
                </span>
              </div>
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

      {/* 4. CONFIRM REMOVE MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Teacher Removal">
        {selectedTeacher && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to remove this teacher?
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
                Teacher:
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.2rem" }}>
                {selectedTeacher.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.2rem" }}>
                ID: {selectedTeacher.employee_id} • {selectedTeacher.designation} ({selectedTeacher.department_name || "CSE"})
              </div>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
              * If this teacher has active timetable slots or conducted attendance records, they will be safely deactivated to protect timetable history.
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
