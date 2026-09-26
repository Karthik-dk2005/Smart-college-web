import React, { useRef, useState, useEffect } from "react";
import { Camera, CameraOff, RefreshCw, Check, AlertCircle } from "lucide-react";

export default function CameraCapture({
  onCapture,
  autoStart = true,
  disabled = false,
  captureLabel = "Capture Photo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg("Camera access denied or unavailable. Please enable webcam permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);

    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Camera Preview
          </h3>
        </div>

        <div className="flex items-center gap-2">
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
              <RefreshCw className="w-3.5 h-3.5" />
              Start Camera
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport / Viewfinder */}
      <div className="relative aspect-video w-full max-w-lg mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-dashed border-indigo-500/30">
        {errorMsg ? (
          <div className="p-6 text-center space-y-2 text-rose-400">
            <AlertCircle className="w-10 h-10 mx-auto" />
            <p className="text-xs font-medium">{errorMsg}</p>
            <button
              type="button"
              onClick={startCamera}
              className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-rose-700 transition"
            >
              Retry Camera
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Oval Face Guide Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-60 border-2 border-indigo-400/80 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
              <span className="text-[11px] bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                Center face inside the oval frame
              </span>
            </div>
          </>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex justify-center gap-3 pt-2">
        {capturedImage ? (
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Photo
          </button>
        ) : (
          <button
            type="button"
            disabled={!cameraActive || disabled}
            onClick={handleCapture}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {captureLabel}
          </button>
        )}
      </div>
    </div>
  );
}
