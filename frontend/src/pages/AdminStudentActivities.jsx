import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FolderKanban,
  FileSpreadsheet,
  RefreshCw,
  Building
} from "lucide-react";
import { studentActivitiesApi, departmentsApi } from "../api";
import ActivityTable from "../components/ActivityTable";
import VerificationModal from "../components/VerificationModal";

export default function AdminStudentActivities() {
  const [data, setData] = useState({ statistics: {}, activities: [] });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("verify");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [adminRes, deptsRes] = await Promise.all([
        studentActivitiesApi.getAdminActivities(),
        departmentsApi.getAll().catch(() => ({ data: [] })),
      ]);
      setData(adminRes.data || { statistics: {}, activities: [] });
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.error("Error loading admin student activities:", err);
      setError("Failed to fetch student activities records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyClick = (act) => {
    setSelectedActivity(act);
    setModalMode("verify");
    setModalOpen(true);
  };

  const handleRejectClick = (act) => {
    setSelectedActivity(act);
    setModalMode("reject");
    setModalOpen(true);
  };

  const handleConfirmVerification = async (payload) => {
    if (!selectedActivity) return;
    try {
      setActionLoading(true);
      if (modalMode === "verify") {
        await studentActivitiesApi.verify(selectedActivity.id, payload);
      } else {
        await studentActivitiesApi.reject(selectedActivity.id, payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const activities = data.activities || [];
  const stats = data.statistics || {
    total_activities: activities.length,
    verified: activities.filter((a) => a.status === "VERIFIED").length,
    pending: activities.filter((a) => a.status === "PENDING").length,
    rejected: activities.filter((a) => a.status === "REJECTED").length,
  };

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      !search.trim() ||
      (act.title && act.title.toLowerCase().includes(search.toLowerCase())) ||
      (act.student_name && act.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (act.student_usn && act.student_usn.toLowerCase().includes(search.toLowerCase())) ||
      (act.organizing_institution && act.organizing_institution.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || act.status === statusFilter.toUpperCase();

    const matchesType =
      typeFilter === "All" || (act.activity_type || "").toLowerCase() === typeFilter.toLowerCase();

    const matchesLevel =
      levelFilter === "All" || (act.level || "").toLowerCase() === levelFilter.toLowerCase();

    const matchesDept =
      deptFilter === "All" || String(act.department_id) === String(deptFilter);

    return matchesSearch && matchesStatus && matchesType && matchesLevel && matchesDept;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                STUDENT ACTIVITIES & ACHIEVEMENTS VERIFICATION
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Administrative Review Portal • Verify, approve, or reject student co-curricular submissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/reports/student-achievements"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Generate Official Report</span>
          </Link>
        </div>
      </div>

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Activities */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-100">
            {stats.total_activities || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Institution-wide records
          </div>
        </div>

        {/* Pending Verification */}
        <div className="rounded-2xl bg-slate-900/80 border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">
            {stats.pending || 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-500/80">
            Requires action
          </div>
        </div>

        {/* Verified Achievements */}
        <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/20 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Verified
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400">
            {stats.verified || 0}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">
            Approved achievements
          </div>
        </div>

        {/* Rejected */}
        <div className="rounded-2xl bg-slate-900/80 border border-rose-500/20 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-400">
            {stats.rejected || 0}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">
            Returned with reason
          </div>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Student Name, ID/USN, or Title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto">
            {["All", "Pending", "Verified", "Rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={fetchData}
              title="Refresh"
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Department */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Activity Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Types</option>
              {["Competition", "Technical", "Hackathon", "Sports", "Cultural", "Workshop", "Seminar", "Internship", "Project", "Certification", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
              Level
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Levels</option>
              {["College", "Department", "University", "District", "State", "National", "International"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Table */}
      <ActivityTable
        activities={filteredActivities}
        onVerify={handleVerifyClick}
        onReject={handleRejectClick}
        canVerify={true}
        showStudentInfo={true}
        loading={loading}
      />

      {/* Verification Modal */}
      <VerificationModal
        isOpen={modalOpen}
        mode={modalMode}
        activity={selectedActivity}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmVerification}
        loading={actionLoading}
      />
    </div>
  );
}
