import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  PlusCircle,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  FileCheck,
  RefreshCw,
  FolderKanban
} from "lucide-react";
import { studentActivitiesApi } from "../api";
import ActivityCard from "../components/ActivityCard";

export default function StudentActivities() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    total_activities: 0,
    verified_achievements: 0,
    pending_verification: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actsRes, statsRes] = await Promise.all([
        studentActivitiesApi.getAll(),
        studentActivitiesApi.getStatsSummary(),
      ]);
      setActivities(actsRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load your activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pending activity submission?")) {
      return;
    }
    try {
      await studentActivitiesApi.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete activity.");
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      !search.trim() ||
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      (act.organizing_institution && act.organizing_institution.toLowerCase().includes(search.toLowerCase())) ||
      (act.position_award && act.position_award.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Verified" && act.status === "VERIFIED") ||
      (statusFilter === "Pending" && act.status === "PENDING") ||
      (statusFilter === "Rejected" && act.status === "REJECTED");

    const matchesType =
      typeFilter === "All" || act.activity_type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                STUDENT ACTIVITIES & ACHIEVEMENTS
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track, showcase, and submit co-curricular accomplishments for departmental verification
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/student/portfolio"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>My Achievements</span>
          </Link>

          <Link
            to="/student/activities/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Activity</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Activities */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Activities
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-100">
            {stats.total_activities || activities.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Submitted records
          </div>
        </div>

        {/* Verified */}
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
            {stats.verified_achievements || activities.filter((a) => a.status === "VERIFIED").length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">
            Approved by HOD / Admin
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl bg-slate-900/80 border border-amber-500/20 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400">
            {stats.pending_verification || activities.filter((a) => a.status === "PENDING").length}
          </div>
          <div className="mt-1 text-[11px] text-amber-500/80">
            Awaiting verification
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
            {stats.rejected || activities.filter((a) => a.status === "REJECTED").length}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">
            Requires edit & resubmission
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, award, institution..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            {["All", "Verified", "Pending", "Rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? "bg-sky-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            title="Refresh activities"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors ml-auto md:ml-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Activities Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-9 h-9 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading your activities & achievements...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 p-8">
          <Trophy className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">No activities found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search || statusFilter !== "All"
              ? "No activities match your current search or filter criteria."
              : "You haven't submitted any activities or achievements yet. Click '+ Add Activity' to get started."}
          </p>
          <div className="mt-5">
            <Link
              to="/student/activities/add"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Your First Activity</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              canEdit={act.status !== "VERIFIED"}
              canDelete={act.status === "PENDING"}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
