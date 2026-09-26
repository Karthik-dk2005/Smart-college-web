import React, { useState, useEffect } from "react";
import { subjectsApi, departmentsApi, facultyApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Award,
  Layers,
  User,
} from "lucide-react";

export default function Subjects() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const canModify = ["admin", "hod"].includes(role?.toLowerCase());

  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("5"); // Default 5th sem

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    subject_code: "",
    subject_name: "",
    credits: 4,
    semester: 5,
    department_id: 1,
    faculty_id: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (semesterFilter) params.semester = Number(semesterFilter);

      const [resSubjects, resDepts, resFac] = await Promise.all([
        subjectsApi.getAll(params),
        departmentsApi.getAll().catch(() => ({ data: [] })),
        facultyApi.getAll().catch(() => ({ data: [] })),
      ]);

      setSubjects(resSubjects.data || resSubjects || []);
      setDepartments(resDepts.data || resDepts || []);
      setFacultyList(resFac.data || resFac || []);
    } catch (err) {
      error(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await subjectsApi.create({
        ...formData,
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        department_id: Number(formData.department_id),
        faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null,
      });
      success("Subject registered successfully!");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to create subject");
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (sub) => {
    setSelectedSubject(sub);
    setFormData({
      subject_code: sub.subject_code,
      subject_name: sub.subject_name,
      credits: sub.credits,
      semester: sub.semester,
      department_id: sub.department_id || 1,
      faculty_id: sub.faculty_id ? String(sub.faculty_id) : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await subjectsApi.update(selectedSubject.id, {
        subject_name: formData.subject_name,
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        department_id: Number(formData.department_id),
        faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null,
      });
      success("Subject updated successfully!");
      setIsEditOpen(false);
      setSelectedSubject(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to update subject");
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (sub) => {
    setSelectedSubject(sub);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await subjectsApi.delete(selectedSubject.id);
      success("Subject deleted successfully");
      setIsDeleteOpen(false);
      setSelectedSubject(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to delete subject");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.subject_code.toLowerCase().includes(q) || s.subject_name.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc" }}>Subject Courses</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Academic syllabus, course credits, and assigned teaching faculty
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
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject code or title..."
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

        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          style={{
            padding: "0.55rem 0.75rem",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "#f8fafc",
            fontSize: "0.85rem",
            outline: "none",
          }}
        >
          <option value="" style={{ background: "#111827" }}>All Semesters</option>
          <option value="5" style={{ background: "#111827" }}>Semester 5 (Active)</option>
          <option value="6" style={{ background: "#111827" }}>Semester 6</option>
        </select>
      </div>

      {/* Subjects Table */}
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
        ) : filteredSubjects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f8fafc" }}>No Subjects Found</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)" }}>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Code</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Subject Title</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Credits</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Semester</th>
                  <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600 }}>Assigned Faculty</th>
                  {canModify && (
                    <th style={{ padding: "1rem 1.25rem", color: "#94a3b8", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((sub) => {
                  const fac = facultyList.find((f) => f.id === sub.faculty_id);

                  return (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#38bdf8" }}>
                        {sub.subject_code}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#f8fafc" }}>
                        {sub.subject_name}
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span
                          style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {sub.credits} Credits
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", color: "#cbd5e1" }}>
                        Semester {sub.semester}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", color: "#94a3b8" }}>
                        {fac ? fac.name : "Unassigned"}
                      </td>
                      {canModify && (
                        <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => openEdit(sub)}
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
                              onClick={() => openDelete(sub)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Subject */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Subject Course">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.subject_code}
                onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                placeholder="e.g. 21CS51"
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
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                placeholder="e.g. Software Engineering & Project Management"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Credits *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
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
                Semester *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
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
              Assigned Faculty
            </label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
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
              <option value="" style={{ background: "#111827" }}>Select Faculty...</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id} style={{ background: "#111827" }}>
                  {f.name} ({f.designation})
                </option>
              ))}
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
              {formLoading ? "Creating..." : "Save Subject"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Subject */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Subject: ${selectedSubject?.subject_code}`}>
        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Course Title
            </label>
            <input
              type="text"
              required
              value={formData.subject_name}
              onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
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
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
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
                Semester
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
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
              Assigned Faculty
            </label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
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
              <option value="" style={{ background: "#111827" }}>Select Faculty...</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id} style={{ background: "#111827" }}>
                  {f.name} ({f.designation})
                </option>
              ))}
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

      {/* Confirmation Dialog: Delete */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={formLoading}
        title="Delete Subject Course"
        message={`Are you sure you want to remove ${selectedSubject?.subject_name} (${selectedSubject?.subject_code})? This will also remove timetable slots associated with this subject.`}
      />
    </div>
  );
}
