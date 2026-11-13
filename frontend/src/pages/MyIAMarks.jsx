import React, { useEffect, useState } from "react";
import { getMyIAMarks } from "../services/marksApi";
import "./marks.css";

export default function MyIAMarks() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyIAMarks()
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.detail || "Unable to load marks."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h3 style={{ padding: "2rem", color: "#94a3b8" }}>Loading your marks...</h3>;
  if (error) return <p className="ia-error">{error}</p>;

  return (
    <div className="ia-container">
      <h1>My Internal Assessment Marks</h1>

      <div className="ia-card">
        <h3>{data?.student_name}</h3>
        <p>USN: {data?.usn}</p>
        <p>Section: {data?.section}</p>
        <p className="privacy-message">
          🔒 Your marks are private. Only your own published marks
          are displayed.
        </p>
      </div>

      {data?.marks?.length === 0 ? (
        <p>Your IA marks have not been published yet.</p>
      ) : (
        <div className="ia-table-wrapper">
          <table className="ia-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Subject Code</th>
                <th>IA</th>
                <th>Original Marks</th>
                <th>Converted Marks</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {data?.marks?.map((m) => (
                <tr key={m.id}>
                  <td>{m.subject_name}</td>
                  <td>{m.subject_code}</td>
                  <td>{m.assessment}</td>
                  <td>
                    {m.status === "Absent"
                      ? "AB"
                      : `${m.raw_marks}/${m.raw_max_marks}`}
                  </td>
                  <td>
                    {m.status === "Absent"
                      ? "AB"
                      : `${m.marks}/${m.max_marks}`}
                  </td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

