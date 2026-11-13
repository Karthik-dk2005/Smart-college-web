import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, CheckCircle2 } from "lucide-react";
import { studentActivitiesApi } from "../api";
import ActivityForm from "../components/ActivityForm";

export default function AddStudentActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formDataWithFile) => {
    try {
      setLoading(true);
      setError(null);

      const { file, ...data } = formDataWithFile;

      // 1. Create activity record
      const res = await studentActivitiesApi.create(data);
      const activityId = res.data?.id;

      // 2. Upload attached file if provided
      if (file && activityId) {
        await studentActivitiesApi.uploadEvidence(activityId, file);
      }

      // 3. Navigate back to activities dashboard
      navigate("/student/activities");
    } catch (err) {
      console.error("Error creating student activity:", err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to submit activity. Please check all fields and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <button
          onClick={() => navigate("/student/activities")}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Back to Activities"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Add New Activity or Achievement
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit your achievements, certificates, competition awards, or co-curricular projects
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Form */}
      <ActivityForm
        onSubmit={handleSubmit}
        loading={loading}
        isEdit={false}
        showFileUpload={true}
      />
    </div>
  );
}
