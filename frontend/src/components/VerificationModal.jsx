import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

export default function VerificationModal({
  isOpen,
  mode = "verify", // "verify" or "reject"
  activity = null,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [remarks, setRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState(null);

  if (!isOpen || !activity) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (mode === "reject") {
      if (!rejectionReason.trim()) {
        setError("Please provide a reason for rejecting this achievement.");
        return;
      }
      onConfirm({ rejection_reason: rejectionReason.trim() });
    } else {
      onConfirm({ remarks: remarks.trim() });
    }
  };

  const isVerify = mode === "verify";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isVerify ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isVerify ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {isVerify ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">
                {isVerify ? "Verify Achievement" : "Reject Achievement"}
              </h3>
              <p className="text-xs text-slate-400">
                {isVerify ? "Confirm authenticity of student achievement" : "Return to student with reason for rejection"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="text-slate-400 mb-1">Activity Title:</div>
            <div className="font-medium text-slate-200 text-sm">{activity.title}</div>
            <div className="mt-2 flex items-center gap-2 text-slate-400">
              <span>Student: <strong className="text-slate-200">{activity.student_name}</strong></span>
              <span>•</span>
              <span>USN: <strong className="text-slate-200">{activity.student_usn}</strong></span>
            </div>
          </div>

          {isVerify ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Verification Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Validated against official VTU contest portal results."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ✓ Once verified, this achievement will appear in official college reports and the student's verified portfolio.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                Rejection Reason (Required) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Certificate information is incomplete. Please upload the official certificate with the organizer's seal and signature."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The student will see this explanation and will be allowed to edit and resubmit their submission.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all flex items-center gap-2 ${
                isVerify
                  ? "bg-emerald-600 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
                  : "bg-rose-600 hover:bg-rose-500 focus:ring-2 focus:ring-rose-500/50"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading && <span className="animate-spin mr-1">⌛</span>}
              {isVerify ? "Confirm & Verify" : "Reject Achievement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
