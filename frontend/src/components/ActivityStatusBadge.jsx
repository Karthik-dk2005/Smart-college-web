import React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export default function ActivityStatusBadge({ status, className = "" }) {
  const norm = (status || "").toUpperCase();

  if (norm === "VERIFIED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ✓ Verified
      </span>
    );
  }

  if (norm === "REJECTED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm ${className}`}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        ✕ Rejected
      </span>
    );
  }

  // Default: PENDING
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      ⏳ Pending
    </span>
  );
}
