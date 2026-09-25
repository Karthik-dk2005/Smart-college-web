import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Calendar,
  Clock,
  User,
  Building,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetableView() {
  const [timetable, setTimetable] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [loading, setLoading] = useState(true);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentTimetable();
      if (res && res.timetable) {
        setTimetable(res.timetable);
      }
    } catch (err) {
      console.error("Timetable fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const daySlots = timetable.filter((slot) => slot.day_of_week === selectedDay);

  if (loading && timetable.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Weekly Academic Timetable
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Department of Computer Science & Engineering • Dynamic Scheduling Engine
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchTimetable}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Day Selector Pills */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {DAYS.map((day) => {
          const count = timetable.filter((t) => t.day_of_week === day).length;
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="btn"
              style={{
                background: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.03)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                borderColor: isActive ? "var(--accent-primary)" : "var(--border-color)",
                padding: "0.6rem 1.25rem",
              }}
            >
              <span>{day}</span>
              <span
                style={{
                  background: isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.06)",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slots for Selected Day */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Calendar size={18} color="#6366f1" />
            <span>Class Slots for {selectedDay}</span>
          </h2>
          <span className="badge badge-info">{daySlots.length} Classes</span>
        </div>

        {daySlots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            No scheduled classes for {selectedDay}. Enjoy your academic self-study hours!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  background: slot.is_temporary_change
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: slot.is_temporary_change
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                      {slot.subject?.name || "Subject Code"}
                    </span>
                    <span className="badge badge-purple">{slot.subject?.code}</span>
                    {slot.is_temporary_change && (
                      <span className="badge badge-warning" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertTriangle size={12} />
                        <span>Dynamic Schedule Change</span>
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <User size={14} color="#6366f1" />
                      <span>
                        {slot.substitute_teacher ? (
                          <strong style={{ color: "#fbbf24" }}>
                            Substitute Faculty: {slot.substitute_teacher?.user?.full_name}
                          </strong>
                        ) : (
                          `Faculty: ${slot.teacher?.user?.full_name || "Assigned Faculty"}`
                        )}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Building size={14} color="#06b6d4" />
                      <span>Room: <strong>{slot.room?.room_number || "TBD"}</strong> ({slot.room?.building || "Turing Block"})</span>
                    </div>

                    {slot.change_reason && (
                      <div style={{ color: "#fbbf24", fontStyle: "italic" }}>
                        Note: {slot.change_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#a5b4fc",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  <Clock size={16} />
                  <span>{slot.start_time} - {slot.end_time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
