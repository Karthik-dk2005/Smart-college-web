import React, { useState, useEffect } from "react";
import CameraCapture from "../components/CameraCapture";
import { faceApi, studentsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  ScanFace,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function FaceRegistration() {
  const { user, role } = useAuth();
  const { success, error } = useToast();

  const isStudent = role?.toLowerCase() === "student";
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    const init = async () => {
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
      const res = await faceApi.getFaceStatus(studentId);
      const data = res.data?.data || res.data || res;
      setFaceRegistered(data.has_face_registered);
      setRegistrationInfo(data);
    } catch (err) {
      setFaceRegistered(false);
    }
  };

  const handleStudentChange = (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    setCapturedPhoto(null);
    checkStatus(sId);
  };

  const handleCapture = (dataUrl) => {
    setCapturedPhoto(dataUrl);
  };

  const handleSubmitRegistration = async () => {
    if (!capturedPhoto || !selectedStudentId) {
      error("Please capture a photo first.");
      return;
    }

    setLoading(true);
    try {
      const res = await faceApi.registerFace(Number(selectedStudentId), capturedPhoto);
      success("Face registered successfully!");
      setFaceRegistered(true);
      checkStatus(selectedStudentId);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Failed to register face.";
      error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Biometric Enrollment
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ScanFace className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Face Registration & Profile
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Capture and associate AI facial embeddings securely with your student account.
            </p>
          </div>

          {faceRegistered && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Face Profile Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Student Selector & Camera Capture */}
        <div className="md:col-span-8 space-y-6">
          {!isStudent && (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                Select Student for Face Registration
              </label>
              <select
                value={selectedStudentId}
                onChange={handleStudentChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.usn || s.student_id} — {s.name} ({s.semester}{s.section})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Capture Component */}
          <CameraCapture
            onCapture={handleCapture}
            autoStart={true}
            captureLabel="Capture Face Sample"
          />

          {capturedPhoto && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitRegistration}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Face Embedding...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Save Face Profile
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Instructions & Status */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Capture Guidelines
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside">
              <li>Look directly at the web camera with neutral expression.</li>
              <li>Ensure good lighting without harsh glare or heavy shadows.</li>
              <li>Remove dark sunglasses, masks, or hats that cover forehead.</li>
              <li>Center your face inside the oval viewfinder frame.</li>
            </ul>
          </div>

          {registrationInfo?.has_face_registered && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Face Representation
              </div>
              <p className="text-emerald-700 dark:text-emerald-400">
                128-dimensional mathematical representation is stored securely. No raw photos are publicly exposed.
              </p>
              {registrationInfo.registered_at && (
                <div className="text-[11px] text-emerald-600/80 pt-1">
                  Enrolled on: {new Date(registrationInfo.registered_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
