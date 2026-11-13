import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Calendar, Clock, MapPin, Building, Users, Check, AlertCircle, Loader2 } from "lucide-react";
import { departmentsApi, eventsApi, baseURL } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

const CATEGORIES = [
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
  "Other",
];

const TARGET_AUDIENCES = [
  "All Students",
  "Students",
  "Teachers",
  "HOD",
  "Specific Department",
  "Specific Semester",
  "Specific Section",
  "All Users",
];

export default function EventForm({ initialData = null, onSubmit, isSubmitting = false }) {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isHOD = role?.toLowerCase() === "hod";

  const [departments, setDepartments] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Technical",
    event_date: initialData?.event_date || "",
    start_time: initialData?.start_time || "10:00 AM",
    end_time: initialData?.end_time || "01:00 PM",
    venue: initialData?.venue || "",
    organizer: initialData?.organizer || "",
    department_id: initialData?.department_id !== undefined ? initialData.department_id : (isHOD ? user?.department_id : ""),
    target_audience: initialData?.target_audience || "All Students",
    target_semester: initialData?.target_semester || "",
    target_section: initialData?.target_section || "",
    registration_required: initialData?.registration_required !== undefined ? initialData.registration_required : true,
    registration_deadline: initialData?.registration_deadline ? initialData.registration_deadline.substring(0, 16) : "",
    max_participants: initialData?.max_participants || 100,
    status: initialData?.status || "Upcoming",
    is_published: initialData?.is_published !== undefined ? initialData.is_published : true,
    image_url: initialData?.image_url || "",
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentsApi.getAll();
        const depts = Array.isArray(res) ? res : res.data || [];
        setDepartments(depts);
      } catch (err) {
        console.warn("Could not load departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB.", "error");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast("Please select a valid image file (JPEG, PNG, WEBP, GIF).", "error");
      return;
    }

    try {
      setUploadingImage(true);
      const res = await eventsApi.uploadImage(file);
      const uploadedUrl = res.data?.image_url || res.url;
      setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
      showToast("Image uploaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload image.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast("Please enter an event title.", "warning");
      return;
    }
    if (!formData.event_date) {
      showToast("Please select an event date.", "warning");
      return;
    }
    if (!formData.venue.trim()) {
      showToast("Please specify the event venue.", "warning");
      return;
    }
    if (!formData.organizer.trim()) {
      showToast("Please specify the event organizer.", "warning");
      return;
    }

    // Format payload
    const payload = {
      ...formData,
      department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
      target_semester: formData.target_semester ? parseInt(formData.target_semester, 10) : null,
      target_section: formData.target_section ? formData.target_section : null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : 100,
      registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.4rem",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Basic Details */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>
          Event Details
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {/* Title */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>
              Event Title <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Python & AI Workshop 2026"
              required
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>
              Category <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label style={labelStyle}>Hosting Department</label>
            <select
              name="department_id"
              value={formData.department_id || ""}
              onChange={handleChange}
              disabled={isHOD}
              style={{ ...inputStyle, background: "#1f2937", opacity: isHOD ? 0.75 : 1 }}
            >
              <option value="">All Departments (Campus-wide)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code || "DEPT"})
                </option>
              ))}
            </select>
            {isHOD && (
              <small style={{ color: "#94a3b8", display: "block", marginTop: "0.25rem" }}>
                Locked to your assigned department (HOD policy).
              </small>
            )}
          </div>

          {/* Organizer */}
          <div>
            <label style={labelStyle}>
              Organizer <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="e.g. Computer Science Department"
              required
              style={inputStyle}
            />
          </div>

          {/* Venue */}
          <div>
            <label style={labelStyle}>
              Venue <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g. Seminar Hall Block B"
              required
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe agenda, topics covered, prerequisites, guest speakers..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* 2. Schedule & Target Audience */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>
          Schedule & Audience
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          {/* Event Date */}
          <div>
            <label style={labelStyle}>
              Event Date <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              required
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          {/* Start Time */}
          <div>
            <label style={labelStyle}>
              Start Time <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              placeholder="e.g. 10:00 AM"
              required
              style={inputStyle}
            />
          </div>

          {/* End Time */}
          <div>
            <label style={labelStyle}>
              End Time <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              placeholder="e.g. 01:00 PM"
              required
              style={inputStyle}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label style={labelStyle}>Target Audience</label>
            <select
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              {TARGET_AUDIENCES.map((ta) => (
                <option key={ta} value={ta}>
                  {ta}
                </option>
              ))}
            </select>
          </div>

          {/* Target Semester */}
          <div>
            <label style={labelStyle}>Specific Semester (Optional)</label>
            <input
              type="number"
              name="target_semester"
              min="1"
              max="8"
              value={formData.target_semester || ""}
              onChange={handleChange}
              placeholder="e.g. 5"
              style={inputStyle}
            />
          </div>

          {/* Target Section */}
          <div>
            <label style={labelStyle}>Specific Section (Optional)</label>
            <input
              type="text"
              name="target_section"
              value={formData.target_section}
              onChange={handleChange}
              placeholder="e.g. A"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 3. Registration Settings & Poster Image */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>
          Registration & Banner Image
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {/* Registration Required Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="checkbox"
              id="registration_required"
              name="registration_required"
              checked={formData.registration_required}
              onChange={handleChange}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#6366f1" }}
            />
            <label htmlFor="registration_required" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
              Require Prior Registration
            </label>
          </div>

          {/* Is Published Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#6366f1" }}
            />
            <label htmlFor="is_published" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
              Publish Immediately (Visible to users)
            </label>
          </div>

          {/* Registration Deadline */}
          {formData.registration_required && (
            <div>
              <label style={labelStyle}>Registration Deadline</label>
              <input
                type="datetime-local"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleChange}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          )}

          {/* Max Participants */}
          {formData.registration_required && (
            <div>
              <label style={labelStyle}>Maximum Capacity (Participants)</label>
              <input
                type="number"
                name="max_participants"
                min="1"
                value={formData.max_participants}
                onChange={handleChange}
                placeholder="100"
                style={inputStyle}
              />
            </div>
          )}

          {/* Event Status Override */}
          <div>
            <label style={labelStyle}>Status Override</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Banner Image Upload */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Event Poster / Banner Image</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.1rem",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px dashed rgba(99, 102, 241, 0.4)",
                  color: "#c7d2fe",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                }}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Choose Image File (Max 5MB)
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                />
              </label>

              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>or enter Image URL:</span>

              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
                style={{ ...inputStyle, flex: 1, minWidth: "220px" }}
              />
            </div>

            {/* Image Preview */}
            {formData.image_url && (
              <div style={{ marginTop: "0.75rem", position: "relative", width: "fit-content" }}>
                <img
                  src={formData.image_url.startsWith("/uploads") ? `${baseURL}${formData.image_url}` : formData.image_url}
                  alt="Preview"
                  style={{
                    height: "120px",
                    width: "auto",
                    maxWidth: "280px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                  title="Remove image"
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#f8fafc",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          style={{
            padding: "0.75rem 1.75rem",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "#ffffff",
            border: "none",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving Event...
            </>
          ) : (
            <>
              <Check size={16} /> Save Event
            </>
          )}
        </button>
      </div>
    </form>
  );
}
