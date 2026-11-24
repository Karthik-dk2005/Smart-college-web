import React, { useState, useEffect } from "react";
import { departmentsApi, facultyApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  UserCheck,
  Layers,
} from "lucide-react";

export default function Departments() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const canModify = ["admin", "hod"].includes(role?.toLowerCase());

  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    name: "",
    code: "",
    description: "",
    hod_id: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resDepts, resFac] = await Promise.all([
        departmentsApi.getAll(),
        facultyApi.getAll().catch(() => ({ data: [] })),
      ]);
      setDepartments(resDepts.data || resDepts || []);
      setFacultyList(resFac.data || resFac || []);
    } catch (err) {
      error(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await departmentsApi.create({
        ...formData,
        hod_id: formData.hod_id ? Number(formData.hod_id) : null,
      });
      success("Department created successfully!");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to create department");
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      hod_id: dept.hod_id ? String(dept.hod_id) : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await departmentsApi.update(selectedDept.id, {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        hod_id: formData.hod_id ? Number(formData.hod_id) : null,
      });
      success("Department updated successfully!");
      setIsEditOpen(false);
      setSelectedDept(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to update department");
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (dept) => {
    setSelectedDept(dept);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await departmentsApi.delete(selectedDept.id);
      success("Department deleted successfully");
      setIsDeleteOpen(false);
      setSelectedDept(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to delete department");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc" }}>Academic Departments</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            College branches, program codes, and HOD appointments
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
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Departments Grid Cards */}
      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : departments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <Building2 size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f8fafc" }}>No Departments Registered</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {departments.map((dept) => {
            const hod = facultyList.find((f) => f.id === dept.hod_id);

            return (
              <div
                key={dept.id}
                style={{
                  background: "rgba(17, 24, 39, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#c7d2fe",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {dept.code}
                    </span>

                    {canModify && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => openEdit(dept)}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "#f59e0b",
                            borderRadius: "6px",
                            padding: "0.35rem",
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => openDelete(dept)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            borderRadius: "6px",
                            padding: "0.35rem",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.85rem" }}>
                    {dept.name}
                  </h3>

                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem", lineHeight: 1.5 }}>
                    {dept.description || "Academic teaching department for undergraduate and graduate coursework."}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <UserCheck size={16} color="#818cf8" />
                  <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                    Head of Department: <strong style={{ color: "#f8fafc" }}>{hod ? hod.name : "Dr. Ranjit K.N"}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Department */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Department">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Information Science and Engineering"
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
              Department Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. ISE"
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
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of department programs..."
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
              }}
            />
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
              {formLoading ? "Creating..." : "Save Department"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Department */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Department: ${selectedDept?.code}`}>
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
              Code
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
              }}
            />
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
        title="Delete Department"
        message={`Are you sure you want to delete ${selectedDept?.name} (${selectedDept?.code})? This will affect all subjects and students under this branch.`}
      />
    </div>
  );
}
