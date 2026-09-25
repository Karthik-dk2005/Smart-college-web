import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { BellRing, Tag, Calendar, User, Loader2, RefreshCw } from "lucide-react";

export default function StudentNoticesView() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.getNotices(selectedCategory === "All" ? null : selectedCategory);
      if (Array.isArray(res)) {
        setNotices(res);
      }
    } catch (err) {
      console.error("Notices fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  const categories = ["All", "Academic", "Examination", "Attendance", "Administrative", "General"];

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Official Notice Board & Circulars
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Campus Circulars, Examination Notifications & Department Announcements
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchNotices}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "1.5rem" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="btn"
            style={{
              background: selectedCategory === cat ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.03)",
              color: selectedCategory === cat ? "#fff" : "var(--text-secondary)",
              borderColor: selectedCategory === cat ? "var(--accent-primary)" : "var(--border-color)",
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <BellRing size={18} color="#f59e0b" />
            <span>Active Announcements</span>
          </h2>
          <span className="badge badge-info">{notices.length} Published</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 size={32} className="animate-spin" color="#6366f1" />
          </div>
        ) : notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            No notices published in this category.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {notices.map((n) => (
              <div
                key={n.id}
                style={{
                  background: n.priority === "Urgent" ? "rgba(239, 68, 68, 0.06)" : "rgba(255, 255, 255, 0.02)",
                  border: n.priority === "Urgent" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="badge badge-purple">{n.category}</span>
                    <span className={`badge ${n.priority === "Urgent" ? "badge-danger" : "badge-info"}`}>
                      {n.priority}
                    </span>
                    <span className="badge badge-info">Dept: {n.department}</span>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={14} />
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginTop: "0.75rem" }}>
                  {n.title}
                </h3>

                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
                  {n.description}
                </p>

                {n.attachment_url && (
                  <div style={{ marginTop: "1rem" }}>
                    <a
                      href={n.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                      View Attachment Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
