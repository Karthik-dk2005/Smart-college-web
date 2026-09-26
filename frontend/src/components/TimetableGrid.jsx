import React from "react";
import { Clock, MapPin, User, BookOpen } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableGrid({
  timetables = [],
  onSlotClick = null,
  onTakeAttendance = null,
  isTeacher = false,
  loggedInTeacherId = null,
}) {
  // Extract unique sorted time slots or group by time
  const timeSlots = Array.from(
    new Set(
      timetables.map((t) => `${t.start_time || "09:00"} - ${t.end_time || "10:00"}`)
    )
  ).sort();

  // If no time slots, provide default schedule periods
  const displayTimeSlots =
    timeSlots.length > 0
      ? timeSlots
      : [
          "09:00 - 10:00",
          "10:00 - 11:00",
          "11:15 - 12:15",
          "12:15 - 13:15",
          "14:00 - 15:00",
          "15:00 - 16:00",
        ];

  // Helper to find slot for day + time
  const getSlot = (day, timeRange) => {
    return timetables.find((t) => {
      const matchDay = (t.day || "").toLowerCase() === day.toLowerCase();
      const matchTime =
        `${t.start_time || "09:00"} - ${t.end_time || "10:00"}` === timeRange;
      return matchDay && matchTime;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="py-4 px-4 text-center w-36 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>TIME</span>
                </div>
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="py-4 px-4 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {displayTimeSlots.map((timeRange) => (
              <tr key={timeRange} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/20">
                <td className="py-3 px-3 text-center font-medium text-gray-700 dark:text-gray-300 bg-gray-50/40 dark:bg-gray-800/40 border-r border-gray-200 dark:border-gray-700 text-xs whitespace-nowrap">
                  {timeRange}
                </td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, timeRange);
                  if (!slot) {
                    return (
                      <td
                        key={day}
                        className="py-3 px-3 border-r last:border-r-0 border-gray-200 dark:border-gray-700 text-center text-gray-300 dark:text-gray-600 text-xs select-none"
                      >
                        —
                      </td>
                    );
                  }

                  const canTake =
                    isTeacher &&
                    loggedInTeacherId &&
                    Number(slot.teacher_id) === Number(loggedInTeacherId);

                  return (
                    <td
                      key={day}
                      className="py-2 px-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700 align-top"
                    >
                      <div
                        onClick={() => onSlotClick && onSlotClick(slot)}
                        className={`p-3 rounded-xl border transition-all text-left group ${
                          canTake
                            ? "bg-indigo-50/70 border-indigo-200 hover:border-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-800/60"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-gray-700/40 dark:border-gray-600"
                        } ${onSlotClick ? "cursor-pointer" : ""}`}
                      >
                        <div className="font-semibold text-gray-900 dark:text-white text-xs line-clamp-1 mb-1 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {slot.subject?.subject_name || slot.subject_name || "Subject"}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-0.5">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {slot.teacher?.name || slot.faculty_name || "Faculty"}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between mt-1 pt-1 border-t border-gray-200/60 dark:border-gray-600/60">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            {slot.room?.room_name || slot.room_number || "Room"}
                          </span>
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {slot.semester ? `${slot.semester}${slot.section || "A"}` : "5A"}
                          </span>
                        </div>

                        {onTakeAttendance && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTakeAttendance(slot);
                            }}
                            className="mt-2 w-full py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition text-center"
                          >
                            Attendance
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
