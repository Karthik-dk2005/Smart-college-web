import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./IAMarks.css";

const subjects = [
  { name: "SE", code: "BCS501", max1: 30, max2: 25 },
  { name: "CN", code: "BCS502", max1: 30, max2: 15 },
  { name: "TOC", code: "BCS503", max1: 30, max2: 25 },
  { name: "RM & IPR", code: "BRMK557", max1: 30, max2: 25 },
  { name: "UNIX", code: "BCS515C", max1: 30, max2: 25 },
  { name: "ENV", code: "BCS508", max1: 25, max2: 25 },
];

export default function IAMarks() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("All");
  const [subject, setSubject] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Resilient endpoint resolution (Vite dev proxy or unified server)
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const isRemote = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
    axios
      .get("/api/ia-marks", { headers })
      .then((response) => setRecords(response.data))
      .catch(() => {
        if (!isRemote) {
          return axios
            .get("http://localhost:8000/api/ia-marks", { headers })
            .then((response) => setRecords(response.data))
            .catch(() => setError("Unable to load IA marks. Please try again."));
        }
        setError("Unable to load IA marks. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((student) => {
      const matchesSearch =
        student.student_name.toLowerCase().includes(search.toLowerCase()) ||
        student.usn.toLowerCase().includes(search.toLowerCase());

      const matchesSection =
        section === "All" || student.section === section;

      return matchesSearch && matchesSection;
    });
  }, [records, search, section]);

  const exportCSV = () => {
    const headers = [
      "Student Name", "USN", "Section", "Subject",
      "Subject Code", "Component 1", "Max 1",
      "Component 2", "Max 2"
    ];

    const rows = [];

    filteredRecords.forEach((student) => {
      student.marks.forEach((mark) => {
        rows.push([
          student.student_name,
          student.usn,
          student.section,
          mark.subject_name,
          mark.subject_code,
          mark.component1,
          mark.max1,
          mark.component2,
          mark.max2,
        ]);
      });
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? "").replaceAll('"', '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SmartDept_IA_Marks.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <p style={{ padding: "2rem", color: "#94a3b8" }}>Loading IA marks...</p>;
  if (error) return <p style={{ padding: "2rem", color: "#f87171" }}>{error}</p>;

  return (
    <div className="ia-container">
      <h2>Internal Assessment Marks</h2>
      <p>CSE – Fifth Semester – Academic Year 2026–27</p>

      <div className="ia-filters">
        <input
          type="text"
          placeholder="Search student name or USN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="All">All Sections</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
        </select>

        <button onClick={exportCSV}>Export Excel-compatible CSV</button>
      </div>

      <div className="ia-subjects">
        {subjects.map((item) => (
          <button
            key={item.code}
            className={subject === item.code ? "active" : ""}
            onClick={() =>
              setSubject(subject === item.code ? "All" : item.code)
            }
          >
            {item.name} ({item.code})
          </button>
        ))}
      </div>

      <div className="ia-table-wrapper">
        <table className="ia-table">
          <thead>
            <tr>
              <th>Sl.No</th>
              <th>Student Name</th>
              <th>USN</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Subject Code</th>
              <th>Component 1</th>
              <th>Max Marks</th>
              <th>Component 2</th>
              <th>Max Marks</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.flatMap((student) =>
              student.marks
                .filter((mark) =>
                  subject === "All" || mark.subject_code === subject
                )
                .map((mark, index) => (
                  <tr key={`${student.usn}-${mark.subject_code}`}>
                    <td>{index + 1}</td>
                    <td>{student.student_name}</td>
                    <td>{student.usn}</td>
                    <td>{student.section}</td>
                    <td>{mark.subject_name}</td>
                    <td>{mark.subject_code}</td>
                    <td>
                      {mark.component1 === "AB"
                        ? <span className="absent">AB</span>
                        : mark.component1}
                    </td>
                    <td>{mark.max1}</td>
                    <td>
                      {mark.component2 === "AB"
                        ? <span className="absent">AB</span>
                        : mark.component2}
                    </td>
                    <td>{mark.max2}</td>
                  </tr>
                ))
            )}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No student records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="ia-note">
        AB = Absent. Original marks must be preserved.
      </p>
    </div>
  );
}

