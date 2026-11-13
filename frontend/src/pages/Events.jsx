import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, Filter, Calendar as CalendarIcon, Grid, List as ListIcon, RefreshCw, Sparkles, Building, Tag } from "lucide-react";
import { eventsApi, departmentsApi } from "../api";
import EventCard from "../components/EventCard";
import EventCalendar from "../components/EventCalendar";
import { useAuth } from "../context/AuthContext";
import CollegeLogo from "../components/CollegeLogo";

const CATEGORIES = [
  "All",
  "Academic",
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Conference",
  "Hackathon",
  "Club Activity",
  "Placement",
  "Meeting",
];

const STATUSES = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled"];

export default function Events() {
  const { role, user } = useAuth();
  const currentRole = role?.toLowerCase() || "student";
  const canCreate = ["admin", "hod"].includes(currentRole);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get("view") || "grid";

  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState(initialView); // "grid", "calendar"

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedDepartment) params.department_id = selectedDepartment;
      if (selectedStatus !== "All") params.status = selectedStatus;

      const res = await eventsApi.getAll(params);
      const data = Array.isArray(res) ? res : res.data || [];
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedDepartment, selectedStatus]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentsApi.getAll();
        setDepartments(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.warn("Could not load departments:", err);
      }
    };
    loadDepartments();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header Banner */}
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
              height: "52px",
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
                  letterSpacing: "0.05em",
                }}
              >
                Campus Life & Academics
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: "0.3rem 0 0.15rem" }}>
              Events & Workshops
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              Explore upcoming seminars, cultural fests, technical hackathons, and placement drives.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={() => setViewMode("grid")}
              title="Cards View"
              style={{
                background: viewMode === "grid" ? "#6366f1" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#94a3b8",
                border: "none",
                padding: "0.4rem 0.75rem",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Grid size={15} /> Cards
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              title="Calendar View"
              style={{
                background: viewMode === "calendar" ? "#6366f1" : "transparent",
                color: viewMode === "calendar" ? "#fff" : "#94a3b8",
                border: "none",
                padding: "0.4rem 0.75rem",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CalendarIcon size={15} /> Calendar
            </button>
          </div>

          {/* Add Event Button for Admin/HOD */}
          {canCreate && (
            <Link
              to="/admin/events/add"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Plus size={16} /> Create Event
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search bar */}
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
              minWidth: "260px",
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by event title, venue, or organizer..."
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
                  fetchEvents();
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

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: "0.55rem 0.85rem",
              background: "#1f2937",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              color: "#f8fafc",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: "0.55rem 0.85rem",
              background: "#1f2937",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              color: "#f8fafc",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchEvents}
            title="Refresh events list"
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

        {/* Category Pills Bar */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            paddingBottom: "0.25rem",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.04)",
                  border: isSelected ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: isSelected ? "#c7d2fe" : "#94a3b8",
                  padding: "0.3rem 0.8rem",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          <div>Loading campus events...</div>
        </div>
      ) : error ? (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      ) : viewMode === "calendar" ? (
        <EventCalendar events={events} />
      ) : events.length === 0 ? (
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
          <CalendarIcon size={44} style={{ opacity: 0.3, margin: "0 auto 0.75rem" }} />
          <h3 style={{ color: "#f8fafc", fontSize: "1.1rem", marginBottom: "0.3rem" }}>No events found</h3>
          <p style={{ fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto" }}>
            No events match your current filter settings. Try clearing the search or category filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} onStatusChange={fetchEvents} />
          ))}
        </div>
      )}
    </div>
  );
}
