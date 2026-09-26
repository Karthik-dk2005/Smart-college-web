import React, { useState, useEffect } from "react";
import { attendanceApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import TableSkeleton from "../components/TableSkeleton";
import Modal from "../components/Modal";
import {
  BookOpen,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Percent,
  ChevronRight,
  User,
  GraduationCap,
  Layers,
  Award,
  ScanFace,
  Fingerprint,
  Edit3,
} from "lucide-react";

export default function StudentAttendance() {
  const { user } = useAuth();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const studentId = user?.student_id || user?.id;

  const renderMethodBadge = (method) => {
    const m = (method || "MANUAL").toUpperCase();
    if (m === "FACE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <ScanFace className="w-3.5 h-3.5" />
          FACE
        </span>
      );
    }
    if (m === "BIOMETRIC") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Fingerprint className="w-3.5 h-3.5" />
          BIOMETRIC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
        <Edit3 className="w-3.5 h-3.5" />
        MANUAL
      </span>
    );
  };

  const fetchAttendance = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getStudentAttendance(studentId);
      const data = res.data?.data || res.data || res;
      setAttendanceData(data);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const openSubjectDetails = (subject) => {
    setSelectedSubject(subject);
    setIsDetailsOpen(true);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 85) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (percentage >= 75) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Official Attendance Record
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              My Attendance Summary
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive 30-minute interval breakdown and overall percentage calculations.
            </p>
          </div>

          {attendanceData && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl text-center min-w-[100px]">
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                  Conducted
                </div>
                <div className="text-lg font-bold text-indigo-950 dark:text-white">
                  {(attendanceData.conducted_minutes ?? attendanceData.total_conducted_minutes) || 0} min
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-center min-w-[100px]">
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  Present
                </div>
                <div className="text-lg font-bold text-emerald-950 dark:text-white">
                  {(attendanceData.present_minutes ?? attendanceData.total_present_minutes) || 0} min
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-center min-w-[100px]">
                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
                  Overall %
                </div>
                <div className="text-lg font-bold text-purple-950 dark:text-white">
                  {attendanceData.overall_percentage != null ? `${attendanceData.overall_percentage}%` : `${attendanceData.attendance_percentage || 100}%`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Subjects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Subject-Wise Attendance
          </h2>
          <span className="text-xs text-gray-400">
            Click on any subject to inspect 30-minute interval logs
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : !attendanceData || !attendanceData.subjects || attendanceData.subjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No subject attendance records found for this student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6 text-center">Conducted Minutes</th>
                  <th className="py-3.5 px-6 text-center">Present Minutes</th>
                  <th className="py-3.5 px-6 text-center">Absent Minutes</th>
                  <th className="py-3.5 px-6 text-center">Attendance %</th>
                  <th className="py-3.5 px-6 text-center">Method</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {attendanceData.subjects.map((sub) => {
                  const pct = sub.attendance_percentage ?? 100;
                  const colorClass = getPercentageColor(pct);
                  const methodStr = sub.attendance_method || (sub.interval_records && sub.interval_records.length > 0 ? sub.interval_records[0].attendance_method : "MANUAL") || "MANUAL";

                  return (
                    <tr
                      key={sub.subject_id}
                      onClick={() => openSubjectDetails(sub)}
                      className="hover:bg-indigo-50/40 dark:hover:bg-gray-700/40 transition cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {sub.subject_name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {sub.subject_code || `SUB-${sub.subject_id}`}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-gray-700 dark:text-gray-300">
                        {sub.conducted_minutes || 0}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-emerald-600 dark:text-emerald-400">
                        {sub.present_minutes || 0}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-rose-600 dark:text-rose-400">
                        {sub.absent_minutes || 0}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {renderMethodBadge(methodStr)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interval Records Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedSubject ? `${selectedSubject.subject_name} — 30-Minute Interval Log` : "Details"}
      >
        {selectedSubject && (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Total Conducted: {selectedSubject.conducted_minutes || 0} min
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Present: {selectedSubject.present_minutes || 0} min
              </span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                Absent: {selectedSubject.absent_minutes || 0} min
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {selectedSubject.attendance_percentage ?? 100}%
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
              {!selectedSubject.interval_records || selectedSubject.interval_records.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No individual 30-minute interval logs available for this subject.
                </div>
              ) : (
                selectedSubject.interval_records.map((rec, idx) => {
                  const isPresent = rec.status === "Present";
                  return (
                    <div
                      key={idx}
                      className="py-3 px-2 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          D{rec.duration_number || 1}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span>{rec.date}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-mono text-gray-600 dark:text-gray-300">
                              {rec.start_time} - {rec.end_time}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Duration: {rec.duration_minutes || 30} minutes
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPresent ? (
                          renderMethodBadge(rec.attendance_method || "MANUAL")
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">-</span>
                        )}
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
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
