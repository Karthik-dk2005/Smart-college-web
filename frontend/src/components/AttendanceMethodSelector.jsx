import React from "react";
import { ScanFace, Fingerprint, Edit3 } from "lucide-react";

export default function AttendanceMethodSelector({
  selectedMethod = "MANUAL",
  onSelectMethod,
  disabled = false,
}) {
  const methods = [
    {
      id: "FACE",
      label: "FACE RECOGNITION",
      icon: <ScanFace className="w-5 h-5" />,
      desc: "AI Face Detection & Verification",
      activeColor: "bg-indigo-600 text-white shadow-indigo-600/30",
    },
    {
      id: "BIOMETRIC",
      label: "BIOMETRIC",
      icon: <Fingerprint className="w-5 h-5" />,
      desc: "Fingerprint Scanner Verification",
      activeColor: "bg-purple-600 text-white shadow-purple-600/30",
    },
    {
      id: "MANUAL",
      label: "MANUAL",
      icon: <Edit3 className="w-5 h-5" />,
      desc: "Teacher Roll Call & Manual Toggle",
      activeColor: "bg-slate-700 text-white shadow-slate-700/30",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Attendance Mode
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((m) => {
          const isSelected = selectedMethod.toUpperCase() === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMethod(m.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                isSelected
                  ? `${m.activeColor} border-transparent shadow-lg scale-[1.02]`
                  : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-indigo-300"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {m.icon}
              </div>
              <div>
                <div className="text-xs font-bold tracking-wide uppercase">
                  {m.label}
                </div>
                <div
                  className={`text-[11px] ${
                    isSelected ? "text-white/80" : "text-gray-400 dark:text-gray-400"
                  }`}
                >
                  {m.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
