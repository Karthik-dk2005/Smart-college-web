import React from "react";

export default function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div style={{ width: "100%", padding: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "8px",
            }}
          >
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                style={{
                  height: "18px",
                  borderRadius: "4px",
                  background:
                    "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.09) 50%, rgba(255, 255, 255, 0.04) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
