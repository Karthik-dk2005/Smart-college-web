import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Award,
  Layers,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Edit2,
  AlertCircle,
  ExternalLink,
  Upload
} from "lucide-react";
import { studentActivitiesApi } from "../api";
import ActivityStatusBadge from "../components/ActivityStatusBadge";
import VerificationModal from "../components/VerificationModal";
import AchievementFileUpload from "../components/AchievementFileUpload";

export default function StudentActivityDetails() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User session role
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (currentUser.role || "").toLowerCase();
  const isAdminOrHOD = role === "admin" || role === "hod";

  // Verification modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("verify");
  const [actionLoading, setActionLoading] = useState(false);

  // File upload state for adding additional evidence
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Selected file for inline preview
  const [previewFile, setPreviewFile] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentActivitiesApi.getById(activityId);
      setActivity(res.data);
      if (res.data.files && res.data.files.length > 0 && !previewFile) {
        setPreviewFile(res.data.files[0]);
      }
    } catch (err) {
      console.error("Error fetching activity details:", err);
      setError(err.response?.data?.detail || "Failed to load activity details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [activityId]);

  const handleVerify = () => {
    setModalMode("verify");
    setModalOpen(true);
  };

  const handleReject = () => {
    setModalMode("reject");
    setModalOpen(true);
  };

  const handleConfirmVerification = async (data) => {
    try {
      setActionLoading(true);
      if (modalMode === "verify") {
        await studentActivitiesApi.verify(activityId, data);
      } else {
        await studentActivitiesApi.reject(activityId, data);
      }
      setModalOpen(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadAdditionalEvidence = async () => {
    if (!newFile) return;
    try {
      setUploadingFile(true);
      await studentActivitiesApi.uploadEvidence(activityId, newFile);
      setNewFile(null);
      setShowAddEvidence(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <div className="w-9 h-9 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading activity details...</p>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Unable to Load Activity</h2>
        <p className="text-sm text-slate-400">{error || "Activity record not found."}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  const {
    id,
    title,
    activity_type,
    level,
    activity_date,
    position_award,
    organizing_institution,
    department_name,
    location,
    description,
    remarks,
    status,
    files = [],
    verifications = [],
    student_name,
    student_usn,
  } = activity;

  const isOwner = currentUser.id === activity.student_id || role === "student";
  const canEdit = isOwner && status !== "VERIFIED";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {title}
              </h1>
              <ActivityStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Student: <strong className="text-slate-200">{student_name || "Self"}</strong></span>
              {student_usn && <span>• USN: <strong className="text-slate-200">{student_usn}</strong></span>}
              {department_name && <span>• Dept: <strong className="text-slate-200">{department_name}</strong></span>}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {canEdit && (
            <Link
              to={`/student/activities/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit / Resubmit</span>
            </Link>
          )}

          {/* Admin / HOD Verification Buttons */}
          {isAdminOrHOD && (
            <>
              <button
                onClick={handleVerify}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Achievement</span>
              </button>

              <button
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {status === "REJECTED" && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-300 text-sm">Achievement Submission Rejected</h3>
              <p className="text-xs text-rose-200/90 mt-1">
                <strong>Reason:</strong> {activity.latest_verification?.rejection_reason || "Certificate information is incomplete."}
              </p>
              <p className="text-[11px] text-rose-400/80 mt-1">
                You can update the information, attach clearer evidence, and resubmit for verification.
              </p>
            </div>
          </div>
          {canEdit && (
            <Link
              to={`/student/activities/${id}/edit`}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shadow-md transition-all"
            >
              Edit & Resubmit
            </Link>
          )}
        </div>
      )}

      {/* Verified Banner */}
      {status === "VERIFIED" && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-300">
              ✓ Achievement verified by {activity.latest_verification?.verification_role?.toUpperCase() || "Admin"} ({activity.latest_verification?.verifier_name || "Authorized Evaluator"})
            </span>
            {activity.latest_verification?.verified_at && (
              <span className="text-emerald-400/80 ml-2">
                on {formatDate(activity.latest_verification.verified_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Details & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Details and Verification History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              Activity Details
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Type</span>
                <span className="font-medium text-slate-200 mt-1 block">{activity_type}</span>
              </div>

              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Level</span>
                <span className="font-medium text-slate-200 mt-1 block">{level}</span>
              </div>

              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Date</span>
                <span className="font-medium text-slate-200 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formatDate(activity_date)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Position / Award</span>
                <span className="font-medium text-amber-400 mt-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  {position_award || "Participant"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Institution</span>
                <span className="font-medium text-slate-200 mt-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {organizing_institution || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px]">Location</span>
                <span className="font-medium text-slate-200 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {location || "N/A"}
                </span>
              </div>
            </div>

            {description && (
              <div className="border-t border-slate-800/80 pt-4">
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px] mb-1.5">
                  Description
                </span>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {remarks && (
              <div className="border-t border-slate-800/80 pt-4">
                <span className="text-slate-500 uppercase tracking-wider block font-semibold text-[11px] mb-1.5">
                  Remarks / Additional Evidence Notes
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {remarks}
                </p>
              </div>
            )}
          </div>

          {/* Verification Audit Timeline */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              Verification History & Status
            </h2>

            {verifications.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pending review by Department Head of Department (HOD) or Academic Administrator.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {v.status === "VERIFIED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">
                          {v.status === "VERIFIED" ? "Verified" : "Rejected"} by {v.verifier_name} ({v.verification_role?.toUpperCase()})
                        </div>
                        {v.rejection_reason && (
                          <div className="text-rose-300 mt-1 text-xs">
                            <strong>Reason:</strong> {v.rejection_reason}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 mt-1">
                          {formatDate(v.verified_at)}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      v.status === "VERIFIED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Evidence Documents & Inline Preview */}
        <div className="space-y-6">
          {/* Documents Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Evidence Documents
              </h2>
              {canEdit && (
                <button
                  onClick={() => setShowAddEvidence(!showAddEvidence)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  {showAddEvidence ? "Cancel" : "+ Add Document"}
                </button>
              )}
            </div>

            {/* Upload Additional Evidence Box */}
            {showAddEvidence && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <AchievementFileUpload
                  file={newFile}
                  onFileSelect={setNewFile}
                  onFileRemove={() => setNewFile(null)}
                  disabled={uploadingFile}
                />
                {newFile && (
                  <button
                    onClick={handleUploadAdditionalEvidence}
                    disabled={uploadingFile}
                    className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {uploadingFile ? "Uploading..." : "Upload Selected Document"}
                  </button>
                )}
              </div>
            )}

            {files.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No certificate or evidence files attached.
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((f) => {
                  const isPdf = f.file_name.toLowerCase().endsWith(".pdf");
                  const isSelected = previewFile?.id === f.id;
                  const downloadUrl = studentActivitiesApi.getFileDownloadUrl(id, f.id);
                  const viewUrl = studentActivitiesApi.getFileViewUrl(id, f.id);

                  return (
                    <div
                      key={f.id}
                      onClick={() => setPreviewFile(f)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-800/90 border-sky-500 shadow-md"
                          : "bg-slate-950 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">
                              {f.file_name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "Document"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={downloadUrl}
                            download={f.file_name}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                            title="Download Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Certificate Inline Preview */}
          {previewFile && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Certificate Preview
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {previewFile.file_name}
                </span>
              </div>

              <div className="w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
                {previewFile.file_name.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={studentActivitiesApi.getFileViewUrl(id, previewFile.id)}
                    title="Certificate PDF Preview"
                    className="w-full h-80 border-0 rounded-xl"
                  />
                ) : (
                  <img
                    src={studentActivitiesApi.getFileViewUrl(id, previewFile.id)}
                    alt="Certificate Evidence Preview"
                    className="w-full h-80 object-contain p-2"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href={studentActivitiesApi.getFileViewUrl(id, previewFile.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Full Screen
                </a>
                <a
                  href={studentActivitiesApi.getFileDownloadUrl(id, previewFile.id)}
                  download={previewFile.file_name}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal for Admin / HOD */}
      <VerificationModal
        isOpen={modalOpen}
        mode={modalMode}
        activity={activity}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmVerification}
        loading={actionLoading}
      />
    </div>
  );
}
