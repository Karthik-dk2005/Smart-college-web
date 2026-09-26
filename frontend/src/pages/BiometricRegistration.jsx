import React, { useState, useEffect } from "react";
import { biometricApi, studentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";

export default function BiometricRegistration() {
  const { user, role } = useAuth();
  const { success, error } = useToast();

  const isStudent = role?.toLowerCase() === "student";
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [scannerStatus, setScannerStatus] = useState(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check scanner hardware status
      try {
        const res = await biometricApi.getStatus();
        const data = res.data?.data || res.data || res;
        setScannerStatus(data);
      } catch (err) {
        setScannerStatus({ hardware_connected: false, message: "Biometric device not connected." });
      }

      if (isStudent) {
        const sId = user?.student_id || user?.id;
        setSelectedStudentId(String(sId));
        checkStatus(sId);
      } else {
        try {
          const res = await studentsApi.getAll({ limit: 100 });
          const list = res.data?.data || res.data || res || [];
          setStudents(Array.isArray(list) ? list : []);
          if (list.length > 0) {
            setSelectedStudentId(String(list[0].id));
            checkStatus(list[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, [user, role]);

  const checkStatus = async (studentId) => {
    if (!studentId) return;
    try {
      const res = await biometricApi.getStudentStatus(studentId);
      const data = res.data?.data || res.data || res;
      setBiometricRegistered(data.has_biometric_registered);
      setBiometricInfo(data);
    } catch (err) {
      setBiometricRegistered(false);
    }
  };

  const handleStudentChange = (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    checkStatus(sId);
  };

  const handleRegisterBiometric = async () => {
    if (!selectedStudentId) {
      error("Please select a student.");
      return;
    }

    setRegistering(true);
    try {
      // Simulate fingerpad scanner delay
      await new Promise((r) => setTimeout(r, 600));

      const res = await biometricApi.registerBiometric(Number(selectedStudentId));
      const data = res.data?.data || res.data || res;
      success("Biometric minutiae profile registered successfully!");
      setBiometricRegistered(true);
      checkStatus(selectedStudentId);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Failed to register fingerprint.";
      error(detail);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                Hardware Biometric Enrollment
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              Biometric Fingerprint Registration
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enroll hashed fingerprint minutiae templates safely without storing raw fingerprint images.
            </p>
          </div>

          {biometricRegistered && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Biometric Enrolled</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Enrollment Action & Pad */}
        <div className="md:col-span-7 space-y-6">
          {!isStudent && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Select Student for Biometric Enrollment
              </label>
              <select
                value={selectedStudentId}
                onChange={handleStudentChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.usn || s.student_id} — {s.name} ({s.semester}{s.section})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Pad Interactive View */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center space-y-6">
            <div
              className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                registering
                  ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.7)] scale-105"
                  : biometricRegistered
                  ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  : "border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              }`}
            >
              <Fingerprint
                className={`w-20 h-20 transition-all ${
                  registering
                    ? "text-purple-500 animate-pulse"
                    : biometricRegistered
                    ? "text-emerald-500"
                    : "text-purple-400"
                }`}
              />
            </div>

            <div className="text-center space-y-1">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {registering
                  ? "Scanning Fingerprint Minutiae..."
                  : biometricRegistered
                  ? "Fingerprint Registered & Active"
                  : "Ready for Fingerprint Registration"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Place your right index finger firmly on the sensor pad.
              </p>
            </div>

            <button
              type="button"
              disabled={registering || !selectedStudentId}
              onClick={handleRegisterBiometric}
              className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {registering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Minutiae Hash...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  {biometricRegistered ? "Re-Enroll Fingerprint" : "Enroll Fingerprint"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Hardware Diagnostics & Info */}
        <div className="md:col-span-5 space-y-4">
          {/* Scanner Device Card */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Scanner Hardware Device
            </h3>

            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Device Status:</span>
                {scannerStatus?.hardware_connected ? (
                  <span className="font-bold text-emerald-600">Online</span>
                ) : (
                  <span className="font-bold text-amber-600">Simulated / Virtual</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Provider:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {scannerStatus?.active_provider || "DEVELOPMENT_MOCK"}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 pt-1">
                {scannerStatus?.message}
              </div>
            </div>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="bg-purple-50 dark:bg-purple-950/30 p-5 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs space-y-2">
            <div className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Privacy & Zero-Image Storage
            </div>
            <p className="text-purple-700 dark:text-purple-400 leading-relaxed">
              In accordance with security standards, the system extracts only cryptographic minutiae hashes. Raw fingerprint images are never stored or transferred across the network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
