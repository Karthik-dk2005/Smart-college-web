import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import usersApi from "../api/users";
import departmentsApi from "../api/departments";
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  Edit2,
  Shield,
  Building2,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function UserManagement() {
  const { user: currentUser, role: userRole } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create / Edit Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [targetUserId, setTargetUserId] = useState(null);

  // Form State for User Creation
  const [createForm, setCreateForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    mobile_number: "",
    usn_or_employee_id: "",
    role: "student",
    department_id: "",
    semester: 5,
    section: "A",
    designation: "Assistant Professor",
    account_status: "Approved",
  });

  const isAdmin = (userRole || "").toLowerCase() === "admin";
  const isHOD = (userRole || "").toLowerCase() === "hod";

  const fetchUsersAndDepts = async () => {
    try {
      setRefreshing(true);
      const [usersRes, deptsRes] = await Promise.all([
        usersApi.getAll(),
        departmentsApi.getAll(),
      ]);

      const userList = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersRes)
        ? usersRes
        : [];
      setUsers(userList);

      const deptList = Array.isArray(deptsRes.data)
        ? deptsRes.data
        : Array.isArray(deptsRes)
        ? deptsRes
        : [];
      setDepartments(deptList);

      if (deptList.length > 0 && !createForm.department_id) {
        // If HOD, default to HOD's department
        const defaultDept = isHOD && currentUser?.department_id
          ? currentUser.department_id
          : deptList[0].id;
        setCreateForm((prev) => ({ ...prev, department_id: defaultDept }));
      }
    } catch (err) {
      error(err.response?.data?.detail || "Failed to load users list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, [userRole]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const usn = (u.usn_or_employee_id || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        username.includes(query) ||
        usn.includes(query) ||
        email.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (u.account_status || "Approved").toLowerCase() === statusFilter.toLowerCase();

      const matchesRole =
        roleFilter === "all" ||
        (u.role || "").toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  // Counts
  const pendingCount = useMemo(() => {
    return users.filter(
      (u) => (u.account_status || "").toLowerCase() === "pending"
    ).length;
  }, [users]);

  // Approve User Action
  const handleApprove = async (userId) => {
    setActionLoading(true);
    try {
      await usersApi.approve(userId, { status: "Approved" });
      success("User account approved successfully!");
      fetchUsersAndDepts();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to approve user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (userId) => {
    setTargetUserId(userId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    try {
      await usersApi.approve(targetUserId, {
        status: "Rejected",
        reason: rejectReason || "Rejected by administration",
      });
      success("User registration rejected.");
      setShowRejectModal(false);
      fetchUsersAndDepts();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to reject user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    const displayName = user.full_name || user.name || user.username;
    if (!window.confirm(`Are you sure you want to delete user ${displayName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await usersApi.delete(user.id);
      success(`User ${displayName} deleted.`);
      fetchUsersAndDepts();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const payload = {
        full_name: createForm.full_name,
        name: createForm.full_name,
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        mobile_number: createForm.mobile_number,
        usn_or_employee_id: createForm.usn_or_employee_id.toUpperCase(),
        role: createForm.role,
        department_id: isHOD ? currentUser.department_id : (createForm.department_id ? Number(createForm.department_id) : null),
        semester: createForm.role === "student" ? Number(createForm.semester) : null,
        section: createForm.role === "student" ? createForm.section : null,
        designation: createForm.role === "teacher" ? createForm.designation : null,
        account_status: createForm.account_status,
      };

      await usersApi.create(payload);
      success("User created successfully!");
      setShowCreateModal(false);
      setCreateForm({
        full_name: "",
        username: "",
        email: "",
        password: "",
        mobile_number: "",
        usn_or_employee_id: "",
        role: "student",
        department_id: departments[0]?.id || "",
        semester: 5,
        section: "A",
        designation: "Assistant Professor",
        account_status: "Approved",
      });
      fetchUsersAndDepts();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser({
      ...user,
      full_name: user.full_name || user.name || "",
      department_id: user.department_id || "",
      semester: user.semester || 5,
      section: user.section || "A",
      designation: user.designation || "Assistant Professor",
      account_status: user.account_status || "Approved",
    });
    setShowEditModal(true);
  };

  // Handle Edit User Submit
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const payload = {
        full_name: selectedUser.full_name,
        name: selectedUser.full_name,
        email: selectedUser.email,
        mobile_number: selectedUser.mobile_number,
        usn_or_employee_id: selectedUser.usn_or_employee_id,
        role: selectedUser.role,
        department_id: selectedUser.department_id ? Number(selectedUser.department_id) : null,
        semester: selectedUser.role === "student" ? Number(selectedUser.semester) : null,
        section: selectedUser.role === "student" ? selectedUser.section : null,
        designation: selectedUser.role === "teacher" ? selectedUser.designation : null,
        account_status: selectedUser.account_status,
      };

      await usersApi.update(selectedUser.id, payload);
      success("User profile updated successfully!");
      setShowEditModal(false);
      fetchUsersAndDepts();
    } catch (err) {
      error(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "Approved").toLowerCase();
    if (s === "pending") {
      return (
        <span
          style={{
            background: "#fef3c7",
            color: "#b45309",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    if (s === "approved") {
      return (
        <span
          style={{
            background: "#dcfce7",
            color: "#15803d",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <XCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span
        style={{
          background: "#f1f5f9",
          color: "#475569",
          padding: "0.25rem 0.65rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 700,
        }}
      >
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const r = (role || "student").toLowerCase();
    const map = {
      admin: { bg: "#e0e7ff", color: "#3730a3", label: "Admin" },
      hod: { bg: "#f3e8ff", color: "#6b21a8", label: "HOD" },
      teacher: { bg: "#e0f2fe", color: "#0369a1", label: "Teacher" },
      faculty: { bg: "#e0f2fe", color: "#0369a1", label: "Teacher" },
      student: { bg: "#ecfdf5", color: "#047857", label: "Student" },
    };
    const cfg = map[r] || { bg: "#f1f5f9", color: "#334155", label: role };
    return (
      <span
        style={{
          background: cfg.bg,
          color: cfg.color,
          padding: "0.25rem 0.6rem",
          borderRadius: "6px",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {cfg.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <Users size={28} color="#1e3a8a" />
            <span>User Accounts & Permissions</span>
          </h1>
          <p style={{ margin: "0.3rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            {isAdmin
              ? "Comprehensive management of institutional accounts, roles, and registration approvals."
              : `Department user roster and student approval queue for ${currentUser?.department?.name || "your department"}.`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={fetchUsersAndDepts}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              padding: "0.65rem 1rem",
              borderRadius: "10px",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#1e3a8a",
              color: "#ffffff",
              border: "none",
              padding: "0.65rem 1.25rem",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)",
            }}
          >
            <UserPlus size={18} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          onClick={() => setStatusFilter("all")}
          style={{
            background: "#ffffff",
            border: statusFilter === "all" ? "2px solid #1e3a8a" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Total Accounts</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.3rem" }}>
            {users.length}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("pending")}
          style={{
            background: pendingCount > 0 ? "#fffbeb" : "#ffffff",
            border: statusFilter === "pending" ? "2px solid #d97706" : "1px solid #fde68a",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#b45309", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Clock size={16} /> Pending Approvals
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#b45309", marginTop: "0.3rem" }}>
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("student")}
          style={{
            background: "#ffffff",
            border: roleFilter === "student" ? "2px solid #059669" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Students</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#047857", marginTop: "0.3rem" }}>
            {users.filter((u) => u.role === "student").length}
          </div>
        </div>

        <div
          onClick={() => setRoleFilter("teacher")}
          style={{
            background: "#ffffff",
            border: roleFilter === "teacher" ? "2px solid #0284c7" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Teachers / Faculty</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", marginTop: "0.3rem" }}>
            {users.filter((u) => ["teacher", "faculty"].includes(u.role)).length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "1rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ flex: "1 1 280px", position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, USN/EmpID, email..."
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem 0.6rem 2.4rem",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "0.88rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569" }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="all">All Roles</option>
            {isAdmin && <option value="admin">Admin</option>}
            <option value="hod">HOD</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.88rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "#334155" }}>User</th>
                <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "#334155" }}>USN / Emp ID</th>
                <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "#334155" }}>Role</th>
                <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "#334155" }}>Department</th>
                <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "#334155" }}>Class / Designation</th>
                <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "#334155" }}>Status</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "#334155", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {u.full_name || u.name || u.username}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        @{u.username} • {u.email}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>
                      {u.usn_or_employee_id || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>{getRoleBadge(u.role)}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#334155" }}>
                      {u.department?.name || u.department?.code || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>
                      {u.role === "student"
                        ? `Sem ${u.semester || "-"} (Sec ${u.section || "-"})`
                        : u.designation || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {getStatusBadge(u.account_status)}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                        {/* If Pending: Show 1-Click Approve / Reject */}
                        {u.account_status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(u.id)}
                              disabled={actionLoading}
                              title="Approve Account"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#059669",
                                color: "#ffffff",
                                border: "none",
                                padding: "0.4rem 0.65rem",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(u.id)}
                              disabled={actionLoading}
                              title="Reject Account"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                padding: "0.4rem 0.65rem",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            padding: "0.4rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "#334155",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User"
                          style={{
                            background: "#fee2e2",
                            border: "1px solid #fecaca",
                            padding: "0.4rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "#b91c1c",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Create New User Account
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={createForm.mobile_number}
                    onChange={(e) => setCreateForm({ ...createForm, mobile_number: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    USN / Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.usn_or_employee_id}
                    onChange={(e) => setCreateForm({ ...createForm, usn_or_employee_id: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Role *
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  >
                    {isAdmin && <option value="admin">Administrator</option>}
                    {isAdmin && <option value="hod">Head of Department (HOD)</option>}
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Department *
                  </label>
                  {isHOD ? (
                    <input
                      type="text"
                      disabled
                      value={currentUser?.department?.name || `Department #${currentUser?.department_id}`}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", boxSizing: "border-box" }}
                    />
                  ) : (
                    <select
                      value={createForm.department_id}
                      onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {createForm.role === "student" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                        Semester (1 to 8)
                      </label>
                      <select
                        value={createForm.semester}
                        onChange={(e) => setCreateForm({ ...createForm, semester: Number(e.target.value) })}
                        style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                        Section
                      </label>
                      <select
                        value={createForm.section}
                        onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                        style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                      >
                        {["A", "B", "C", "D"].map((sec) => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {createForm.role === "teacher" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                      Designation
                    </label>
                    <select
                      value={createForm.designation}
                      onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Lecturer">Lecturer</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "none", background: "#1e3a8a", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  {actionLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Edit Account: {selectedUser.full_name || selectedUser.username}
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedUser.full_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={selectedUser.mobile_number || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, mobile_number: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    USN / Employee ID
                  </label>
                  <input
                    type="text"
                    value={selectedUser.usn_or_employee_id || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, usn_or_employee_id: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                    Account Status
                  </label>
                  <select
                    value={selectedUser.account_status}
                    onChange={(e) => setSelectedUser({ ...selectedUser, account_status: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                      Role
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                    >
                      <option value="admin">Admin</option>
                      <option value="hod">HOD</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "none", background: "#1e3a8a", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "1.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#b91c1c", margin: "0 0 0.5rem" }}>
              Reject Registration Request
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 1rem" }}>
              Please provide a reason for rejecting this account request. The user will be notified upon attempting to sign in.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid USN or not listed in department registry"
              style={{
                width: "100%",
                padding: "0.65rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "1.25rem",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "#dc2626", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

