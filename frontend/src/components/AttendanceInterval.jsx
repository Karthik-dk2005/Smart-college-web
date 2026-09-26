import React from "react";
import { Clock, CheckCircle2, XCircle, Users, ScanFace, Fingerprint, Edit3 } from "lucide-react";

export default function AttendanceInterval({
  interval,
  students = [],
  studentStatuses = {},
  studentMethods = {},
  studentTimes = {},
  onToggleStatus,
  onMarkAllPresent,
  disabled = false,
}) {
  const durationNumber = interval.duration_number || 1;
  const startTime = interval.start_time || "09:00";
  const endTime = interval.end_time || "09:30";
  const durationMins = interval.duration_minutes || 30;

  // Calculate live counts for this interval
  const presentCount = students.filter(
    (s) => (studentStatuses[s.id] || "Present") === "Present"
  ).length;
  const absentCount = students.length - presentCount;

  const getMethodBadge = (status, method) => {
    if (status !== "Present") {
      return <span className="text-gray-400 font-mono">-</span>;
    }
    const m = (method || "MANUAL").toUpperCase();
    if (m === "FACE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <ScanFace className="w-3 h-3" />
          FACE
        </span>
      );
    }
    if (m === "BIOMETRIC") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Fingerprint className="w-3 h-3" />
          BIOMETRIC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
        <Edit3 className="w-3 h-3" />
        MANUAL
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
      {/* Interval Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
              Duration {durationNumber}
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>
                {startTime} – {endTime}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                ({durationMins} minutes)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {presentCount} Present
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              {absentCount} Absent
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 dark:text-gray-400">
              {students.length} Total Students
            </span>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={() => onMarkAllPresent(interval.id || durationNumber)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All Present
          </button>
        )}
      </div>

      {/* Structured Attendance Table Matching Section: Student ID | Student Name | Status | Method | Time */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-6">Student ID</th>
              <th className="py-3 px-6">Student Name</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Method</th>
              <th className="py-3 px-4 text-center">Time</th>
              {!disabled && <th className="py-3 px-6 text-right">Toggle</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                  No students found for this class section.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isPresent = (studentStatuses[student.id] || "Present") === "Present";
                const rollNo = student.roll_no || student.usn || student.student_id || `STU${student.id}`;
                const method = studentMethods[student.id] || (isPresent ? "MANUAL" : "-");
                const markedTime = isPresent ? (studentTimes[student.id] || startTime) : "-";

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono font-semibold text-gray-800 dark:text-gray-200 text-xs">
                      {rollNo}
                    </td>

                    <td className="py-3.5 px-6 font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isPresent
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getMethodBadge(isPresent ? "Present" : "Absent", method)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-gray-600 dark:text-gray-400">
                      {markedTime}
                    </td>

                    {!disabled && (
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleStatus(interval.id || durationNumber, student.id, "Present")
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-emerald-100"
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleStatus(interval.id || durationNumber, student.id, "Absent")
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              !isPresent
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-rose-100"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
