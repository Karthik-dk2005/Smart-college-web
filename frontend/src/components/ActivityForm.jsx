import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Building,
  MapPin,
  Award,
  Layers,
  FileText,
  Save,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import AchievementFileUpload from "./AchievementFileUpload";

const ACTIVITY_TYPES = [
  "Academic",
  "Technical",
  "Sports",
  "Cultural",
  "Competition",
  "Workshop",
  "Seminar",
  "Internship",
  "Project",
  "Hackathon",
  "Certification",
  "Volunteering",
  "Club Activity",
  "Other",
];

const LEVELS = [
  "College",
  "Department",
  "University",
  "District",
  "State",
  "National",
  "International",
];

export default function ActivityForm({
  initialData = {},
  onSubmit,
  loading = false,
  isEdit = false,
  showFileUpload = true,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    activity_type: initialData.activity_type || "Technical",
    description: initialData.description || "",
    activity_date: initialData.activity_date || "",
    organizing_institution: initialData.organizing_institution || "",
    department: initialData.department || "",
    level: initialData.level || "College",
    position_award: initialData.position_award || "",
    location: initialData.location || "",
    remarks: initialData.remarks || "",
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Activity Title is required.");
      return;
    }

    if (!formData.activity_type) {
      setError("Please select an Activity Type.");
      return;
    }

    onSubmit({
      ...formData,
      file,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Trophy className="w-5 h-5 text-sky-400" />
          General Activity Information
        </h3>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Activity Title *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. AI Hackathon 2026 or Inter-College Robotics Challenge"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Type & Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Activity Type *
            </label>
            <select
              name="activity_type"
              value={formData.activity_type}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Level *
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Position / Award & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Position / Award
            </label>
            <input
              type="text"
              name="position_award"
              value={formData.position_award}
              onChange={handleChange}
              placeholder="e.g. Winner, Runner-up, First Place, Participant"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              name="activity_date"
              value={formData.activity_date}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Organizing Institution & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Organizing Institution
            </label>
            <input
              type="text"
              name="organizing_institution"
              value={formData.organizing_institution}
              onChange={handleChange}
              placeholder="e.g. MIT Thandavapura, VTU, IIT Madras"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Campus Auditorium, Mysuru, Bengaluru"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a brief overview of your role, achievement, or project highlights..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Remarks / Additional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Remarks / Additional Evidence Notes
          </label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g. Cash prize received, published in IEEE conference, or team leader remarks"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* File Upload Section */}
      {showFileUpload && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            Certificate & Evidence Upload
          </h3>
          <p className="text-xs text-slate-400">
            Upload your official Certificate of Completion, Merit Award, or participation evidence for verification.
          </p>

          <AchievementFileUpload
            file={file}
            onFileSelect={setFile}
            onFileRemove={() => setFile(null)}
            disabled={loading}
          />
        </div>
      )}

      {/* Form Submission Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/20 transition-all ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isEdit ? "Update & Resubmit" : "Submit Activity"}</span>
        </button>
      </div>
    </form>
  );
}
