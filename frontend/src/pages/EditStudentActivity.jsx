import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { studentActivitiesApi } from "../api";
import ActivityForm from "../components/ActivityForm";

export default function EditStudentActivity() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await studentActivitiesApi.getById(activityId);
        setActivity(res.data);
      } catch (err) {
        console.error("Error fetching activity for edit:", err);
        setError("Failed to load activity details or you are unauthorized to edit it.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  const handleSubmit = async (formDataWithFile) => {
    try {
      setSubmitting(true);
      setError(null);

      const { file, ...data } = formDataWithFile;

      // 1. Update activity
      await studentActivitiesApi.update(activityId, data);

      // 2. Upload new file if attached
      if (file) {
        await studentActivitiesApi.uploadEvidence(activityId, file);
      }

      // 3. Return to details or activities page
      navigate(`/student/activities/${activityId}`);
    } catch (err) {
      console.error("Error updating activity:", err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update activity. Please verify all information."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading activity details...</p>
      </div>
    );
  }

  if (activity?.status === "VERIFIED") {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Verified Records Cannot Be Modified</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This achievement has already been verified by the department. To request changes or submit corrections, please contact your department HOD or Admin.
        </p>
        <button
          onClick={() => navigate(`/student/activities/${activityId}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <button
          onClick={() => navigate(`/student/activities/${activityId}`)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Back to Details"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Edit Activity Submission
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activity?.status === "REJECTED"
              ? "Update your details or attach requested evidence to resubmit for verification"
              : "Modify pending co-curricular record"}
          </p>
        </div>
      </div>

      {/* Rejection Alert if editing a rejected activity */}
      {activity?.status === "REJECTED" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm space-y-1">
          <div className="font-semibold text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Rejection Feedback:
          </div>
          <p className="text-xs pl-6">
            {activity.latest_verification?.rejection_reason || "Certificate information is incomplete. Please update details and resubmit."}
          </p>
          <p className="text-[11px] text-rose-400/80 pl-6 mt-1 font-medium">
            Saving changes will automatically resubmit this activity with status <strong>PENDING</strong>.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Form */}
      {activity && (
        <ActivityForm
          initialData={activity}
          onSubmit={handleSubmit}
          loading={submitting}
          isEdit={true}
          showFileUpload={true}
        />
      )}
    </div>
  );
}
