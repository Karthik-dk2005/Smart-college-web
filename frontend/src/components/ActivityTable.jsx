import React from "react";
import { Link } from "react-router-dom";
import { Eye, CheckCircle2, XCircle, FileText, Calendar, Building } from "lucide-react";
import ActivityStatusBadge from "./ActivityStatusBadge";

export default function ActivityTable({
  activities = [],
  onVerify,
  onReject,
  canVerify = false,
  showStudentInfo = true,
  loading = false,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading activities...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-base font-medium text-slate-300">No student activities found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            {showStudentInfo && (
              <>
                <th className="px-5 py-3.5 font-semibold">Student ID</th>
                <th className="px-5 py-3.5 font-semibold">Student Name</th>
              </>
            )}
            <th className="px-5 py-3.5 font-semibold">Activity</th>
            <th className="px-5 py-3.5 font-semibold">Type</th>
            <th className="px-5 py-3.5 font-semibold">Level</th>
            <th className="px-5 py-3.5 font-semibold">Date</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {activities.map((act) => {
            const isPending = act.status === "PENDING";
            return (
              <tr
                key={act.id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {showStudentInfo && (
                  <>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {act.student_usn || "—"}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200 whitespace-nowrap">
                      <div>{act.student_name || "—"}</div>
                      {act.department_name && (
                        <div className="text-[11px] text-slate-500">{act.department_name}</div>
                      )}
                    </td>
                  </>
                )}

                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors max-w-xs truncate">
                    {act.title}
                  </div>
                  {act.position_award && (
                    <div className="text-xs text-amber-400 font-medium mt-0.5">
                      {act.position_award}
                    </div>
                  )}
                  {act.organizing_institution && (
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 shrink-0" />
                      <span className="truncate">{act.organizing_institution}</span>
                    </div>
                  )}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {act.activity_type}
                  </span>
                </td>

                <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-300">
                  {act.level || "College"}
                </td>

                <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(act.activity_date)}
                  </span>
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <ActivityStatusBadge status={act.status} />
                </td>

                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {/* View Button */}
                    <Link
                      to={`/student/activities/${act.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    {/* Verify & Reject Actions for Admin / HOD */}
                    {canVerify && isPending && (
                      <>
                        <button
                          onClick={() => onVerify && onVerify(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                          title="Verify Achievement"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>

                        <button
                          onClick={() => onReject && onReject(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                          title="Reject Achievement"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
