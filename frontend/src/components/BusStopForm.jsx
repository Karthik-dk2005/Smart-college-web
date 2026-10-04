import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function BusStopForm({ initialData = {}, isEdit = false, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    stop_order: 1,
    stop_name: "",
    latitude: "",
    longitude: "",
    pickup_time: "",
    drop_time: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        stop_order: initialData.stop_order || 1,
        stop_name: initialData.stop_name || "",
        latitude: initialData.latitude && initialData.latitude !== "Not provided" ? initialData.latitude : "",
        longitude: initialData.longitude && initialData.longitude !== "Not provided" ? initialData.longitude : "",
        pickup_time: initialData.pickup_time && initialData.pickup_time !== "Not provided" ? initialData.pickup_time : "",
        drop_time: initialData.drop_time && initialData.drop_time !== "Not provided" ? initialData.drop_time : "",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      stop_order: Number(formData.stop_order) || 1,
      stop_name: formData.stop_name.trim(),
      latitude: formData.latitude.trim() || "Not provided",
      longitude: formData.longitude.trim() || "Not provided",
      pickup_time: formData.pickup_time.trim() || "Not provided",
      drop_time: formData.drop_time.trim() || "Not provided",
      status: formData.status || "active",
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Stop Order *
          </label>
          <input
            required
            type="number"
            min="1"
            name="stop_order"
            value={formData.stop_order}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Stop Name *
          </label>
          <input
            required
            type="text"
            name="stop_name"
            value={formData.stop_name}
            onChange={handleChange}
            placeholder="e.g. Kuvempunagar Depot"
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Pickup Time
          </label>
          <input
            type="text"
            name="pickup_time"
            value={formData.pickup_time}
            onChange={handleChange}
            placeholder="e.g. 07:45 AM"
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Drop Time
          </label>
          <input
            type="text"
            name="drop_time"
            value={formData.drop_time}
            onChange={handleChange}
            placeholder="e.g. 05:15 PM"
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Latitude (Optional)
          </label>
          <input
            type="text"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Not provided"
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Longitude (Optional)
          </label>
          <input
            type="text"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Not provided"
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#cbd5e1",
              padding: "0.6rem 1.25rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            border: "none",
            color: "#fff",
            padding: "0.6rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Save size={15} />
          {loading ? "Saving..." : isEdit ? "Update Stop" : "Add Stop"}
        </button>
      </div>
    </form>
  );
}
