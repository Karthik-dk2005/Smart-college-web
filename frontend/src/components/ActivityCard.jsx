import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Building,
  MapPin,
  Award,
  Layers,
  FileCheck,
  ChevronRight,
  Edit2,
  Trash2,
  AlertCircle
} from "lucide-react";
import ActivityStatusBadge from "./ActivityStatusBadge";

export default function ActivityCard({
  activity,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const {
    id,
    title,
    activity_type,
    level,
    activity_date,
    position_award,
    organizing_institution,
    location,
    status,
    files = [],
    latest_verification,
  } = activity;

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Determine icon based on type
  const getTypeEmoji = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("hackathon") || t.includes("competition")) return "🏆";
    if (t.includes("sport")) return "⚽";
    if (t.includes("cultural")) return "🎭";
    if (t.includes("workshop")) return "🛠️";
    if (t.includes("seminar") || t.includes("conference")) return "📢";
    if (t.includes("internship")) return "💼";
    if (t.includes("project")) return "💻";
    if (t.includes("certification")) return "📜";
    return "🏅";
  };

  return (
    <div className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full ${
        status === "VERIFIED"
          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
          : status === "REJECTED"
          ? "bg-gradient-to-r from-rose-500 to-red-400"
          : "bg-gradient-to-r from-amber-500 to-yellow-400"
      }`} />

      <div className="p-5 flex-1">
        {/* Header: Title & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-2xl shrink-0 leading-none select-none">
              {getTypeEmoji(activity_type)}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-100 text-base group-hover:text-sky-400 transition-colors line-clamp-2">
                {title}
              </h3>
              {organizing_institution && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{organizing_institution}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <ActivityStatusBadge status={status} />
        </div>

        {/* Structured Grid Info */}
        <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-slate-800/80 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Type</span>
            <span className="font-medium text-slate-200 mt-0.5 block truncate">{activity_type || "General"}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Level</span>
            <span className="font-medium text-slate-200 mt-0.5 block truncate">{level || "University"}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Date</span>
            <span className="font-medium text-slate-200 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{formatDate(activity_date)}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Position</span>
            <span className="font-medium text-amber-400 mt-0.5 flex items-center gap-1 truncate">
              <Award className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{position_award || "Participant"}</span>
            </span>
          </div>
        </div>

        {/* Rejection notice if rejected */}
        {status === "REJECTED" && latest_verification?.rejection_reason && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-rose-400 block">Reason for Rejection:</span>
              <p className="line-clamp-2 text-rose-200/90">{latest_verification.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Certificate Attached Indicator */}
        {files.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{files.length} Evidence Document{files.length > 1 ? "s" : ""} Attached</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Link
          to={`/student/activities/${id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition-colors"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-1.5">
          {canEdit && status !== "VERIFIED" && (
            <Link
              to={`/student/activities/${id}/edit`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
              title="Edit Activity"
            >
              <Edit2 className="w-4 h-4" />
            </Link>
          )}

          {canDelete && status !== "VERIFIED" && (
            <button
              onClick={() => onDelete && onDelete(id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Activity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
