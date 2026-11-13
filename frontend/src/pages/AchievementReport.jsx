import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  Calendar,
  Layers,
  Award
} from "lucide-react";
import { studentActivitiesApi, departmentsApi } from "../api";
import CollegeLogo from "../components/CollegeLogo";
import ActivityStatusBadge from "../components/ActivityStatusBadge";

export default function AchievementReport() {
  const [activities, setActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle: Official report (only verified) vs All records
  const [onlyVerified, setOnlyVerified] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [actsRes, deptsRes] = await Promise.all([
        studentActivitiesApi.getAll(),
        departmentsApi.getAll().catch(() => ({ data: [] })),
      ]);
      setActivities(actsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.error("Error fetching achievement report data:", err);
      setError("Failed to fetch official activities data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = activities.length;
  const verifiedCount = activities.filter((a) => a.status === "VERIFIED").length;
  const pendingCount = activities.filter((a) => a.status === "PENDING").length;
  const rejectedCount = activities.filter((a) => a.status === "REJECTED").length;

  // Filtered dataset
  const reportActivities = activities.filter((act) => {
    if (onlyVerified && act.status !== "VERIFIED") return false;

    const matchesSearch =
      !search.trim() ||
      (act.title && act.title.toLowerCase().includes(search.toLowerCase())) ||
      (act.student_name && act.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (act.student_usn && act.student_usn.toLowerCase().includes(search.toLowerCase())) ||
      (act.position_award && act.position_award.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      deptFilter === "All" || String(act.department_id) === String(deptFilter);

    const matchesType =
      typeFilter === "All" || (act.activity_type || "").toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesType;
  });

  const exportCSV = () => {
    const headers = [
      "Student ID / USN",
      "Student Name",
      "Department",
      "Activity Title",
      "Activity Type",
      "Level",
      "Position / Award",
      "Institution",
      "Date",
      "Status",
    ];

    const rows = reportActivities.map((act) => [
      `"${act.student_usn || ""}"`,
      `"${act.student_name || ""}"`,
      `"${act.department_name || ""}"`,
      `"${act.title || ""}"`,
      `"${act.activity_type || ""}"`,
      `"${act.level || ""}"`,
      `"${act.position_award || ""}"`,
      `"${act.organizing_institution || ""}"`,
      `"${act.activity_date || ""}"`,
      `"${act.status || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `student_achievements_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print:m-0 print:p-0">
      {/* Top Header (Screen Only) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                STUDENT ACHIEVEMENTS OFFICIAL REPORT
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Accreditation, NBA/NAAC co-curricular documentation, and institutional achievement records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Institutional Document Header (Visible in print and screen) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 print:border-slate-300 print:bg-white print:text-black shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-5">
          <div className="flex items-center gap-4">
            <CollegeLogo className="w-14 h-14" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 print:text-black">
                MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Official Institutional Student Achievement & Co-Curricular Report
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600">
            <div>Date: <strong>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></div>
            <div className="text-[11px] text-emerald-400 print:text-emerald-700 font-semibold mt-0.5">
              {onlyVerified ? "Official Record: Verified Achievements Only" : "Comprehensive Record: All Statuses Included"}
            </div>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:border-slate-300 print:bg-slate-50">
            <div className="text-2xl font-black text-slate-100 print:text-black">{total}</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 mt-1">Total Activities</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 print:border-slate-300 print:bg-slate-50">
            <div className="text-2xl font-black text-emerald-400 print:text-emerald-700">{verifiedCount}</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 print:text-slate-600 mt-1">Verified Achievements</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 print:border-slate-300 print:bg-slate-50">
            <div className="text-2xl font-black text-amber-400 print:text-amber-700">{pendingCount}</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 print:text-slate-600 mt-1">Pending Verification</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 print:border-slate-300 print:bg-slate-50">
            <div className="text-2xl font-black text-rose-400 print:text-rose-700">{rejectedCount}</div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-rose-400 print:text-slate-600 mt-1">Rejected</div>
          </div>
        </div>

        {/* Filters and Toggle (Hidden in Print) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span>Only include verified achievements in official report</span>
              </label>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search report..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 font-semibold text-[10px] uppercase block mb-1">Filter by Department</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-semibold text-[10px] uppercase block mb-1">Filter by Activity Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Activity Types</option>
                {["Competition", "Technical", "Hackathon", "Sports", "Cultural", "Workshop", "Seminar", "Internship", "Project", "Certification", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950 print:bg-slate-100 text-[10px] uppercase tracking-wider text-slate-400 print:text-black border-b border-slate-800 print:border-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {reportActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500 print:text-slate-600">
                    No achievement records match the selected report criteria.
                  </td>
                </tr>
              ) : (
                reportActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="px-4 py-3 font-mono font-medium">{act.student_usn || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200 print:text-black">{act.student_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 print:text-black">{act.department_name || "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-100 print:text-black max-w-xs truncate">{act.title}</td>
                    <td className="px-4 py-3">{act.activity_type}</td>
                    <td className="px-4 py-3">{act.level}</td>
                    <td className="px-4 py-3 font-semibold text-amber-400 print:text-amber-800">{act.position_award || "Participant"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{act.activity_date || "—"}</td>
                    <td className="px-4 py-3">
                      <ActivityStatusBadge status={act.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-xs text-slate-500 print:text-black">
          <div>
            Showing <strong>{reportActivities.length}</strong> record{reportActivities.length === 1 ? "" : "s"}
          </div>
          <div>
            Official Seal • Maharaja Institute of Technology Thandavapura
          </div>
        </div>
      </div>
    </div>
  );
}
