import React, { useState } from "react";
import AttendanceInterval from "./AttendanceInterval";
import {
  Clock,
  Calendar,
  BookOpen,
  User,
  MapPin,
  Percent,
  CheckCircle2,
  Save,
  AlertCircle,
} from "lucide-react";

export default function AttendanceTable({
  sessionData,
  onSubmitAttendance,
  loading = false,
  readOnly = false,
}) {
  if (!sessionData) return null;

  const {
    timetable_id,
    subject_name,
    teacher_name,
    semester,
    section,
    room_name,
    date,
    time,
    intervals = [],
    students = [],
    attendance_completed = false,
  } = sessionData;

  // Track status per interval: { [intervalKey]: { [studentId]: "Present" | "Absent" } }
  const [intervalStatuses, setIntervalStatuses] = useState(() => {
    const initial = {};
    intervals.forEach((inv) => {
      const key = inv.id || inv.duration_number;
      initial[key] = {};

      if (inv.students && inv.students.length > 0) {
        inv.students.forEach((st) => {
          initial[key][st.id || st.student_id] = st.status || "Present";
        });
      } else {
        students.forEach((st) => {
          initial[key][st.id] = "Present";
        });
      }
    });
    return initial;
  });

  // Track method per interval: { [intervalKey]: { [studentId]: "FACE" | "BIOMETRIC" | "MANUAL" } }
  const [intervalMethods, setIntervalMethods] = useState(() => {
    const initial = {};
    intervals.forEach((inv) => {
      const key = inv.id || inv.duration_number;
      initial[key] = {};

      if (inv.students && inv.students.length > 0) {
        inv.students.forEach((st) => {
          initial[key][st.id || st.student_id] = st.attendance_method || "MANUAL";
        });
      } else {
        students.forEach((st) => {
          initial[key][st.id] = "MANUAL";
        });
      }
    });
    return initial;
  });

  // Track marked time per interval
  const [intervalTimes, setIntervalTimes] = useState(() => {
    const initial = {};
    intervals.forEach((inv) => {
      const key = inv.id || inv.duration_number;
      initial[key] = {};

      if (inv.students && inv.students.length > 0) {
        inv.students.forEach((st) => {
          initial[key][st.id || st.student_id] = st.time || inv.start_time;
        });
      } else {
        students.forEach((st) => {
          initial[key][st.id] = inv.start_time;
        });
      }
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState(
    intervals.length > 0 ? (intervals[0].id || intervals[0].duration_number) : 1
  );

  const handleToggle = (intervalKey, studentId, status) => {
    if (readOnly || attendance_completed) return;
    setIntervalStatuses((prev) => ({
      ...prev,
      [intervalKey]: {
        ...(prev[intervalKey] || {}),
        [studentId]: status,
      },
    }));
  };

  const handleMarkAllPresent = (intervalKey) => {
    if (readOnly || attendance_completed) return;
    setIntervalStatuses((prev) => {
      const updated = { ...(prev[intervalKey] || {}) };
      students.forEach((s) => {
        updated[s.id] = "Present";
      });
      return {
        ...prev,
        [intervalKey]: updated,
      };
    });
  };

  // Live calculation of minutes and percentage across all intervals
  let totalConductedMins = 0;
  let totalPresentMins = 0;

  intervals.forEach((inv) => {
    const key = inv.id || inv.duration_number;
    const durMins = inv.duration_minutes || 30;
    const statuses = intervalStatuses[key] || {};

    students.forEach((s) => {
      totalConductedMins += durMins;
      if ((statuses[s.id] || "Present") === "Present") {
        totalPresentMins += durMins;
      }
    });
  });

  const totalAbsentMins = totalConductedMins - totalPresentMins;
  const livePercentage =
    totalConductedMins > 0
      ? Math.round((totalPresentMins / totalConductedMins) * 100)
      : 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly || attendance_completed) return;

    // Build payload with 30-minute intervals
    const payloadIntervals = intervals.map((inv) => {
      const key = inv.id || inv.duration_number;
      const statuses = intervalStatuses[key] || {};
      const attendanceList = students.map((s) => ({
        student_id: s.id,
        status: statuses[s.id] || "Present",
      }));
      return {
        interval_id: inv.id,
        duration_number: inv.duration_number,
        attendance: attendanceList,
      };
    });

    onSubmitAttendance({
      timetable_id,
      date,
      intervals: payloadIntervals,
    });
  };

  return (
    <div className="space-y-6">
      {/* Session Master Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Semester {semester} – Section {section}
              </span>
              {attendance_completed && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Attendance Completed
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {subject_name || "Academic Subject"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Faculty: {teacher_name || "Assigned Faculty"}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Room: {room_name || "Classroom"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Date: {date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Time: {time}</span>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl text-center min-w-[90px]">
              <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Conducted
              </div>
              <div className="text-lg font-bold text-indigo-950 dark:text-white">
                {totalConductedMins}m
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 p-3 rounded-xl text-center min-w-[90px]">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Present
              </div>
              <div className="text-lg font-bold text-emerald-950 dark:text-white">
                {totalPresentMins}m
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 p-3 rounded-xl text-center min-w-[90px]">
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Absent
              </div>
              <div className="text-lg font-bold text-rose-950 dark:text-white">
                {totalAbsentMins}m
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 p-3 rounded-xl text-center min-w-[90px]">
              <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Attendance
              </div>
              <div className="text-lg font-bold text-purple-950 dark:text-white">
                {livePercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interval Tabs if multiple */}
      {intervals.length > 1 && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {intervals.map((inv) => {
            const key = inv.id || inv.duration_number;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                <span>Duration {inv.duration_number}</span>
                <span className="text-[11px] opacity-80">
                  ({inv.start_time} - {inv.end_time})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Render Active Interval or All Intervals */}
      {intervals
        .filter((inv) => (intervals.length > 1 ? (inv.id || inv.duration_number) === activeTab : true))
        .map((inv) => {
          const key = inv.id || inv.duration_number;
          return (
            <AttendanceInterval
              key={key}
              interval={inv}
              students={students}
              studentStatuses={intervalStatuses[key] || {}}
              studentMethods={intervalMethods[key] || {}}
              studentTimes={intervalTimes[key] || {}}
              onToggleStatus={handleToggle}
              onMarkAllPresent={handleMarkAllPresent}
              disabled={readOnly || attendance_completed}
            />
          );
        })}

      {/* Submission Footer */}
      {!readOnly && !attendance_completed && (
        <div className="flex justify-end gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? "Submitting..." : "Submit 30-Minute Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
