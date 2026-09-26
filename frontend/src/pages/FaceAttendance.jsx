import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import FaceScanner from "../components/FaceScanner";
import AttendanceTable from "../components/AttendanceTable";
import { attendanceApi, timetableApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  ScanFace,
  Clock,
  BookOpen,
  Calendar,
  MapPin,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function FaceAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const timetableIdParam = searchParams.get("timetableId");
  const [timetableId, setTimetableId] = useState(timetableIdParam ? Number(timetableIdParam) : null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch today's schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await attendanceApi.getTodayTimetable();
        const list = res.data?.data || res.data || res || [];
        setTodayClasses(Array.isArray(list) ? list : []);

        if (!timetableId && list.length > 0) {
          setTimetableId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Fetch session data when timetableId changes
  const fetchSessionData = async () => {
    if (!timetableId) return;
    try {
      const res = await attendanceApi.getSessionAttendance(timetableId);
      const data = res.data?.data || res.data || res;
      setSessionData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [timetableId]);

  const handleStudentMarked = (markedResult) => {
    success(`✓ Present: ${markedResult.student_name} via Face Recognition`);
    fetchSessionData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/attendance")}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScanFace className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Face Recognition Live Attendance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time optical face detection, cosine similarity match, and instant attendance logging.
          </p>
        </div>

        {/* Timetable Session Switcher */}
        {todayClasses.length > 0 && (
          <div className="w-full md:w-auto">
            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
              Select Today's Class Session
            </label>
            <select
              value={timetableId || ""}
              onChange={(e) => setTimetableId(Number(e.target.value))}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            >
              {todayClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subject_name} ({c.start_time} - {c.end_time}) — Sem {c.semester}{c.section}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {timetableId ? (
        <div className="space-y-6">
          {/* Face Scanner Camera Viewport */}
          <FaceScanner
            timetableId={timetableId}
            onStudentMarked={handleStudentMarked}
            durationNumber={sessionData?.intervals?.[0]?.duration_number || 1}
            intervalId={sessionData?.intervals?.[0]?.id}
          />

          {/* Real-Time Session Attendance Table */}
          {sessionData && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Session Attendance Roll Call & Verification Status
              </h3>
              <AttendanceTable
                sessionData={sessionData}
                readOnly={true}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-400 text-sm">
          No class selected or no timetable sessions scheduled for today.
        </div>
      )}
    </div>
  );
}
