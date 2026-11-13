import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";

export default function EventCalendar({ events = [] }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("month"); // "month", "week", "day"
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Default around Oct 2026 (or today)

  // Navigate dates
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format event date check
  const getEventsForDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return events.filter((ev) => ev.event_date === dateStr);
  };

  // Category color mapper
  const getEventPillStyle = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("work") || c.includes("tech") || c.includes("hack")) {
      return { bg: "rgba(14, 165, 233, 0.2)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.4)" };
    }
    if (c.includes("sport")) {
      return { bg: "rgba(245, 158, 11, 0.2)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.4)" };
    }
    if (c.includes("cultur")) {
      return { bg: "rgba(236, 72, 153, 0.2)", text: "#f472b6", border: "rgba(236, 72, 153, 0.4)" };
    }
    return { bg: "rgba(99, 102, 241, 0.2)", text: "#a5b4fc", border: "rgba(99, 102, 241, 0.4)" };
  };

  // -------------------------------------------------------------
  // MONTH VIEW GENERATION
  // -------------------------------------------------------------
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank cells before month start
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        {/* Day Name Header Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            background: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
            fontWeight: 700,
            fontSize: "0.82rem",
            color: "#94a3b8",
            padding: "0.6rem 0",
          }}
        >
          {dayHeaders.map((dh) => (
            <div key={dh}>{dh}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gridAutoRows: "minmax(110px, auto)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {days.map((dateObj, idx) => {
            if (!dateObj) {
              return (
                <div
                  key={`blank-${idx}`}
                  style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                />
              );
            }

            const dayEvents = getEventsForDate(dateObj);
            const isToday =
              new Date().toDateString() === dateObj.toDateString();

            return (
              <div
                key={dateObj.toISOString()}
                style={{
                  minHeight: "110px",
                  padding: "0.45rem",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  background: isToday ? "rgba(99, 102, 241, 0.06)" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isToday) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isToday) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? "#6366f1" : "transparent",
                      color: isToday ? "#ffffff" : "#cbd5e1",
                    }}
                  >
                    {dateObj.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: "0.68rem", color: "#818cf8", fontWeight: 700 }}>
                      {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Event pills on this day */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", overflowY: "auto", maxHeight: "80px" }}>
                  {dayEvents.map((ev) => {
                    const pill = getEventPillStyle(ev.category);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => navigate(`/events/${ev.id}`)}
                        title={`${ev.title} (${ev.start_time} - ${ev.venue})`}
                        style={{
                          background: pill.bg,
                          color: pill.text,
                          border: `1px solid ${pill.border}`,
                          borderRadius: "4px",
                          padding: "0.15rem 0.35rem",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          transition: "transform 0.1s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        {ev.start_time.split(" ")[0]} • {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // WEEK VIEW GENERATION
  // -------------------------------------------------------------
  const renderWeekView = () => {
    // Find Sunday of the current week
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      weekDays.push(d);
    }

    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: "360px" }}>
        {weekDays.map((d, idx) => {
          const isToday = new Date().toDateString() === d.toDateString();
          const dayEvents = getEventsForDate(d);

          return (
            <div
              key={d.toISOString()}
              style={{
                borderRight: idx < 6 ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                background: isToday ? "rgba(99, 102, 241, 0.05)" : "transparent",
                display: "flex",
                flexDirection: "column",
                padding: "0.75rem 0.5rem",
              }}
            >
              {/* Header */}
              <div
                style={{
                  textAlign: "center",
                  paddingBottom: "0.6rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  marginBottom: "0.6rem",
                }}
              >
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                  {dayHeaders[idx]}
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: isToday ? "#818cf8" : "#f8fafc",
                    marginTop: "0.2rem",
                  }}
                >
                  {d.getDate()}
                </div>
              </div>

              {/* Event Cards in column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {dayEvents.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.75rem", padding: "1rem 0" }}>
                    No events
                  </div>
                ) : (
                  dayEvents.map((ev) => {
                    const pill = getEventPillStyle(ev.category);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => navigate(`/events/${ev.id}`)}
                        style={{
                          background: pill.bg,
                          border: `1px solid ${pill.border}`,
                          borderRadius: "8px",
                          padding: "0.5rem",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.8rem", color: pill.text, lineHeight: 1.25 }}>
                          {ev.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "#cbd5e1" }}>
                          <Clock size={11} /> {ev.start_time}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                          <MapPin size={11} /> {ev.venue}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // -------------------------------------------------------------
  // DAY VIEW GENERATION
  // -------------------------------------------------------------
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h4>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        {dayEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", background: "rgba(255, 255, 255, 0.02)", borderRadius: "10px" }}>
            <CalendarIcon size={36} style={{ opacity: 0.3, margin: "0 auto 0.5rem" }} />
            <div>No events scheduled for this day.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {dayEvents.map((ev) => {
              const pill = getEventPillStyle(ev.category);
              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${pill.border}`,
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                >
                  <div>
                    <span
                      style={{
                        background: pill.bg,
                        color: pill.text,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {ev.category}
                    </span>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0.4rem 0 0.2rem" }}>
                      {ev.title}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={13} color="#38bdf8" /> {ev.start_time} - {ev.end_time}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <MapPin size={13} color="#f472b6" /> {ev.venue}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#a5b4fc",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Title for current header
  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const sunday = new Date(currentDate);
      sunday.setDate(currentDate.getDate() - currentDate.getDay());
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${saturday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Calendar Header Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.4rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.02)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Navigation & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            {getHeaderTitle()}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button
              onClick={handlePrev}
              title="Previous"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                padding: "0.4rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              title="Next"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
                padding: "0.4rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleToday}
              style={{
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#c7d2fe",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Today
            </button>
          </div>
        </div>

        {/* View Mode Toggle Tabs (Month / Week / Day) */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.35)",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {["month", "week", "day"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background: viewMode === mode ? "#6366f1" : "transparent",
                color: viewMode === mode ? "#ffffff" : "#94a3b8",
                border: "none",
                padding: "0.4rem 0.9rem",
                borderRadius: "7px",
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "capitalize",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>
    </div>
  );
}
