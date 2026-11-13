import React, { useState } from "react";
import "./UploadIAMarks.css";

const API_URL = "/api/marks/import-pdf";

export default function UploadIAMarks() {
  const [file, setFile] = useState(null);
  const [section, setSection] = useState("A");
  const [semester, setSemester] = useState("5");
  const [assessment, setAssessment] = useState("IA1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setMessage("");
    setError("");
    setStudents([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file only.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select an IA marks PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section", section);
    formData.append("semester", semester);
    formData.append("assessment", assessment);

    setLoading(true);
    setError("");
    setMessage("");
    setStudents([]);

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || "PDF upload failed.");
      }

      setMessage(
        result.message || "IA marks PDF uploaded and processed successfully."
      );

      setStudents(result.students || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ia-upload-page">
      <div className="ia-upload-header">
        <div>
          <h2>Internal Assessment Marks</h2>
          <p>Upload student names, USNs and subject-wise IA marks.</p>
        </div>
        <span className="ia-badge">Smart Department</span>
      </div>

      <div className="ia-upload-card">
        <h3>Upload IA Marks PDF</h3>

        <form onSubmit={handleUpload}>
          <div className="ia-form-grid">
            <div className="ia-field">
              <label>Department</label>
              <input value="Computer Science and Engineering" disabled />
            </div>

            <div className="ia-field">
              <label>Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="5">5th Semester</option>
              </select>
            </div>

            <div className="ia-field">
              <label>Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div className="ia-field">
              <label>Assessment</label>
              <select
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
              >
                <option value="IA1">First Internal Assessment</option>
                <option value="IA2">Second Internal Assessment</option>
                <option value="IA3">Third Internal Assessment</option>
              </select>
            </div>
          </div>

          <div className="ia-file-area">
            <div className="upload-icon">📄</div>
            <h3>Select IA Marks PDF</h3>
            <p>Choose the PDF matching the selected section and assessment.</p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            {file && (
              <p className="selected-file">
                Selected: {file.name}
              </p>
            )}
          </div>

          {error && <div className="ia-error">{error}</div>}
          {message && <div className="ia-success">{message}</div>}

          <button
            type="submit"
            className="ia-upload-button"
            disabled={loading || !file}
          >
            {loading ? "Uploading and Processing..." : "Upload IA Marks"}
          </button>
        </form>
      </div>

      <div className="ia-subject-card">
        <h3>Subjects in the uploaded Fifth Semester IA PDF</h3>
        <div className="ia-subject-grid">
          {[
            ["SE", "BCS501"],
            ["CN", "BCS502"],
            ["TOC", "BCS503"],
            ["RM & IPR", "BRMK557"],
            ["UNIX", "BCS515C"],
            ["ENV", "BCS508"],
          ].map(([name, code]) => (
            <div className="ia-subject" key={code}>
              <strong>{name}</strong>
              <span>{code}</span>
            </div>
          ))}
        </div>
        <small>
          Subject names and codes are shown as printed in the uploaded PDF.
        </small>
      </div>

      {students.length > 0 && (
        <div className="ia-results-card">
          <h3>Imported Student IA Marks</h3>
          <p>{students.length} student records returned by the server.</p>

          <div className="ia-table-wrapper">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Sl. No.</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>IA Marks</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id || `${student.usn}-${index}`}>
                    <td>{student.sl_no || index + 1}</td>
                    <td>{student.student_name}</td>
                    <td>{student.usn}</td>
                    <td>{student.section || section}</td>
                    <td>{student.subject}</td>
                    <td>
                      {student.marks === "AB" ? "AB" : student.marks}
                      {student.max_marks != null
                        ? ` / ${student.max_marks}`
                        : ""}
                    </td>
                    <td>
                      {student.marks === "AB" ? "Absent" : "Recorded"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

