import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { departmentsApi, announcementsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CollegeLogo from "../components/CollegeLogo";
import { Check, Loader2, AlertCircle } from "lucide-react";

export default function EditAnnouncement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const isHOD = role?.toLowerCase() === "hod";

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "Normal",
    target_audience: "All Users",
    department_id: "",
    publish_date: "",
    expiry_date: "",
    status: "Active",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [depts, ann] = await Promise.all([
          departmentsApi.getAll(),
          announcementsApi.getById(id),
        ]);
        setDepartments(Array.isArray(depts) ? depts : depts.data || []);
        setFormData({
          title: ann.title || "",
          content: ann.content || "",
          category: ann.category || "General",
          priority: ann.priority || "Normal",
          target_audience: ann.target_audience || "All Users",
          department_id: ann.department_id || "",
          publish_date: ann.publish_date || "",
          expiry_date: ann.expiry_date || "",
          status: ann.status || "Active",
        });
      } catch (err) {
        setError(err.message || "Failed to load announcement.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("Please provide both title and content.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        expiry_date: formData.expiry_date || null,
      };
      await announcementsApi.update(id, payload);
      showToast("Announcement updated successfully!", "success");
      navigate("/announcements");
    } catch (err) {
      showToast(err.message || "Failed to update announcement.", "error");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "#94a3b8" }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
        <div>Loading announcement details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#fca5a5" }}>
        <AlertCircle size={36} style={{ margin: "0 auto 1rem" }} />
        <h3>Cannot Edit Announcement</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          padding: "1.5rem 1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            Edit Announcement
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem", margin: 0 }}>
            Update notice content, priority level, or publishing schedule.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Title */}
        <div>
          <label style={labelStyle}>
            Announcement Title <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* Priority & Category */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Priority Level</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Examination">Examination</option>
              <option value="Placement">Placement</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
        </div>

        {/* Target Audience & Department */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Target Audience</label>
            <select
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              style={{ ...inputStyle, background: "#1f2937" }}
            >
              <option value="All Users">All Users</option>
              <option value="All Students">All Students</option>
              <option value="Students">Students Only</option>
              <option value="Teachers">Teachers Only</option>
              <option value="HOD">HODs Only</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Department</label>
            <select
              name="department_id"
              value={formData.department_id || ""}
              onChange={handleChange}
              disabled={isHOD}
              style={{ ...inputStyle, background: "#1f2937", opacity: isHOD ? 0.75 : 1 }}
            >
              <option value="">Campus-wide (All Departments)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={labelStyle}>
            Content / Body <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleChange}
            required
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Publish Date & Expiry Date */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Publish Date</label>
            <input
              type="date"
              name="publish_date"
              value={formData.publish_date}
              onChange={handleChange}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Expiry Date (Optional)</label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
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
            disabled={submitting}
            style={{
              padding: "0.75rem 1.75rem",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Check size={16} /> Update Announcement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
