import React, { useRef, useState, useEffect } from "react";
import { faceApi } from "../api";
import {
  Camera,
  CameraOff,
  ScanFace,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
} from "lucide-react";

export default function FaceScanner({
  timetableId,
  durationNumber = 1,
  intervalId = null,
  onStudentMarked,
  latitude = 12.183700,
  longitude = 76.694200,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'info' | 'success' | 'error' | 'warning'
  const [lastRecognizedStudent, setLastRecognizedStudent] = useState(null);

  // Initialize camera on mount
  const startCamera = async () => {
    setStatusMessage("");
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setStatusType("error");
      setStatusMessage("Camera permission required or device unavailable.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const handleScanFace = async () => {
    if (!cameraActive || scanning) return;
    const frame = captureFrame();
    if (!frame) return;

    setScanning(true);
    setStatusType("info");
    setStatusMessage("Detecting and verifying face...");

    try {
      const res = await faceApi.verifyFace({
        image: frame,
        timetable_id: timetableId,
        latitude: latitude || 12.183700,
        longitude: longitude || 76.694200,
        duration_number: durationNumber,
        interval_id: intervalId,
        bypass_location: false,
      });

      const data = res.data?.data || res.data || res;
      setLastRecognizedStudent(data);
      setStatusType("success");
      setStatusMessage(`✓ Present: ${data.student_name} (${data.student_code})`);

      if (onStudentMarked) {
        onStudentMarked(data);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "";

      if (detail.includes("Please look at the camera") || detail.includes("blurry") || detail.includes("dark")) {
        setStatusType("warning");
        setStatusMessage("Please look at the camera and try again.");
      } else if (detail.includes("already marked")) {
        setStatusType("warning");
        setStatusMessage("Student already marked Present.");
      } else if (detail.includes("outside the college")) {
        setStatusType("error");
        setStatusMessage("You are outside the college campus.");
      } else {
        setStatusType("error");
        setStatusMessage("Face not recognized.");
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            AI Face Recognition Attendance
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Face detection, feature representation, and geofence verification
          </p>
        </div>

        {cameraActive ? (
          <button
            type="button"
            onClick={stopCamera}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
          >
            <CameraOff className="w-3.5 h-3.5" />
            Stop Camera
          </button>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
          >
            <Camera className="w-3.5 h-3.5" />
            Start Camera
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Video Viewport */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-md flex items-center justify-center border-2 border-indigo-500/20">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* Visual Target Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-44 h-56 border-2 rounded-full transition-all duration-300 ${
                      scanning
                        ? "border-emerald-400 scale-105 shadow-[0_0_25px_rgba(52,211,153,0.7)]"
                        : "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    }`}
                  />
                </div>
                {scanning && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />
                )}
              </>
            ) : (
              <div className="text-center p-8 text-gray-400 space-y-3">
                <CameraOff className="w-12 h-12 mx-auto text-gray-500" />
                <p className="text-xs">Camera is currently inactive</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-indigo-700 transition"
                >
                  Start Camera
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Action Trigger */}
          <div className="mt-4 w-full flex justify-center">
            <button
              type="button"
              disabled={!cameraActive || scanning}
              onClick={handleScanFace}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Face Representation...
                </>
              ) : (
                <>
                  <ScanFace className="w-5 h-5" />
                  Recognize & Mark Present
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Recognition Outcome Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-750 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Recognition Outcome
            </h4>

            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                  statusType === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : statusType === "warning"
                    ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    : statusType === "error"
                    ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                    : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {statusType === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : statusType === "warning" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {lastRecognizedStudent ? (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
                    {lastRecognizedStudent.student_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Student</div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {lastRecognizedStudent.student_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="text-gray-400">Student ID:</span>
                    <div className="font-bold text-gray-800 dark:text-gray-200 font-mono">
                      {lastRecognizedStudent.student_code}
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
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                      FACE
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {lastRecognizedStudent.time || "Now"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                <ScanFace className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                Align face with camera and click "Recognize & Mark Present"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
