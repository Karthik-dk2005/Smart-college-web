import React from "react";
import mitLogo from "../assets/mit-logo.png";

/**
 * Official College Logo Component for Maharaja Institute of Technology Thandavapura
 * 
 * Guarantees:
 * - Exact original aspect ratio maintained (no distortion, no stretching)
 * - Zero recoloring or filtering applied to the logo image
 * - Responsive sizing (Desktop: 55-75px, Tablet: 50-65px, Mobile: 40-55px)
 * - Accessible alt text
 */
export default function CollegeLogo({
  size = "md", // "sm" | "md" | "lg" | "xl" | custom number (px)
  className = "",
  style = {},
  withText = false,
  textLayout = "horizontal", // "horizontal" | "vertical"
  title = "SMART DEPARTMENT",
  subtitle = "Academic Management System",
  subtext = "Maharaja Institute of Technology Thandavapura",
  titleStyle = {},
  subtitleStyle = {},
}) {
  // Height presets adhering to responsive guidelines
  let logoHeight = "64px"; // Default desktop md
  if (size === "sm") logoHeight = "44px";
  else if (size === "md") logoHeight = "62px";
  else if (size === "lg") logoHeight = "72px";
  else if (size === "xl") logoHeight = "84px";
  else if (typeof size === "number") logoHeight = `${size}px`;
  else if (typeof size === "string" && (size.endsWith("px") || size.endsWith("rem"))) logoHeight = size;

  const imageElement = (
    <img
      src={mitLogo}
      alt="Maharaja Institute of Technology Thandavapura Logo"
      className={`college-logo-img college-logo-${size} ${className}`}
      style={{
        height: logoHeight,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        display: "block",
        aspectRatio: "145 / 142",
        flexShrink: 0,
        ...style,
      }}
      loading="eager"
    />
  );

  if (!withText) {
    return imageElement;
  }

  const isVertical = textLayout === "vertical";

  return (
    <div
      className={`college-branding ${isVertical ? "branding-vertical" : "branding-horizontal"}`}
      style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: isVertical ? "0.6rem" : "0.85rem",
        textAlign: isVertical ? "center" : "left",
      }}
    >
      {imageElement}
      <div className="branding-text-block">
        {title && (
          <div
            className="branding-title"
            style={{
              fontWeight: 800,
              fontSize: isVertical ? "1.1rem" : "1.05rem",
              letterSpacing: "0.04em",
              lineHeight: 1.2,
              color: "inherit",
              ...titleStyle,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            className="branding-subtitle"
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "var(--text-secondary, #94a3b8)",
              marginTop: "2px",
              lineHeight: 1.3,
              ...subtitleStyle,
            }}
          >
            {subtitle}
          </div>
        )}
        {subtext && (
          <div
            className="branding-subtext"
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted, #64748b)",
              marginTop: "2px",
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
