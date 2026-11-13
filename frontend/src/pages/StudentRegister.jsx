import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import studentAuthApi from "../api/studentAuth";
import CollegeLogo from "../components/CollegeLogo";
import { 
  IdCard, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  GraduationCap 
} from "lucide-react";

export default function StudentRegister() {
  const navigate = useNavigate();

  // Registration states: "usn_check" | "gmail_verify" | "otp_password" | "completed"
  const [step, setStep] = useState("usn_check");

  // Form Fields
  const [usn, setUsn] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const [gmail, setGmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Resend Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Verify USN
  const handleVerifyUsn = async (e) => {
    e?.preventDefault();
    if (!usn.trim()) {
      setError("Please enter your USN.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await studentAuthApi.verifyUsn(usn.trim());
      setStudentDetails(res);

      if (!res.has_gmail) {
        setError(
          "Your Gmail is not registered in department records. Please contact Department Admin to update your Gmail address."
        );
        return;
      }

      if (res.is_registered) {
        setError("Your account is already registered! Please proceed to login.");
        return;
      }

      setStep("gmail_verify");
      setSuccessMsg(`Welcome, ${res.name}! Please confirm your registered Gmail.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "USN not found in official student records. Please contact your HOD or Admin."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTP to Gmail
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!gmail.trim()) {
      setError("Please enter your registered Gmail address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await studentAuthApi.register(usn.trim(), gmail.trim());
      setSuccessMsg(res.message || "A 6-digit verification code has been sent to your Gmail.");
      setStep("otp_password");
      setResendCooldown(30);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Entered Gmail does not match our official records for this USN. Please verify and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await studentAuthApi.resendOtp(usn.trim());
      setSuccessMsg(res.message || "A new verification code has been sent.");
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Create Password
  const handleCompleteRegistration = async (e) => {
    e?.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code received on your Gmail.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await studentAuthApi.verifyEmail({
        usn: usn.trim(),
        otp: otp.trim(),
        password: password,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(res.message || "Registration completed successfully!");
      setStep("completed");

      setTimeout(() => {
        navigate("/login?registered=true&usn=" + encodeURIComponent(usn.trim()));
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Verification failed. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <CollegeLogo className="h-16 w-auto drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-400" />
            Student Account Registration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official Self-Registration for 5th Semester CSE Students
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className={`flex flex-col items-center gap-1 ${step === "usn_check" ? "text-indigo-400" : "text-emerald-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
              step === "usn_check" 
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" 
                : "border-emerald-500 bg-emerald-500/20 text-emerald-300"
            }`}>
              1
            </div>
            <span className="text-[11px] font-medium">Verify USN</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step !== "usn_check" ? "bg-emerald-500/50" : "bg-slate-800"}`} />

          <div className={`flex flex-col items-center gap-1 ${
            step === "gmail_verify" ? "text-indigo-400" : (step === "otp_password" || step === "completed") ? "text-emerald-400" : "text-slate-600"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
              step === "gmail_verify" 
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" 
                : (step === "otp_password" || step === "completed") 
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" 
                : "border-slate-800 bg-slate-900 text-slate-500"
            }`}>
              2
            </div>
            <span className="text-[11px] font-medium">Gmail & OTP</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 ${step === "otp_password" || step === "completed" ? "bg-emerald-500/50" : "bg-slate-800"}`} />

          <div className={`flex flex-col items-center gap-1 ${
            step === "otp_password" ? "text-indigo-400" : step === "completed" ? "text-emerald-400" : "text-slate-600"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
              step === "otp_password" 
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" 
                : step === "completed" 
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" 
                : "border-slate-800 bg-slate-900 text-slate-500"
            }`}>
              3
            </div>
            <span className="text-[11px] font-medium">Password</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: USN Lookup */}
        {step === "usn_check" && (
          <form onSubmit={handleVerifyUsn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                University Seat Number (USN)
              </label>
              <div className="relative">
                <IdCard className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 4MN24CS002 or 4MN25CS410"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase tracking-wider text-sm transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Enter your official VTU USN as printed on your IA marks card or department roster.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !usn.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Verify USN <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Confirm Registered Gmail */}
        {step === "gmail_verify" && studentDetails && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Student Preview Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Identified Student</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{studentDetails.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs rounded-md font-mono">
                  Sec {studentDetails.section}
                </span>
              </div>
              <div className="text-xs text-slate-400 grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                <div><span className="text-slate-500">USN:</span> {studentDetails.usn}</div>
                <div><span className="text-slate-500">Semester:</span> {studentDetails.semester}th Sem</div>
                <div className="col-span-2">
                  <span className="text-slate-500">Registered Gmail Hint:</span>{" "}
                  <span className="font-mono text-indigo-300 font-semibold">{studentDetails.masked_gmail}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Enter Your Registered Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value.toLowerCase())}
                  required
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Must match the official Gmail submitted in the 5th semester class roster.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("usn_check");
                  setError("");
                }}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition text-sm cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading || !gmail.trim()}
                className="w-2/3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: OTP Verification & Password Creation */}
        {step === "otp_password" && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  6-Digit Verification Code (OTP)
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest text-center text-lg transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Code sent to <span className="text-slate-300">{gmail}</span>. Valid for 10 minutes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Create Secure Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || !password || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Verify & Complete Registration
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Completed Confirmation */}
        {step === "completed" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Registration Complete!</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Your email has been verified and your student account is active. You can now log in using your USN or registered Gmail.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition text-sm cursor-pointer"
              >
                Proceed to Login
              </button>
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-between">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            ← Back to Login
          </Link>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">
            Need help? Contact Dept Admin
          </span>
        </div>
      </div>
    </div>
  );
}

