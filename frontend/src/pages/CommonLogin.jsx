import React from "react";
import LoginForm from "../components/LoginForm";
import mitBuildingImg from "../assets/mit-building.jpg";
import mitLogoImg from "../assets/mit-logo.png";

export default function CommonLogin() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eaf3fa",
        backgroundImage: `
          radial-gradient(circle at 92% 8%, rgba(56, 189, 248, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 8% 92%, rgba(37, 99, 235, 0.12) 0%, transparent 45%),
          linear-gradient(135deg, #f0f7fe 0%, #e1effa 50%, #d4e8f7 100%)
        `,
        position: "relative",
        overflow: "hidden",
        padding: "1.5rem 1rem",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Decorative Outer Wave & Petal Patterns (matching reference image) */}
      {/* Top-Left Blue & Gold Swirl Accents */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d3b8c 0%, #1e40af 60%, transparent 100%)",
          opacity: 0.85,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Top-Left Gold Ribbon Arc */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "220px",
          height: "220px",
          pointerEvents: "none",
          zIndex: 2,
        }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M-20 80 Q 80 80, 80 -20"
          stroke="#f59e0b"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M-20 110 Q 110 110, 110 -20"
          stroke="rgba(245, 158, 11, 0.4)"
          strokeWidth="3"
        />
      </svg>

      {/* Top-Left Stylized Petal Motifs */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          opacity: 0.45,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <ellipse cx="25" cy="50" rx="20" ry="12" fill="#38bdf8" transform="rotate(-30 25 50)" />
          <ellipse cx="50" cy="25" rx="20" ry="12" fill="#60a5fa" transform="rotate(30 50 25)" />
          <ellipse cx="50" cy="75" rx="20" ry="12" fill="#93c5fd" transform="rotate(-60 50 75)" />
        </svg>
      </div>

      {/* Top-Right Halftone Dots Grid */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "160px",
          height: "160px",
          backgroundImage: "radial-gradient(#38bdf8 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          opacity: 0.65,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Bottom-Right Blue Ribbon Swooshes & Petals */}
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-80px",
          width: "360px",
          height: "360px",
          background: "linear-gradient(225deg, #0d3888 0%, #1d4ed8 45%, #60a5fa 90%)",
          borderRadius: "50%",
          opacity: 0.9,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          opacity: 0.6,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <ellipse cx="60" cy="30" rx="26" ry="16" fill="#bae6fd" transform="rotate(-40 60 30)" />
          <ellipse cx="30" cy="60" rx="26" ry="16" fill="#93c5fd" transform="rotate(40 30 60)" />
          <ellipse cx="85" cy="75" rx="26" ry="16" fill="#e0f2fe" transform="rotate(-15 85 75)" />
        </svg>
      </div>

      {/* Bottom-Left Gold Ribbon Arc */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "280px",
          height: "140px",
          pointerEvents: "none",
          zIndex: 2,
        }}
        viewBox="0 0 280 140"
        fill="none"
      >
        <path
          d="M0 120 C 100 130, 160 80, 260 120"
          stroke="#f59e0b"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M0 135 C 110 145, 170 95, 270 135"
          stroke="rgba(245, 158, 11, 0.4)"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* MAIN CARD CONTAINER (Split 2-Column Card) */}
      <div
        style={{
          width: "100%",
          maxWidth: "1040px",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 20px 45px -10px rgba(13, 43, 107, 0.35), 0 0 1px 1px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: MITT COLLEGE BRANDING & CAMPUS PHOTOGRAPH   */}
        {/* ======================================================== */}
        <div
          style={{
            flex: "1 1 480px",
            minHeight: "560px",
            backgroundColor: "#0d2b6b",
            background: "linear-gradient(155deg, #09255e 0%, #0d2b6b 40%, #092358 100%)",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* Top-Left Gold Diagonal Stripes (exact match to reference) */}
          <div
            style={{
              position: "absolute",
              top: "-15px",
              left: "-15px",
              width: "130px",
              height: "130px",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
              <line x1="0" y1="50" x2="50" y2="0" stroke="#f59e0b" strokeWidth="4" />
              <line x1="0" y1="75" x2="75" y2="0" stroke="#f59e0b" strokeWidth="3" />
              <line x1="0" y1="100" x2="100" y2="0" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Top Branding Section */}
          <div
            style={{
              padding: "2rem 1.75rem 1.25rem 1.75rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 2,
            }}
          >
            {/* MITT Circular Crest / Emblem */}
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)",
                padding: "4px",
                boxSizing: "border-box",
                marginBottom: "0.85rem",
              }}
            >
              <img
                src={mitLogoImg}
                alt="MITT Emblem"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "50%",
                }}
              />
            </div>

            {/* MITT Large Title */}
            <h2
              style={{
                fontSize: "2.1rem",
                fontWeight: 900,
                color: "#ffffff",
                margin: "0 0 0.25rem 0",
                letterSpacing: "0.08em",
                fontFamily: "'Times New Roman', 'Playfair Display', serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              MITT
            </h2>

            {/* Maharaja Institute of Technology with Gold Flanking Lines */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.55rem",
                width: "100%",
                maxWidth: "380px",
                margin: "0.2rem 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#f59e0b", opacity: 0.8 }} />
              <span
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Maharaja Institute of Technology
              </span>
              <div style={{ flex: 1, height: "1px", background: "#f59e0b", opacity: 0.8 }} />
            </div>

            {/* Thandavapura with Gold Flanking Lines */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.55rem",
                width: "100%",
                maxWidth: "240px",
                margin: "0.15rem 0 0.85rem 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#f59e0b", opacity: 0.8 }} />
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  letterSpacing: "0.09em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Thandavapura
              </span>
              <div style={{ flex: 1, height: "1px", background: "#f59e0b", opacity: 0.8 }} />
            </div>

            {/* SmartDept Title (Smart in White, Dept in Gold) */}
            <div style={{ position: "relative", display: "inline-block", margin: "0.2rem 0 0.35rem 0" }}>
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                Smart
              </span>
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "-0.02em",
                  color: "#f59e0b",
                }}
              >
                Dept
              </span>
              {/* Gold Underline */}
              <div
                style={{
                  width: "100%",
                  height: "2px",
                  background: "#f59e0b",
                  marginTop: "2px",
                }}
              />
            </div>

            {/* Subtitle in Italic Serif */}
            <p
              style={{
                fontSize: "0.86rem",
                fontStyle: "italic",
                color: "#e0f2fe",
                margin: "0.35rem 0 0 0",
                fontWeight: 400,
                fontFamily: "'Georgia', serif",
                letterSpacing: "0.01em",
              }}
            >
              Smart Department Academic & Campus Management System
            </p>
          </div>

          {/* Bottom Campus Photograph Section */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "260px",
              marginTop: "auto",
              overflow: "hidden",
            }}
          >
            <img
              src={mitBuildingImg}
              alt="MIT Thandavapura Campus Building"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 20%",
                display: "block",
              }}
            />
            {/* Subtle top shadow gradient connecting image to blue header */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "40px",
                background: "linear-gradient(180deg, rgba(13, 43, 107, 0.45) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LOGIN FORM (Exact match to reference)      */}
        {/* ======================================================== */}
        <div
          style={{
            flex: "1 1 480px",
            backgroundColor: "#ffffff",
            padding: "2.25rem 2.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <LoginForm />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .login-split-card {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
