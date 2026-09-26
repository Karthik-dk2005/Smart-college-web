import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import noticesApi from "../api/notices";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Edit2,
  Trash2,
  Share2,
  Pin,
  CheckCircle,
  Eye,
  Megaphone,
} from "lucide-react";

export default function Notices() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_role: "all",
  });
  const [submitting, setSubmitting] = useState(false);

  // Detail View Modal State
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "hod" || user?.role === "faculty";

  useEffect(() => {
    fetchNotices();
  }, [filterRole]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole !== "all") {
        params.target_role = filterRole;
      }
      const res = await noticesApi.getAll(params);
      if (res.data?.data) {
        setNotices(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      addToast({
        title: "Error Loading Notices",
        message: err.response?.data?.detail || "Could not retrieve department announcements.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      title: "",
      description: "",
      target_role: "all",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (notice, e) => {
    e.stopPropagation();
    setEditingNotice(notice);
    setFormData({
      title: notice.title || "",
      description: notice.description || "",
      target_role: notice.target_role || "all",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      addToast({
        title: "Validation Error",
        message: "Notice title and description cannot be empty.",
        type: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingNotice) {
        await noticesApi.update(editingNotice.id, formData);
        addToast({
          title: "Notice Updated",
          message: `Notice "${formData.title}" updated successfully.`,
          type: "success",
        });
      } else {
        await noticesApi.create(formData);
        addToast({
          title: "Notice Published",
          message: `Notice "${formData.title}" is now visible to the department.`,
          type: "success",
        });
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      console.error("Failed to save notice:", err);
      addToast({
        title: "Save Failed",
        message: err.response?.data?.detail || "Could not save the notice.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (notice, e) => {
    e.stopPropagation();
    setNoticeToDelete(notice);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noticeToDelete) return;
    try {
      setDeleting(true);
      await noticesApi.delete(noticeToDelete.id);
      addToast({
        title: "Notice Deleted",
        message: "Notice removed from department bulletin.",
        type: "success",
      });
      setDeleteConfirmOpen(false);
      setNoticeToDelete(null);
      fetchNotices();
    } catch (err) {
      console.error("Delete failed:", err);
      addToast({
        title: "Delete Failed",
        message: err.response?.data?.detail || "Failed to remove notice.",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filter notices by search query
  const filteredNotices = notices.filter((n) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = n.title?.toLowerCase().includes(q);
    const descMatch = n.description?.toLowerCase().includes(q);
    return titleMatch || descMatch;
  });

  const getTargetBadgeColor = (target) => {
    switch (target?.toLowerCase()) {
      case "student":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
      case "faculty":
        return { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" };
      case "hod":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      default:
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>
              Department Notices & Bulletins
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <Megaphone size={13} />
              {notices.length} Published
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Official circulars, academic notifications, and department announcements.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--primary)",
              color: "#ffffff",
              border: "none",
              padding: "0.65rem 1.25rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--primary-glow)",
            }}
          >
            <Plus size={16} />
            Post New Notice
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          background: "var(--bg-surface)",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
            }}
          />
          <input
            type="text"
            placeholder="Search circulars by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 1rem 0.6rem 2.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={16} color="var(--text-dim)" />
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>Audience:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Audiences</option>
            <option value="student">Students Only</option>
            <option value="faculty">Faculty Only</option>
            <option value="hod">HOD & Admin</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div style={{ background: "var(--bg-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <TableSkeleton rows={4} columns={3} />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <Bell size={28} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              No Bulletins Found
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {searchQuery
                ? `No announcements matching "${searchQuery}".`
                : "There are currently no active announcements in this category."}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredNotices.map((notice) => {
            const badge = getTargetBadgeColor(notice.target_role);
            const isAuthorOrAdmin =
              user?.role === "admin" ||
              user?.role === "hod" ||
              notice.created_by === user?.id;

            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.4rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: "var(--shadow-sm)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  {/* Top Bar: Target Role Badge and Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      Target: {notice.target_role || "ALL"}
                    </span>

                    {canManage && isAuthorOrAdmin && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          onClick={(e) => handleOpenEditModal(notice, e)}
                          title="Edit Notice"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "0.25rem",
                            borderRadius: "4px",
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDeletePrompt(notice, e)}
                          title="Delete Notice"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#fb7185",
                            cursor: "pointer",
                            padding: "0.25rem",
                            borderRadius: "4px",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      marginBottom: "0.6rem",
                      lineHeight: 1.35,
                    }}
                  >
                    {notice.title}
                  </h3>

                  {/* Description preview */}
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {notice.description}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "1rem",
                    marginTop: "1.25rem",
                    borderTop: "1px solid var(--border-subtle)",
                    fontSize: "0.75rem",
                    color: "var(--text-dim)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={13} />
                    <span>
                      {notice.created_at
                        ? new Date(notice.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent"}
                    </span>
                  </div>

                  <span style={{ color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Eye size={13} /> View Notice
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice View Modal */}
      {selectedNotice && (
        <Modal
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title="Department Notice Details"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: getTargetBadgeColor(selectedNotice.target_role).bg,
                  color: getTargetBadgeColor(selectedNotice.target_role).text,
                }}
              >
                Audience: {selectedNotice.target_role || "ALL"}
              </span>

              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {selectedNotice.created_at
                  ? new Date(selectedNotice.created_at).toLocaleString()
                  : ""}
              </span>
            </div>

            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>
              {selectedNotice.title}
            </h2>

            <div
              style={{
                background: "var(--bg-card)",
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                lineHeight: 1.65,
                whiteSpace: "pre-line",
              }}
            >
              {selectedNotice.description}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedNotice(null)}
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-medium)",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNotice ? "Edit Notice" : "Post New Notice"}
      >
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-muted)" }}>
              Notice Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for 5th Semester Mid-Term IA-1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-muted)" }}>
              Target Audience
            </label>
            <select
              value={formData.target_role}
              onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            >
              <option value="all">Entire Department (All)</option>
              <option value="student">Students Only</option>
              <option value="faculty">Faculty Members Only</option>
              <option value="hod">HOD & Administrative Officers</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-muted)" }}>
              Notice Content & Description *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Write the full circular announcement here..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "0.875rem",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border-medium)",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.4rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px var(--primary-glow)",
              }}
            >
              {submitting ? "Publishing..." : editingNotice ? "Save Changes" : "Publish Notice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department Notice"
        message={`Are you sure you want to permanently remove "${noticeToDelete?.title}" from the bulletin board?`}
        confirmText={deleting ? "Deleting..." : "Delete Notice"}
        danger
      />
    </div>
  );
}
