import React, { useState, useEffect } from "react";
import { facultyApi, departmentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  Building2,
} from "lucide-react";

export default function Faculty() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const canModify = ["admin", "hod"].includes(role?.toLowerCase());

  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const initialFormState = {
    employee_id: "",
    name: "",
    email: "",
    phone: "",
    designation: "Assistant Professor",
    department_id: 1,
    password: "password123",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;

      const [resFaculty, resDepts] = await Promise.all([
        facultyApi.getAll(params),
        departmentsApi.getAll().catch(() => ({ data: [] })),
      ]);

      setFacultyList(resFaculty.data || resFaculty || []);
      setDepartments(resDepts.data || resDepts || []);
    } catch (err) {
      error(err.message || "Failed to load faculty records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Create Faculty
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await facultyApi.create(formData);
      success("Faculty registered successfully!");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to register faculty");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Faculty
  const openEdit = (fac) => {
    setSelectedFaculty(fac);
    setFormData({
      employee_id: fac.employee_id,
      name: fac.name,
      email: fac.email,
      phone: fac.phone || "",
      designation: fac.designation,
      department_id: fac.department_id || 1,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await facultyApi.update(selectedFaculty.id, {
        name: formData.name,
        phone: formData.phone,
        designation: formData.designation,
        department_id: Number(formData.department_id),
      });
      success("Faculty updated successfully!");
      setIsEditOpen(false);
      setSelectedFaculty(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to update faculty member");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Faculty
  const openDelete = (fac) => {
    setSelectedFaculty(fac);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await facultyApi.delete(selectedFaculty.id);
      success("Faculty removed successfully");
      setIsDeleteOpen(false);
      setSelectedFaculty(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to delete faculty member");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc" }}>Faculty Management</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Academic teaching staff, designations, and departmental appointments
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.6rem 0.9rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          {canModify && (
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsCreateOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#6366f1",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.1rem",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
              }}
            >
              <Plus size={16} />
              <span>Add Faculty</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by employee ID, name, or email..."
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem 0.55rem 2.3rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0.55rem 1.25rem",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Faculty Table */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : facultyList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f8fafc" }}>No Faculty Found</div>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Add teaching faculty members to assign subject courses and attendance.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Employee ID</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Faculty Name</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Designation</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Phone</th>
                  {canModify && (
                    <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {facultyList.map((fac) => (
                  <tr
                    key={fac.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#a855f7" }}>
                      {fac.employee_id}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#f8fafc" }}>
                      {fac.name}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#cbd5e1" }}>
                      {fac.email}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span
                        style={{
                          background: "rgba(168, 85, 247, 0.15)",
                          color: "#e9d5ff",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {fac.designation}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#94a3b8" }}>
                      {fac.phone || "—"}
                    </td>
                    {canModify && (
                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            title="Edit Faculty"
                            onClick={() => openEdit(fac)}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: "#f59e0b",
                              borderRadius: "6px",
                              padding: "0.4rem",
                              cursor: "pointer",
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            title="Delete Faculty"
                            onClick={() => openDelete(fac)}
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              borderRadius: "6px",
                              padding: "0.4rem",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Faculty */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Faculty Member">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Employee ID *
            </label>
            <input
              type="text"
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              placeholder="e.g. FAC-CSE-010"
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Rajesh Kumar"
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="faculty@campus.edu"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91..."
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Designation *
            </label>
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="Assistant Professor" style={{ background: "#111827" }}>Assistant Professor</option>
              <option value="Associate Professor" style={{ background: "#111827" }}>Associate Professor</option>
              <option value="Professor" style={{ background: "#111827" }}>Professor</option>
              <option value="Professor & Head of Department" style={{ background: "#111827" }}>Professor & Head of Department</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#6366f1",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: formLoading ? "not-allowed" : "pointer",
              }}
            >
              {formLoading ? "Saving..." : "Register Faculty"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Faculty */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Faculty: ${selectedFaculty?.employee_id}`}>
        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Designation
            </label>
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="Assistant Professor" style={{ background: "#111827" }}>Assistant Professor</option>
              <option value="Associate Professor" style={{ background: "#111827" }}>Associate Professor</option>
              <option value="Professor" style={{ background: "#111827" }}>Professor</option>
              <option value="Professor & Head of Department" style={{ background: "#111827" }}>Professor & Head of Department</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#6366f1",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: formLoading ? "not-allowed" : "pointer",
              }}
            >
              {formLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog: Delete Faculty */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={formLoading}
        title="Remove Faculty Member"
        message={`Are you sure you want to delete ${selectedFaculty?.name} (${selectedFaculty?.employee_id})? This will unassign any subjects handled by them.`}
      />
    </div>
  );
}
