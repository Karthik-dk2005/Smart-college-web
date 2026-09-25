import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { BookOpen, Download, FileText, Filter, Loader2, RefreshCw, ExternalLink } from "lucide-react";

export default function StudentMaterialsView() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState("");

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.getMaterials(null, filterUnit || null);
      if (Array.isArray(res)) {
        setMaterials(res);
      }
    } catch (err) {
      console.error("Materials fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filterUnit]);

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Course Study Materials & Notes
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Lecture Notes, Question Banks, Lab Manuals, and Unit-wise References
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchMaterials}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <input
            type="text"
            className="form-control"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            placeholder="Search by unit (e.g. Unit 1, Unit 3)..."
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <BookOpen size={18} color="#6366f1" />
            <span>Uploaded Department Repositories</span>
          </h2>
          <span className="badge badge-info">{materials.length} Documents Available</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 size={32} className="animate-spin" color="#6366f1" />
          </div>
        ) : materials.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            No study materials found matching your search.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {materials.map((mat) => (
              <div
                key={mat.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge badge-purple">{mat.unit}</span>
                    <span className="badge badge-info">{mat.material_type}</span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginTop: "0.75rem" }}>
                    {mat.title}
                  </h3>

                  {mat.description && (
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                      {mat.description}
                    </p>
                  )}

                  {mat.important_questions_attached && (
                    <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.5rem", fontWeight: 600 }}>
                      ✓ Includes Important VTU Viva & Exam Questions
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ width: "100%", textDecoration: "none" }}
                  >
                    <Download size={14} />
                    <span>Download Material PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
