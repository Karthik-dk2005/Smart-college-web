import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { timetableApi, subjectsApi, facultyApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import TableSkeleton from "../components/TableSkeleton";
import {
  Calendar,
  Clock,
  Building,
  User,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen,
  CalendarCheck,
  Printer,
} from "lucide-react";
import CollegeLogo from "../components/CollegeLogo";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const canModify = ["admin", "hod"].includes(role?.toLowerCase());

  const [timetableSlots, setTimetableSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSemester, setSelectedSemester] = useState("5");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialFormState = {
    department_id: 1,
    semester: 5,
    section: "A",
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    subject_id: "",
    faculty_id: "",
    room_number: "CS-303",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        semester: Number(selectedSemester),
        section: selectedSection,
      };
      if (selectedDay) params.day = selectedDay;
      if (selectedFacultyId) params.faculty_id = Number(selectedFacultyId);

      const [resTT, resSub, resFac] = await Promise.all([
        timetableApi.getAll(params),
        subjectsApi.getAll().catch(() => ({ data: [] })),
        facultyApi.getAll().catch(() => ({ data: [] })),
      ]);

      setTimetableSlots(resTT.data || resTT || []);
      setSubjects(resSub.data || resSub || []);
      setFacultyList(resFac.data || resFac || []);
    } catch (err) {
      error(err.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDay, selectedSection, selectedSemester, selectedFacultyId]);

  // Create slot
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await timetableApi.create({
        ...formData,
        semester: Number(formData.semester),
        department_id: 1,
        subject_id: Number(formData.subject_id),
        faculty_id: Number(formData.faculty_id),
        room_number: formData.section === "A" ? "CS-303" : "CS-304",
      });
      success("Timetable slot scheduled successfully!");
      setIsCreateOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to create timetable slot");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit slot
  const openEdit = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      department_id: slot.department_id,
      semester: slot.semester,
      section: slot.section,
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject_id: String(slot.subject_id),
      faculty_id: String(slot.faculty_id),
      room_number: slot.room_number,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await timetableApi.update(selectedSlot.id, {
        day: formData.day,
        start_time: formData.start_time,
        end_time: formData.end_time,
        subject_id: Number(formData.subject_id),
        faculty_id: Number(formData.faculty_id),
        room_number: formData.room_number,
      });
      success("Timetable slot updated successfully!");
      setIsEditOpen(false);
      setSelectedSlot(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to update timetable slot");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete slot
  const openDelete = (slot) => {
    setSelectedSlot(slot);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await timetableApi.delete(selectedSlot.id);
      success("Timetable slot removed successfully");
      setIsDeleteOpen(false);
      setSelectedSlot(null);
      fetchData();
    } catch (err) {
      error(err.message || "Failed to delete slot");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Printable College Header for Timetable */}
      <div className="print-only-header">
        <CollegeLogo size="lg" style={{ height: "72px", width: "auto" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.03em" }}>
            MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>
            DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
          </div>
          <div style={{ fontSize: "0.8rem", color: "#475569" }}>
            Official Academic Timetable • Semester {selectedSemester} (Section {selectedSection}) • Academic Year 2026–2027
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "6px 12px", borderRadius: "12px", display: "flex", alignItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
            <CollegeLogo size="sm" style={{ height: "46px", width: "auto" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "#818cf8",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "12px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                MIT Thandavapura
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Academic Schedule</span>
            </div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc", margin: "0.2rem 0 0" }}>
              Academic Timetable
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Department of Computer Science & Engineering • 5th Semester ODD SEM
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "0.6rem 0.95rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={15} />
            <span>Print Timetable</span>
          </button>

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
                setFormData({
                  ...initialFormState,
                  day: selectedDay,
                  section: selectedSection,
                  room_number: selectedSection === "A" ? "CS-303" : "CS-304",
                  subject_id: subjects[0]?.id ? String(subjects[0].id) : "",
                  faculty_id: facultyList[0]?.id ? String(facultyList[0].id) : "",
                });
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
              <span>Add Timetable Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Section & Room Quick Selector Pills */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setSelectedSection("A")}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: selectedSection === "A" ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
              background: selectedSection === "A" ? "#6366f1" : "rgba(255, 255, 255, 0.03)",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Section A — Room CS-303
          </button>
          <button
            onClick={() => setSelectedSection("B")}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              border: selectedSection === "B" ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
              background: selectedSection === "B" ? "#6366f1" : "rgba(255, 255, 255, 0.03)",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Section B — Room CS-304
          </button>
        </div>

        {/* Faculty Filter */}
        <select
          value={selectedFacultyId}
          onChange={(e) => setSelectedFacultyId(e.target.value)}
          style={{
            padding: "0.55rem 0.75rem",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "#f8fafc",
            fontSize: "0.85rem",
            outline: "none",
          }}
        >
          <option value="" style={{ background: "#111827" }}>All Faculty Members</option>
          {facultyList.map((f) => (
            <option key={f.id} value={f.id} style={{ background: "#111827" }}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Day Selector Pills */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        {DAYS.map((day) => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: "1 0 auto",
                padding: "0.65rem 1.25rem",
                borderRadius: "10px",
                border: isActive ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                background: isActive ? "rgba(99, 102, 241, 0.2)" : "rgba(17, 24, 39, 0.8)",
                color: isActive ? "#fff" : "var(--text-secondary, #94a3b8)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Timetable Period Slots Grid */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
              {selectedDay} Schedule — Section {selectedSection}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
              Assigned Hall: {selectedSection === "A" ? "Room CS-303" : "Room CS-304"}
            </span>
          </div>

          <span
            style={{
              fontSize: "0.78rem",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#94a3b8",
              padding: "0.25rem 0.65rem",
              borderRadius: "6px",
            }}
          >
            {timetableSlots.length} Scheduled Periods
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : timetableSlots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            <Calendar size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f8fafc" }}>No Periods Scheduled</div>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              No classes registered for {selectedDay} in Section {selectedSection}.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {timetableSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                    <span
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#c7d2fe",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {slot.start_time} - {slot.end_time}
                    </span>

                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#a7f3d0",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {slot.room_number}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0.2rem 0" }}>
                    {slot.subject?.subject_name || "Course Subject"}
                  </h4>
                  <div style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 600 }}>
                    {slot.subject?.subject_code} • {slot.subject?.credits || 4} Credits
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      marginTop: "0.75rem",
                    }}
                  >
                    <User size={14} color="#a855f7" />
                    <span>{slot.faculty?.name || "Assigned Faculty"}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    flexWrap: "wrap",
                  }}
                >
                  {["teacher", "faculty", "admin", "hod"].includes(role?.toLowerCase()) ? (
                    <Link
                      to={`/attendance/session/${slot.id}`}
                      style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        color: "#fff",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        boxShadow: "0 2px 6px rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      <CalendarCheck size={12} /> Take Attendance
                    </Link>
                  ) : <div />}

                  {canModify && (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        onClick={() => openEdit(slot)}
                        title="Edit Slot"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#f59e0b",
                          borderRadius: "6px",
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => openDelete(slot)}
                        title="Delete Slot"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          color: "#ef4444",
                          borderRadius: "6px",
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Slot */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule Timetable Slot">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Day of Week *
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
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
              >
                {DAYS.map((d) => (
                  <option key={d} value={d} style={{ background: "#111827" }}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    section: e.target.value,
                    room_number: e.target.value === "A" ? "CS-303" : "CS-304",
                  })
                }
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
              >
                <option value="A" style={{ background: "#111827" }}>Section A (Room CS-303)</option>
                <option value="B" style={{ background: "#111827" }}>Section B (Room CS-304)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Start Time *
              </label>
              <input
                type="text"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                placeholder="09:00"
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
                End Time *
              </label>
              <input
                type="text"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                placeholder="10:00"
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
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Subject Course *
            </label>
            <select
              required
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
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
            >
              <option value="" style={{ background: "#111827" }}>Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "#111827" }}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Assigned Faculty *
            </label>
            <select
              required
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
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
            >
              <option value="" style={{ background: "#111827" }}>Select Faculty...</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id} style={{ background: "#111827" }}>
                  {f.name} ({f.designation})
                </option>
              ))}
            </select>
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
              {formLoading ? "Scheduling..." : "Schedule Slot"}
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
        title="Remove Timetable Period"
        message={`Delete scheduled slot: ${selectedSlot?.day} ${selectedSlot?.start_time}-${selectedSlot?.end_time} in Section ${selectedSlot?.section}?`}
      />
    </div>
  );
}



