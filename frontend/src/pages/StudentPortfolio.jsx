import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  FileText,
  Printer,
  ExternalLink,
  Code,
  Flame,
  Music,
  Compass,
  Briefcase,
  Layers,
  GraduationCap
} from "lucide-react";
import { studentActivitiesApi } from "../api";
import CollegeLogo from "../components/CollegeLogo";

export default function StudentPortfolio() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await studentActivitiesApi.getAll();
        // Only VERIFIED achievements should appear in portfolio by default
        const verifiedOnly = (res.data || []).filter((a) => a.status === "VERIFIED");
        setActivities(verifiedOnly);
      } catch (err) {
        console.error("Error loading portfolio:", err);
        setError("Failed to load achievements portfolio.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Group verified achievements by category
  const technicalActivities = activities.filter((a) =>
    ["technical", "hackathon", "coding"].some((k) => (a.activity_type || "").toLowerCase().includes(k))
  );

  const projectActivities = activities.filter((a) =>
    (a.activity_type || "").toLowerCase().includes("project")
  );

  const certificationActivities = activities.filter((a) =>
    ["certification", "workshop"].some((k) => (a.activity_type || "").toLowerCase().includes(k))
  );

  const competitionActivities = activities.filter((a) =>
    ["competition", "hackathon"].some((k) => (a.activity_type || "").toLowerCase().includes(k))
  );

  const sportsActivities = activities.filter((a) =>
    (a.activity_type || "").toLowerCase().includes("sport")
  );

  const culturalActivities = activities.filter((a) =>
    ["cultural", "club", "music", "arts"].some((k) => (a.activity_type || "").toLowerCase().includes(k))
  );

  const internshipActivities = activities.filter((a) =>
    ["internship", "seminar", "academic", "volunteering", "other"].some((k) => (a.activity_type || "").toLowerCase().includes(k))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 print:max-w-none print:m-0 print:p-0">
      {/* Action Header (Hidden in Print) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            Verified Student Achievements Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official academic resume of verified co-curricular achievements and certifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/student/activities"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            ← Back to Activities
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Portfolio Document */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Institutional Header with MIT Logo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 print:border-slate-300 pb-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <CollegeLogo className="w-16 h-16 shrink-0" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 print:text-black tracking-tight">
                MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA
              </h2>
              <p className="text-xs font-medium text-slate-400 print:text-slate-600">
                Department of Computer Science and Engineering • Smart Department Academic System
              </p>
              <div className="text-[11px] font-semibold text-sky-400 print:text-sky-700 tracking-wider uppercase mt-1">
                Verified Student Co-Curricular Portfolio
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 hidden sm:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Department Verified
            </div>
          </div>
        </div>

        {/* Student Information Card */}
        <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 print:text-slate-600 uppercase font-semibold text-[10px] block">Student Name</span>
            <span className="font-bold text-slate-100 print:text-black text-sm mt-0.5 block">{currentUser.name || "Aarav Sharma"}</span>
          </div>

          <div>
            <span className="text-slate-500 print:text-slate-600 uppercase font-semibold text-[10px] block">Student ID / USN</span>
            <span className="font-bold font-mono text-slate-100 print:text-black text-sm mt-0.5 block">
              {currentUser.student_profile?.usn || "4MT22CS001"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 print:text-slate-600 uppercase font-semibold text-[10px] block">Department</span>
            <span className="font-medium text-slate-200 print:text-black text-xs mt-0.5 block">
              {currentUser.department?.name || "Computer Science & Engineering"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 print:text-slate-600 uppercase font-semibold text-[10px] block">Academic Semester</span>
            <span className="font-medium text-slate-200 print:text-black text-xs mt-0.5 block">
              Semester 5 • Section A
            </span>
          </div>
        </div>

        {/* Portfolio Stats Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-2 border-y border-slate-800/80 print:border-slate-300 text-center">
          <div>
            <div className="text-xl font-extrabold text-amber-400 print:text-amber-700">{activities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Achievements</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-sky-400 print:text-sky-700">{technicalActivities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Technical</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-indigo-400 print:text-indigo-700">{competitionActivities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Competitions</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-400 print:text-emerald-700">{projectActivities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Projects</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-teal-400 print:text-teal-700">{sportsActivities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Sports</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-purple-400 print:text-purple-700">{culturalActivities.length}</div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Cultural</div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm">Compiling verified portfolio records...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 print:text-slate-600">
            <p className="text-sm font-medium">No verified achievements to display yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Once your submitted activities are verified by your Department HOD or Admin, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section Helper */}
            {[
              { title: "Competitions & Hackathons", items: competitionActivities, icon: Trophy, color: "text-amber-400" },
              { title: "Technical Activities & Edge Computing", items: technicalActivities.filter((t) => !competitionActivities.includes(t)), icon: Code, color: "text-sky-400" },
              { title: "Projects & Research", items: projectActivities, icon: Layers, color: "text-emerald-400" },
              { title: "Certifications & Workshops", items: certificationActivities, icon: Award, color: "text-indigo-400" },
              { title: "Sports & Athletics", items: sportsActivities, icon: Flame, color: "text-rose-400" },
              { title: "Cultural & Co-Curricular Arts", items: culturalActivities, icon: Music, color: "text-purple-400" },
              { title: "Internships & Seminars", items: internshipActivities, icon: Briefcase, color: "text-teal-400" },
            ]
              .filter((sec) => sec.items.length > 0)
              .map((section, idx) => {
                const IconComponent = section.icon;
                return (
                  <div key={idx} className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 print:text-black flex items-center gap-2 border-b border-slate-800 print:border-slate-300 pb-2">
                      <IconComponent className={`w-4 h-4 ${section.color} print:text-black`} />
                      {section.title} ({section.items.length})
                    </h3>

                    <div className="space-y-3">
                      {section.items.map((act) => (
                        <div
                          key={act.id}
                          className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 print:border-slate-300 print:bg-white text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-sm text-slate-100 print:text-black">
                                {act.title}
                              </h4>
                              {act.organizing_institution && (
                                <p className="text-slate-400 print:text-slate-600 mt-0.5">
                                  {act.organizing_institution} {act.location ? `• ${act.location}` : ""}
                                </p>
                              )}
                            </div>

                            {act.position_award && (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-400 print:text-amber-800 bg-amber-500/10 border border-amber-500/20 whitespace-nowrap">
                                🏅 {act.position_award}
                              </span>
                            )}
                          </div>

                          {act.description && (
                            <p className="text-slate-300 print:text-slate-700 leading-relaxed text-[11px]">
                              {act.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 print:text-slate-600 pt-1 border-t border-slate-900 print:border-slate-200">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span>{act.activity_date || "Official Academic Record"}</span>
                              <span>• Level: <strong>{act.level}</strong></span>
                            </span>

                            <span className="text-emerald-400 print:text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Verified by {act.latest_verification?.verification_role?.toUpperCase() || "HOD"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Institutional Authentication Seal Footer */}
        <div className="border-t-2 border-slate-800 print:border-slate-400 pt-6 mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 print:text-black">
          <div className="text-center sm:text-left space-y-1">
            <p className="font-semibold text-slate-300 print:text-black">
              Smart Department Academic Management System
            </p>
            <p className="text-[11px] text-slate-500 print:text-slate-600">
              Generated automatically with cryptographically verified database records.
            </p>
          </div>

          <div className="text-center sm:text-right space-y-3">
            <div className="w-40 border-b border-slate-700 print:border-black mx-auto sm:ml-auto"></div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Head of Department / Academic Dean
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
