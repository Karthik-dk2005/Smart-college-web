import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone, Plus, Search, Filter, RefreshCw, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { announcementsApi } from "../api";
import AnnouncementCard from "../components/AnnouncementCard";
import CollegeLogo from "../components/CollegeLogo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const PRIORITIES = ["All", "Urgent", "Important", "Normal"];
const CATEGORIES = ["All", "General", "Academic", "Examination", "Placement", "Sports", "Cultural", "Administration"];

export default function Announcements() {
  const { role, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const canCreate = ["admin", "hod"].includes(role?.toLowerCase());

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (priorityFilter !== "All") params.priority = priorityFilter;
      if (categoryFilter !== "All") params.category = categoryFilter;

      const res = await announcementsApi.getAll(params);
      setAnnouncements(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setError(err.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const handleEdit = (announcement) => {
    navigate(`/admin/announcements/${announcement.id}/edit`);
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm(`Are you sure you want to delete '${announcement.title}'?`)) return;
    try {
      await announcementsApi.delete(announcement.id);
      showToast("Announcement deleted successfully.", "info");
      fetchAnnouncements();
    } catch (err) {
      showToast(err.message || "Failed to delete announcement.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          padding: "1.5rem 1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <CollegeLogo
            size="sm"
            style={{
              height: "50px",
              width: "auto",
              objectFit: "contain",
              background: "#ffffff",
              padding: "4px",
              borderRadius: "10px",
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.3)",
                  color: "#c7d2fe",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "20px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Campus Bulletins & Notices
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: "0.25rem 0 0.1rem" }}>
              Latest Announcements
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              Official administrative notices, examination guidelines, and department updates.
            </p>
          </div>
        </div>

        {canCreate && (
          <Link
            to="/admin/announcements/add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.15rem",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Plus size={16} /> Post Announcement
          </Link>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            padding: "0.5rem 0.85rem",
            flex: 1,
            minWidth: "250px",
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search announcement title or body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#f8fafc",
              fontSize: "0.85rem",
              outline: "none",
              width: "100%",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchAnnouncements();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Priority Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {PRIORITIES.map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                style={{
                  background: isSelected
                    ? p === "Urgent"
                      ? "rgba(239, 68, 68, 0.25)"
                      : p === "Important"
                      ? "rgba(245, 158, 11, 0.25)"
                      : "rgba(99, 102, 241, 0.25)"
                    : "rgba(255, 255, 255, 0.04)",
                  border: isSelected
                    ? p === "Urgent"
                      ? "1px solid #ef4444"
                      : p === "Important"
                      ? "1px solid #f59e0b"
                      : "1px solid #6366f1"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  color: isSelected
                    ? p === "Urgent"
                      ? "#fca5a5"
                      : p === "Important"
                      ? "#fde68a"
                      : "#c7d2fe"
                    : "#94a3b8",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.85rem",
            background: "#1f2937",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            color: "#f8fafc",
            fontSize: "0.85rem",
            outline: "none",
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={fetchAnnouncements}
          title="Refresh announcements"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#cbd5e1",
            padding: "0.55rem",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          <div>Loading announcements...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#fca5a5" }}>{error}</div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "4rem 2rem",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <Megaphone size={40} style={{ opacity: 0.3, margin: "0 auto 0.75rem" }} />
          <h3 style={{ color: "#f8fafc", fontSize: "1.1rem", marginBottom: "0.3rem" }}>No announcements found</h3>
          <p style={{ fontSize: "0.85rem" }}>No circulars matching your active filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
