import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";

export default function BusRouteForm({ initialData = {}, isEdit = false, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    route_number: "",
    route_name: "",
    bus_number: "",
    driver_name: "",
    driver_phone: "",
    start_point: "",
    end_point: "",
    departure_time: "",
    arrival_time: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        route_number: initialData.route_number || "",
        route_name: initialData.route_name || "",
        bus_number: initialData.bus_number && initialData.bus_number !== "Not provided" ? initialData.bus_number : "",
        driver_name: initialData.driver_name && initialData.driver_name !== "Not provided" ? initialData.driver_name : "",
        driver_phone: initialData.driver_phone && initialData.driver_phone !== "Not provided" ? initialData.driver_phone : "",
        start_point: initialData.start_point && initialData.start_point !== "Not provided" ? initialData.start_point : "",
        end_point: initialData.end_point && initialData.end_point !== "Not provided" ? initialData.end_point : "",
        departure_time: initialData.departure_time && initialData.departure_time !== "Not provided" ? initialData.departure_time : "",
        arrival_time: initialData.arrival_time && initialData.arrival_time !== "Not provided" ? initialData.arrival_time : "",
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
      ...formData,
      route_number: Number(formData.route_number),
      route_name: formData.route_name || `Route ${formData.route_number}`,
      bus_number: formData.bus_number.trim() || "Not provided",
      driver_name: formData.driver_name.trim() || "Not provided",
      driver_phone: formData.driver_phone.trim() || "Not provided",
      start_point: formData.start_point.trim() || "Not provided",
      end_point: formData.end_point.trim() || "Campus Main Gate",
      departure_time: formData.departure_time.trim() || "Not provided",
      arrival_time: formData.arrival_time.trim() || "Not provided",
      status: formData.status || "active",
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Route Identification */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Route Number *
          </label>
          <input
            required
            type="number"
            min="1"
            name="route_number"
            disabled={isEdit}
            value={formData.route_number}
            onChange={handleChange}
            placeholder="e.g. 12"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
              background: isEdit ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: isEdit ? "#94a3b8" : "#fff",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Route Name *
          </label>
          <input
            required
            type="text"
            name="route_name"
            value={formData.route_name}
            onChange={handleChange}
            placeholder="e.g. Route 12 - Kuvempunagar Express"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Bus and Driver Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Bus Number
          </label>
          <input
            type="text"
            name="bus_number"
            value={formData.bus_number}
            onChange={handleChange}
            placeholder="e.g. KA-09-F-1012"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
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
            Driver Name
          </label>
          <input
            type="text"
            name="driver_name"
            value={formData.driver_name}
            onChange={handleChange}
            placeholder="e.g. Manjunath K"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
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
            Driver Phone
          </label>
          <input
            type="text"
            name="driver_phone"
            value={formData.driver_phone}
            onChange={handleChange}
            placeholder="e.g. +91 98450 67890"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Start / End Points */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Start Point
          </label>
          <input
            type="text"
            name="start_point"
            value={formData.start_point}
            onChange={handleChange}
            placeholder="e.g. Kuvempunagar Complex"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
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
            End Point
          </label>
          <input
            type="text"
            name="end_point"
            value={formData.end_point}
            onChange={handleChange}
            placeholder="e.g. Campus Main Gate"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Timings & Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
            Departure Time
          </label>
          <input
            type="text"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
            placeholder="e.g. 07:45 AM"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
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
            Arrival Time
          </label>
          <input
            type="text"
            name="arrival_time"
            value={formData.arrival_time}
            onChange={handleChange}
            placeholder="e.g. 08:35 AM"
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
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
              padding: "0.6rem 0.85rem",
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

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#cbd5e1",
              padding: "0.65rem 1.4rem",
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
            padding: "0.65rem 1.6rem",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
          }}
        >
          <Save size={16} />
          {loading ? "Saving..." : isEdit ? "Save Route" : "Add Route"}
        </button>
      </div>
    </form>
  );
}
