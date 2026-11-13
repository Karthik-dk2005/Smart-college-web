import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, AlertTriangle, CheckCircle } from "lucide-react";

export default function AchievementFileUpload({
  file,
  onFileSelect,
  onFileRemove,
  disabled = false,
  error = null,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png"];
  const DISALLOWED_EXTS = [".exe", ".bat", ".cmd", ".sh", ".js", ".py", ".vbs"];
  const MAX_BYTES = 10 * 1024 * 1024; // 10MB

  const validateAndSetFile = (selectedFile) => {
    setLocalError(null);
    if (!selectedFile) return;

    const fname = selectedFile.name.toLowerCase();
    const isDisallowed = DISALLOWED_EXTS.some((ext) => fname.endsWith(ext));
    if (isDisallowed) {
      setLocalError("Executable files (.exe, .bat, .cmd, .sh, .js) are strictly prohibited.");
      return;
    }

    const isAllowed = ALLOWED_EXTS.some((ext) => fname.endsWith(ext));
    if (!isAllowed) {
      setLocalError("Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG certificate.");
      return;
    }

    if (selectedFile.size > MAX_BYTES) {
      setLocalError(`File size exceeds 10MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = file?.name?.toLowerCase().endsWith(".pdf");

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-sky-500 bg-sky-500/10 scale-[1.01]"
              : "border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900/80"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to upload certificate or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: <span className="text-slate-300 font-medium">PDF, JPG, JPEG, PNG</span> (Max 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isPdf ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatSize(file.size)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready for upload
                </span>
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onFileRemove) onFileRemove();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-3 shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {(localError || error) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}
    </div>
  );
}
