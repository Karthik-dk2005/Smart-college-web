import React, { useState, useEffect } from "react";
import authApi from "../api/auth";
import { useToast } from "../components/Toast";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Key,
  Shield,
  GraduationCap,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Eye,
} from "lucide-react";

export default function AdminRegistrationRequests() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Live count summary
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Reset password modal state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (roleFilter !== "all") params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await authApi.getRegistrationRequests(params);
      const data = res.data || res;
      setRequests(data.requests || []);
      setCounts({
        total: data.total || (data.requests ? data.requests.length : 0),
        pending: data.pending_count || 0,
        approved: data.approved_count || 0,
        rejected: data.rejected_count || 0,
      });
    } catch (err) {
      toastError("Failed to fetch registration requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleApprove = async (userId, userName) => {
    if (!window.confirm(`Approve registration request for ${userName}?`)) return;
    setActionLoading(userId);
    try {
      await authApi.approveRegistration(userId);
      toastSuccess(`Account for ${userName} approved successfully.`);
      fetchRequests();
    } catch (err) {
      toastError(err.response?.data?.detail || "Failed to approve account.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject registration for ${userName}?`)) return;
    setActionLoading(userId);
    try {
      await authApi.rejectRegistration(userId);
      toastSuccess(`Registration request for ${userName} rejected.`);
      fetchRequests();
    } catch (err) {
      toastError(err.response?.data?.detail || "Failed to reject account.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId, currentActive) => {
    setActionLoading(userId);
    try {
      await authApi.toggleUserStatus(userId);
      toastSuccess(`User status changed to ${!currentActive ? "Active" : "Inactive"}.`);
      fetchRequests();
    } catch (err) {
      toastError(err.response?.data?.detail || "Failed to toggle status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match.");
      return;
    }

    try {
      await authApi.adminResetPassword(resetModalUser.id, newPassword);
      toastSuccess(`Password reset successfully for ${resetModalUser.full_name || resetModalUser.username}`);
      setResetModalUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toastError(err.response?.data?.detail || "Failed to reset password.");
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Title & Overview Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.35rem 0" }}>
          Registration Approval & Account Management
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
          Review, approve, or reject user registrations across HOD, Teacher, and Student roles.
        </p>
      </div>

      {/* Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Total Requests</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {counts.total}
          </div>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "0.82rem", color: "#b45309", fontWeight: 600 }}>Pending Approval</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
            {counts.pending}
          </div>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "0.82rem", color: "#15803d", fontWeight: 600 }}>Approved Accounts</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", marginTop: "0.25rem" }}>
            {counts.approved}
          </div>
        </div>

        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "0.82rem", color: "#b91c1c", fontWeight: 600 }}>Rejected Requests</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", marginTop: "0.25rem" }}>
            {counts.rejected}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "0.35rem", background: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          {["all", "Pending", "Approved", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                border: "none",
                background: statusFilter === tab ? "#ffffff" : "transparent",
                color: statusFilter === tab ? "#1e40af" : "#64748b",
                fontWeight: statusFilter === tab ? 700 : 500,
                fontSize: "0.82rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: statusFilter === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab === "all" ? "All" : tab}
            </button>
          ))}
        </div>

        {/* Role Selector & Search */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              background: "#ffffff",
            }}
          >
            <option value="all">All Roles</option>
            <option value="hod">HOD</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.35rem" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search name, USN, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  width: "220px",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "0.45rem 0.85rem",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>

          <button
            onClick={fetchRequests}
            title="Refresh List"
            style={{
              padding: "0.45rem",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.86rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>User Profile</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Role</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>USN / Emp ID</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Department</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Active</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
                  <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.5rem" }} />
                  <div>Loading registration requests...</div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                  No registration requests found matching the current filters.
                </td>
              </tr>
            ) : (
              requests.map((u) => {
                const roleLower = (u.role || "").toLowerCase();
                const status = u.account_status || "Approved";
                const isPending = status === "Pending";

                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* User Profile */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{u.full_name || u.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{u.email}</div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>@{u.username}</div>
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          background:
                            roleLower === "admin"
                              ? "#fee2e2"
                              : roleLower === "hod"
                              ? "#e0e7ff"
                              : roleLower === "teacher"
                              ? "#fef3c7"
                              : "#ecfdf5",
                          color:
                            roleLower === "admin"
                              ? "#991b1b"
                              : roleLower === "hod"
                              ? "#3730a3"
                              : roleLower === "teacher"
                              ? "#92400e"
                              : "#065f46",
                        }}
                      >
                        {roleLower === "admin" && <Shield size={12} />}
                        {roleLower === "hod" && <Shield size={12} />}
                        {roleLower === "teacher" && <Briefcase size={12} />}
                        {roleLower === "student" && <GraduationCap size={12} />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* USN / Emp ID */}
                    <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontWeight: 600, color: "#334155" }}>
                      {u.usn_or_employee_id || "—"}
                    </td>

                    {/* Department */}
                    <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>
                      {u.department || "Computer Science"}
                    </td>

                    {/* Account Status Badge */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.55rem",
                          borderRadius: "6px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          background:
                            status === "Approved"
                              ? "#dcfce7"
                              : status === "Pending"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            status === "Approved"
                              ? "#15803d"
                              : status === "Pending"
                              ? "#b45309"
                              : "#b91c1c",
                        }}
                      >
                        {status}
                      </span>
                    </td>

                    {/* Active Toggle */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        disabled={actionLoading === u.id || roleLower === "admin"}
                        title={u.is_active ? "Click to deactivate" : "Click to activate"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: roleLower === "admin" ? "not-allowed" : "pointer",
                          color: u.is_active ? "#16a34a" : "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {u.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        <span>{u.is_active ? "Active" : "Inactive"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(u.id, u.full_name || u.name)}
                              disabled={actionLoading === u.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.35rem 0.65rem",
                                background: "#16a34a",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => handleReject(u.id, u.full_name || u.name)}
                              disabled={actionLoading === u.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.35rem 0.65rem",
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setResetModalUser(u)}
                          title="Reset Password"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.35rem 0.5rem",
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.74rem",
                          }}
                        >
                          <Key size={14} />
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

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#1e293b" }}>
              Reset User Password
            </h3>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#64748b" }}>
              Reset password for <strong>{resetModalUser.full_name || resetModalUser.username}</strong> ({resetModalUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.3rem" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  style={{ padding: "0.5rem 0.9rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.5rem 0.9rem", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
