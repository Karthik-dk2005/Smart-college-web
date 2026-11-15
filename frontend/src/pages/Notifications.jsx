import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../api";
import { useToast } from "../components/Toast";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Megaphone,
  AlertCircle,
  BookOpen,
  Award,
  Clock,
  MailCheck,
  RefreshCw,
  Send,
  Sliders,
  History,
  Trash2,
  Mail,
  ShieldCheck,
  Check,
  Server,
  Filter,
} from "lucide-react";

export default function Notifications() {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState("inbox"); // "inbox" | "history" | "preferences" | "compose"
  const [filterType, setFilterType] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [preferences, setPreferences] = useState({
    email_attendance: true,
    email_marks: true,
    email_timetable: true,
    email_announcements: true,
    email_events: true,
    email_system: true,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    target_role: "all",
    title: "",
    message: "",
    category: "general",
    notification_type: "announcement",
  });

  // SMTP Test state
  const [testEmail, setTestEmail] = useState("");
  const [testSmtpResult, setTestSmtpResult] = useState(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const isStaff = ["admin", "hod", "teacher", "faculty"].includes((role || "").toLowerCase());
  const isAdminOrHod = ["admin", "hod"].includes((role || "").toLowerCase());

  // Load Inbox
  const fetchInbox = async () => {
    try {
      setLoading(true);
      const params = {};
      if (unreadOnly) params.unread_only = true;
      if (filterType !== "all") params.notification_type = filterType;

      const res = await notificationsApi.getAll(params);
      setNotifications(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      toastError("Failed to load notifications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load History
  const fetchHistory = async () => {
    if (!isStaff) return;
    try {
      setLoading(true);
      const res = await notificationsApi.getHistory({ limit: 100 });
      setHistoryList(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.warn("Could not load history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Preferences
  const fetchPreferences = async () => {
    try {
      const res = await notificationsApi.getPreferences();
      if (res.data || res) {
        setPreferences(res.data || res);
      }
    } catch (err) {
      console.warn("Could not load preferences:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox") {
      fetchInbox();
    } else if (activeTab === "history") {
      fetchHistory();
    } else if (activeTab === "preferences") {
      fetchPreferences();
    }
  }, [activeTab, unreadOnly, filterType]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toastError("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      success("All notifications marked as read");
    } catch (err) {
      toastError("Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      success("Notification deleted");
    } catch (err) {
      toastError("Failed to delete notification");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await notificationsApi.updatePreferences(preferences);
      setPreferences(res.data || res);
      success("Notification email preferences saved!");
    } catch (err) {
      toastError("Failed to save preferences: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (!composeForm.title || !composeForm.message) {
      toastError("Title and message are required.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await notificationsApi.sendCustom(composeForm);
      success(res.message || "Notification sent successfully!");
      setComposeForm({
        target_role: "all",
        title: "",
        message: "",
        category: "general",
        notification_type: "announcement",
      });
      setActiveTab("history");
    } catch (err) {
      toastError(err.response?.data?.detail || "Failed to dispatch notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTestingSmtp(true);
      setTestSmtpResult(null);
      const res = await notificationsApi.testSmtp({
        test_email: testEmail || undefined,
      });
      setTestSmtpResult(res);
      if (res.success) {
        success(res.message || "SMTP test succeeded!");
      } else {
        toastError(res.message || "SMTP test failed");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      setTestSmtpResult({ success: false, message: msg });
      toastError(msg);
    } finally {
      setTestingSmtp(false);
    }
  };

  const getTypeIcon = (type, category) => {
    const t = (type || category || "").toLowerCase();
    if (t.includes("marks")) return <Award size={18} color="#10b981" />;
    if (t.includes("attendance")) return <Clock size={18} color="#3b82f6" />;
    if (t.includes("timetable")) return <BookOpen size={18} color="#8b5cf6" />;
    if (t.includes("event")) return <Calendar size={18} color="#ec4899" />;
    if (t.includes("announcement")) return <Megaphone size={18} color="#f59e0b" />;
    if (t.includes("system") || t.includes("urgent")) return <AlertCircle size={18} color="#ef4444" />;
    return <Bell size={18} color="#94a3b8" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
            }}
          >
            <Bell size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  color: "#93c5fd",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "12px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                SmartDept Notifications
              </span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Gmail SMTP Integrated</span>
            </div>
            <h1 style={{ margin: "0.25rem 0 0 0", fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc" }}>
              Notification Center
            </h1>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
              Stay updated with real-time academic alerts, IA marks, timetable schedules, and campus circulars.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {activeTab === "inbox" && notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1rem",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Check size={16} />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            onClick={() => {
              if (activeTab === "inbox") fetchInbox();
              else if (activeTab === "history") fetchHistory();
            }}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 0.9rem",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("inbox")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "inbox" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "inbox" ? "#60a5fa" : "#94a3b8",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Bell size={16} />
          <span>My Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "preferences" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "preferences" ? "#60a5fa" : "#94a3b8",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Sliders size={16} />
          <span>Email Preferences</span>
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab("history")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "history" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "history" ? "#60a5fa" : "#94a3b8",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <History size={16} />
            <span>Delivery Logs & History</span>
          </button>
        )}

        {isStaff && (
          <button
            onClick={() => setActiveTab("compose")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "compose" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "compose" ? "#60a5fa" : "#94a3b8",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Send size={16} />
            <span>Dispatch Announcement</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INBOX                                             */}
      {/* ======================================================== */}
      {activeTab === "inbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {/* Filters Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Filter size={14} /> Filter:
              </span>
              {[
                { id: "all", label: "All Alerts" },
                { id: "marks", label: "IA Marks" },
                { id: "attendance", label: "Attendance" },
                { id: "timetable", label: "Timetable" },
                { id: "announcement", label: "Announcements" },
                { id: "event", label: "Events" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterType(btn.id)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    background: filterType === btn.id ? "#2563eb" : "rgba(255, 255, 255, 0.06)",
                    color: filterType === btn.id ? "#ffffff" : "#cbd5e1",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                color: "#cbd5e1",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                style={{ accentColor: "#3b82f6" }}
              />
              <span>Unread Only</span>
            </label>
          </div>

          {/* Notifications Card List */}
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.5rem auto" }} />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                padding: "3rem 1.5rem",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "14px",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
              }}
            >
              <CheckCircle2 size={36} color="#10b981" style={{ margin: "0 auto 0.5rem auto" }} />
              <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.1rem", color: "#f8fafc" }}>
                No notifications found
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                {unreadOnly ? "You have no unread notifications." : "There are no notifications matching this filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    background: notif.read ? "rgba(255, 255, 255, 0.03)" : "rgba(37, 99, 235, 0.08)",
                    border: notif.read ? "1px solid rgba(255, 255, 255, 0.07)" : "1px solid rgba(59, 130, 246, 0.35)",
                    borderRadius: "12px",
                    padding: "1.1rem 1.25rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getTypeIcon(notif.notification_type, notif.category)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        <span style={{ fontSize: "0.96rem", fontWeight: notif.read ? 600 : 700, color: notif.read ? "#e2e8f0" : "#ffffff" }}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
                        )}
                        {notif.delivery_status === "sent" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          >
                            <MailCheck size={12} />
                            Email Sent
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          {formatDate(notif.created_at)}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            title="Mark as read"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#60a5fa",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          title="Delete"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        margin: "0.45rem 0 0 0",
                        fontSize: "0.86rem",
                        color: "#cbd5e1",
                        lineHeight: 1.55,
                      }}
                      dangerouslySetInnerHTML={{ __html: notif.message }}
                    />

                    {notif.link && (
                      <div style={{ marginTop: "0.6rem" }}>
                        <Link
                          to={notif.link}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            color: "#60a5fa",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <span>Open details in portal</span>
                          &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: EMAIL PREFERENCES                                 */}
      {/* ======================================================== */}
      {activeTab === "preferences" && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "760px",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.35rem 0", fontSize: "1.3rem", color: "#f8fafc", fontWeight: 700 }}>
              Email Notification Settings
            </h2>
            <p style={{ margin: 0, fontSize: "0.86rem", color: "#94a3b8" }}>
              Choose which academic and administrative events trigger automatic Gmail SMTP notifications to your registered email.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              {
                key: "email_marks",
                label: "Internal Assessment Marks",
                desc: "Receive instant email notification when IA marks are published or edited.",
                icon: <Award size={18} color="#10b981" />,
              },
              {
                key: "email_attendance",
                label: "Class Attendance Updates",
                desc: "Get notified when attendance sessions or shortage warnings are logged.",
                icon: <Clock size={18} color="#3b82f6" />,
              },
              {
                key: "email_timetable",
                label: "Timetable & Schedule Updates",
                desc: "Receive alerts when class schedules, slots, or room assignments change.",
                icon: <BookOpen size={18} color="#8b5cf6" />,
              },
              {
                key: "email_announcements",
                label: "Department Announcements",
                desc: "Official department circulars and faculty notifications sent to your inbox.",
                icon: <Megaphone size={18} color="#f59e0b" />,
              },
              {
                key: "email_events",
                label: "Campus Events & Hackathons",
                desc: "Invitations and reminders for institutional events and symposiums.",
                icon: <Calendar size={18} color="#ec4899" />,
              },
              {
                key: "email_system",
                label: "System & Security Alerts",
                desc: "Account creation confirmations, password resets, and critical portal notices.",
                icon: <ShieldCheck size={18} color="#60a5fa" />,
              },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.94rem", fontWeight: 600, color: "#f8fafc" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{item.desc}</div>
                  </div>
                </div>

                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        [item.key]: e.target.checked,
                      })
                    }
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: preferences[item.key] ? "#2563eb" : "#475569",
                      transition: "0.3s",
                      borderRadius: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: preferences[item.key] ? "22px" : "3px",
                        bottom: "3px",
                        backgroundColor: "#ffffff",
                        transition: "0.3s",
                        borderRadius: "50%",
                      }}
                    />
                  </span>
                </label>
              </div>
            ))}

            <div style={{ marginTop: "1rem" }}>
              <button
                type="submit"
                disabled={actionLoading}
                style={{
                  padding: "0.75rem 1.75rem",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>

          {/* SMTP Test Verification Section for Admin/HOD */}
          {isAdminOrHod && (
            <div
              style={{
                marginTop: "2.5rem",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <Server size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>
                  Gmail SMTP Connection Verification
                </h3>
              </div>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                Test your backend Gmail SMTP credentials and dispatch a test email to verify live delivery.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter destination email (default: your account)"
                  style={{
                    flex: "1 1 280px",
                    padding: "0.65rem 0.95rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  style={{
                    padding: "0.65rem 1.25rem",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: testingSmtp ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                  }}
                >
                  <Mail size={16} />
                  <span>{testingSmtp ? "Testing Connection..." : "Test SMTP Send"}</span>
                </button>
              </div>

              {testSmtpResult && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.85rem 1rem",
                    borderRadius: "8px",
                    background: testSmtpResult.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: testSmtpResult.success ? "1px solid #10b981" : "1px solid #ef4444",
                    fontSize: "0.84rem",
                    color: testSmtpResult.success ? "#a7f3d0" : "#fca5a5",
                  }}
                >
                  <strong>{testSmtpResult.success ? "✓ Success:" : "✗ Error:"}</strong> {testSmtpResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DISPATCH HISTORY & LOGS                           */}
      {/* ======================================================== */}
      {activeTab === "history" && isStaff && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#f8fafc", fontWeight: 700 }}>
              System Email & In-App Delivery Logs
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Showing recent {historyList.length} dispatch logs
            </span>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <th style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>Recipient</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>Type</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>Subject & Message</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>Delivery Status</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontWeight: 600 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                      No delivery logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  historyList.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
                    >
                      <td style={{ padding: "0.85rem 1rem", color: "#f8fafc", fontWeight: 600 }}>
                        {log.recipient_email || (log.user_id ? `User #${log.user_id}` : "Broadcast")}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textTransform: "capitalize", color: "#cbd5e1" }}>
                        {log.notification_type || log.category}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", maxWidth: "340px" }}>
                        <div style={{ color: "#ffffff", fontWeight: 600 }}>{log.title}</div>
                        <div
                          style={{ color: "#94a3b8", fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          dangerouslySetInnerHTML={{ __html: log.message }}
                        />
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background:
                              log.delivery_status === "sent"
                                ? "rgba(16, 185, 129, 0.15)"
                                : log.delivery_status === "failed"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              log.delivery_status === "sent"
                                ? "#34d399"
                                : log.delivery_status === "failed"
                                ? "#f87171"
                                : "#fbbf24",
                          }}
                        >
                          {log.delivery_status || "In-App"}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.78rem" }}>
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: COMPOSE ANNOUNCEMENT / EMAIL                      */}
      {/* ======================================================== */}
      {activeTab === "compose" && isStaff && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "760px",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.35rem 0", fontSize: "1.3rem", color: "#f8fafc", fontWeight: 700 }}>
              Dispatch Custom Notification & Email
            </h2>
            <p style={{ margin: 0, fontSize: "0.86rem", color: "#94a3b8" }}>
              Send an instant notification and branded email to students, faculty, or all department members.
            </p>
          </div>

          <form onSubmit={handleSendCompose} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                Target Recipients
              </label>
              <select
                value={composeForm.target_role}
                onChange={(e) => setComposeForm({ ...composeForm, target_role: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              >
                <option value="all">Broadcast to All Users</option>
                <option value="student">All Students (5th Sem CSE)</option>
                <option value="teacher">Department Faculty / Teachers</option>
                {role === "admin" && <option value="hod">Department HODs</option>}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                Subject / Notification Title
              </label>
              <input
                type="text"
                value={composeForm.title}
                onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                placeholder="e.g. Schedule Revision for Computer Networks"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                Message Content
              </label>
              <textarea
                value={composeForm.message}
                onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                placeholder="Enter complete notification message and academic details..."
                rows={5}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={actionLoading}
                style={{
                  padding: "0.8rem 2rem",
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.94rem",
                  fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Send size={16} />
                <span>{actionLoading ? "Dispatching..." : "Send Notification & Email"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
