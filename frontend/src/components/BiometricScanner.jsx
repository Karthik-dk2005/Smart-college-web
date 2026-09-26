import React, { useState, useEffect } from "react";
import { biometricApi } from "../api";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Users,
} from "lucide-react";

export default function BiometricScanner({
  timetableId,
  students = [],
  durationNumber = 1,
  intervalId = null,
  onStudentMarked,
  latitude = 12.183700,
  longitude = 76.694200,
}) {
  const [hardwareStatus, setHardwareStatus] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState("idle"); // 'idle' | 'waiting' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState("Waiting for fingerprint...");
  const [lastMarked, setLastMarked] = useState(null);
  const [useDevSimulation, setUseDevSimulation] = useState(true);

  // Check hardware connection on mount
  const checkScanner = async () => {
    try {
      const res = await biometricApi.getStatus();
      const data = res.data?.data || res.data || res;
      setHardwareStatus(data);
    } catch (err) {
      setHardwareStatus({
        hardware_connected: false,
        message: "Biometric device not connected.",
      });
    }
  };

  useEffect(() => {
    checkScanner();
  }, []);

  const handleScanFingerprint = async () => {
    if (!selectedStudentId) {
      setScanState("error");
      setStatusMessage("Please select a student first.");
      return;
    }

    // Hardware verification check
    if (!hardwareStatus?.hardware_connected && !useDevSimulation) {
      setScanState("error");
      setStatusMessage("Biometric device not connected.");
      return;
    }

    setScanning(true);
    setScanState("waiting");
    setStatusMessage("Place your finger on the scanner. Waiting for fingerprint...");

    try {
      // Simulate hardware read delay if mock mode
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await biometricApi.verifyBiometric({
        timetable_id: timetableId,
        student_id: Number(selectedStudentId),
        latitude,
        longitude,
        duration_number: durationNumber,
        interval_id: intervalId,
        bypass_location: false,
      });

      const data = res.data?.data || res.data || res;
      setLastMarked(data);
      setScanState("success");
      setStatusMessage(`✓ Present: ${data.student_name} (${data.student_code})`);

      if (onStudentMarked) {
        onStudentMarked(data);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "";
      setScanState("error");

      if (detail.includes("already marked")) {
        setStatusMessage("Student already marked Present.");
      } else if (detail.includes("outside the college")) {
        setStatusMessage("You are outside the college campus.");
      } else if (detail.includes("device not connected")) {
        setStatusMessage("Biometric device not connected.");
      } else {
        setStatusMessage(detail || "Fingerprint verification failed.");
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            BIOMETRIC ATTENDANCE
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Hardware fingerprint scanner authentication & timestamp audit
          </p>
        </div>

        {/* Hardware Status Indicator Badge */}
        <div className="flex items-center gap-2">
          {hardwareStatus?.hardware_connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Scanner Online ({hardwareStatus.hardware_device})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              Biometric device not connected.
            </span>
          )}

          <button
            type="button"
            onClick={checkScanner}
            title="Refresh Scanner Status"
            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner Fingerpad Animation View */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-4">
          <div className="w-full bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-purple-500/20 shadow-inner relative overflow-hidden">
            {/* Visual Scanner Light Ring */}
            <div
              className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                scanning
                  ? "border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.8)] scale-105"
                  : scanState === "success"
                  ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  : scanState === "error"
                  ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                  : "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              }`}
            >
              <Fingerprint
                className={`w-20 h-20 transition-all duration-300 ${
                  scanning
                    ? "text-emerald-400 animate-pulse"
                    : scanState === "success"
                    ? "text-emerald-500"
                    : scanState === "error"
                    ? "text-rose-500"
                    : "text-purple-400"
                }`}
              />
            </div>

            <div className="mt-6 text-center space-y-1">
              <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Place your finger on the scanner.
              </div>
              <div
                className={`text-xs font-bold ${
                  scanState === "waiting"
                    ? "text-purple-400 animate-pulse"
                    : scanState === "success"
                    ? "text-emerald-400"
                    : scanState === "error"
                    ? "text-rose-400"
                    : "text-gray-400"
                }`}
              >
                Status: {statusMessage}
              </div>
            </div>
          </div>

          {/* Student Selector */}
          <div className="w-full space-y-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              Select Student to Authenticate
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 dark:text-white"
            >
              <option value="">-- Choose Student from Class --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_no || s.usn} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scan Action */}
          <button
            type="button"
            disabled={scanning || !selectedStudentId}
            onClick={handleScanFingerprint}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Reading Minutiae & Verifying...
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                Scan Fingerprint
              </>
            )}
          </button>
        </div>

        {/* Verification Result Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-750 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Hardware Verification Result
            </h4>

            {lastMarked ? (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-base">
                    {lastMarked.student_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Student</div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {lastMarked.student_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="text-gray-400">Student ID:</span>
                    <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {lastMarked.student_code}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Present
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Method:</span>
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      BIOMETRIC
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {lastMarked.time || "Now"}
                    </div>
                  </div>
                </div>

                {lastMarked.is_mock && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>DEVELOPMENT/MOCK provider: Verified via simulated matching logic.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Fingerprint className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                Select a student and press "Scan Fingerprint" to verify biometric credentials
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
