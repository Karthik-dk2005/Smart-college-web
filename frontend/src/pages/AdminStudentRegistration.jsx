import React, { useState, useEffect, useCallback } from "react";
import adminStudentRegistrationApi from "../api/adminStudentRegistration";
import { 
  Users, 
  UserCheck, 
  UserX, 
  MailCheck, 
  AlertTriangle, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  X, 
  Filter,
  GraduationCap
} from "lucide-react";

export default function AdminStudentRegistration() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "registered" | "unregistered" | "verified" | "flagged" | "unmatched"
  const [sectionFilter, setSectionFilter] = useState("all"); // "all" | "A" | "B"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit Gmail Modal
  const [editModalStudent, setEditModalStudent] = useState(null);
  const [newGmail, setNewGmail] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, unmatchedRes] = await Promise.all([
        adminStudentRegistrationApi.getStats(),
        adminStudentRegistrationApi.getUnmatched(),
      ]);
      setStats(statsRes);
      setUnmatched(unmatchedRes);

      if (activeTab === "unmatched") {
        setStudents([]);
        setTotalCount(unmatchedRes.length);
      } else {
        const studentsRes = await adminStudentRegistrationApi.getStudents({
          status: activeTab,
          section: sectionFilter,
          search: search.trim() || undefined,
          page: 1,
          limit: 200,
        });
        setStudents(studentsRes.students || []);
        setTotalCount(studentsRes.total || 0);
      }
    } catch (err) {
      console.error("Error loading registration data:", err);
      showToast("Failed to load registration data.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, sectionFilter, search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(handler);
  }, [loadData]);

  // Edit Gmail
  const handleOpenEdit = (student) => {
    setEditModalStudent(student);
    setNewGmail(student.gmail || "");
  };

  const handleSaveGmail = async (e) => {
    e.preventDefault();
    if (!newGmail.trim() || !newGmail.includes("@")) {
      showToast("Please enter a valid Gmail address.", "error");
      return;
    }

    setModalLoading(true);
    try {
      await adminStudentRegistrationApi.updateGmail(editModalStudent.usn, newGmail.trim());
      showToast(`Gmail updated for ${editModalStudent.usn}!`);
      setEditModalStudent(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to update Gmail.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Approve student
  const handleApprove = async (usn) => {
    try {
      await adminStudentRegistrationApi.approveStudent(usn);
      showToast(`Student ${usn} registration approved!`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to approve student.", "error");
    }
  };

  // Reject / Reset student
  const handleReject = async (usn) => {
    if (!window.confirm(`Reset registration status for student ${usn}?`)) return;
    try {
      await adminStudentRegistrationApi.rejectStudent(usn);
      showToast(`Student ${usn} reset to Unregistered.`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to reset student.", "error");
    }
  };

  // Trigger Excel Import
  const handleImportExcel = async () => {
    setLoading(true);
    try {
      const res = await adminStudentRegistrationApi.importExcel();
      showToast(res.message || "Excel matching re-run successfully!");
      loadData();
    } catch (err) {
      showToast("Excel import failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger PDF Import
  const handleImportPdf = async () => {
    setLoading(true);
    try {
      const res = await adminStudentRegistrationApi.importPdf();
      showToast(res.message || "PDF lists imported and synced!");
      loadData();
    } catch (err) {
      showToast("PDF import failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const url = adminStudentRegistrationApi.getExportUrl();
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 transition transform animate-in fade-in slide-in-from-bottom-5 ${
          toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-600 text-white"
        }`}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-indigo-400" />
            Student Registration Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage Gmail matching, OTP self-registration, and verified student accounts.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Export CSV
          </button>

          <button
            onClick={handleImportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Import Excel
          </button>

          <button
            onClick={handleImportPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            Import PDF
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats?.total_students ?? 131}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">5th Sem Students</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Registered</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats?.registered_students ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active accounts</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Unregistered</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats?.unregistered_students ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending registration</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Verified Gmail</span>
            <MailCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-2">{stats?.verified_gmail ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">OTP verified</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Flagged</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{stats?.flagged_for_admin ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Missing Gmail/Review</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              All Students ({stats?.total_students ?? 131})
            </button>

            <button
              onClick={() => setActiveTab("registered")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "registered" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Registered ({stats?.registered_students ?? 0})
            </button>

            <button
              onClick={() => setActiveTab("unregistered")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "unregistered" ? "bg-amber-600 text-white shadow-md shadow-amber-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Unregistered ({stats?.unregistered_students ?? 0})
            </button>

            <button
              onClick={() => setActiveTab("verified")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "verified" ? "bg-sky-600 text-white shadow-md shadow-sky-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Verified Gmail ({stats?.verified_gmail ?? 0})
            </button>

            <button
              onClick={() => setActiveTab("flagged")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "flagged" ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Flagged ({stats?.flagged_for_admin ?? 0})
            </button>

            <button
              onClick={() => setActiveTab("unmatched")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "unmatched" ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Unmatched Excel ({unmatched.length})
            </button>
          </div>

          {/* Section Filter & Search */}
          <div className="flex items-center gap-2.5">
            {activeTab !== "unmatched" && (
              <div className="flex items-center gap-1 bg-slate-950/70 px-2 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-slate-900">All Sections</option>
                  <option value="A" className="bg-slate-900">Section A</option>
                  <option value="B" className="bg-slate-900">Section B</option>
                </select>
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, USN, or Gmail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 sm:w-64 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        {activeTab === "unmatched" ? (
          /* UNMATCHED EXCEL RECORDS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Sl No</th>
                  <th className="py-3 px-3">Excel USN</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Gmail Address</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Sheet</th>
                  <th className="py-3 px-3">Reason / Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unmatched.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No unmatched student records found. All students are synchronized!
                    </td>
                  </tr>
                ) : (
                  unmatched.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-amber-300">
                        {item.excel_usn || "NOT PROVIDED"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">{item.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{item.gmail || "Missing"}</td>
                      <td className="py-3 px-3 text-slate-400">{item.phone || "—"}</td>
                      <td className="py-3 px-3 text-slate-400">{item.sheet_name}</td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const assignUsn = prompt(`Enter USN to assign to student '${item.name}':`);
                            if (assignUsn && assignUsn.trim()) {
                              adminStudentRegistrationApi.resolveUnmatched(item.id, {
                                assigned_usn: assignUsn.trim().toUpperCase(),
                              }).then(() => {
                                showToast(`Assigned USN ${assignUsn} to ${item.name}`);
                                loadData();
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Assign USN
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* STUDENTS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Sl No</th>
                  <th className="py-3 px-3">USN</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Gmail Address</th>
                  <th className="py-3 px-3 text-center">Sem</th>
                  <th className="py-3 px-3 text-center">Sec</th>
                  <th className="py-3 px-3">Registration Status</th>
                  <th className="py-3 px-3">Email Verification</th>
                  <th className="py-3 px-3">Flag Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      {loading ? "Loading student records..." : "No students match the current filters."}
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-slate-400 font-mono">{s.sl_no}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-300">{s.usn}</td>
                      <td className="py-3 px-3 font-medium text-white">{s.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {s.gmail ? (
                          <span className="text-slate-200">{s.gmail}</span>
                        ) : (
                          <span className="text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">
                            Missing Gmail
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">{s.semester}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-300">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          s.section === "A" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {s.section}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.registration_status === "Registered"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : s.registration_status === "Pending_OTP"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {s.registration_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.email_verification_status === "Verified"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {s.email_verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {s.is_flagged_for_admin ? (
                          <span className="text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" title={s.admin_flag_reason}>
                            ⚠️ Flagged
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">✓ Clean</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 rounded-lg transition cursor-pointer"
                            title="Edit Gmail"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {s.registration_status !== "Registered" ? (
                            <button
                              onClick={() => handleApprove(s.usn)}
                              className="p-1.5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition cursor-pointer"
                              title="Approve / Activate Registration"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReject(s.usn)}
                              className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                              title="Reset Registration"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex justify-between items-center pt-2">
          <span>Showing {students.length} of {totalCount} records</span>
          <span>Maharaja Institute of Technology Thandavapura – CSE Dept</span>
        </div>
      </div>

      {/* Edit Gmail Modal */}
      {editModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setEditModalStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Edit Student Gmail</h3>
            <p className="text-xs text-slate-400 mb-4">
              Update official Gmail address for USN verification and registration.
            </p>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1 mb-4">
              <div><span className="text-slate-500">Student:</span> <strong className="text-white">{editModalStudent.name}</strong></div>
              <div><span className="text-slate-500">USN:</span> <span className="font-mono text-indigo-400">{editModalStudent.usn}</span></div>
              <div><span className="text-slate-500">Section:</span> {editModalStudent.section} (5th Sem)</div>
            </div>

            <form onSubmit={handleSaveGmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Gmail Address
                </label>
                <input
                  type="email"
                  value={newGmail}
                  onChange={(e) => setNewGmail(e.target.value.toLowerCase())}
                  required
                  placeholder="student@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !newGmail.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Gmail"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

