import React, { useEffect, useState } from "react";
import API from "../services/api";

function Students() {

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const event_id = localStorage.getItem("event_id");

  useEffect(() => {
    fetchStudents();
  }, [event_id]);

  const fetchStudents = async () => {
    try {
      const res = await API.get(`/queue/all-tokens?event_id=${event_id}`);
      setStudents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const filtered = students.filter((s) =>
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.token_number.toLowerCase().includes(search.toLowerCase())
  );

  const getColor = (status) => {
    if (status === "WAITING") return "orange";
    if (status === "IN_PROGRESS") return "red";
    if (status === "COMPLETED") return "green";
    return "gray";
  };

  return (
    <div>

      <h2>Students Queue</h2>

      {/* Search */}
      <input
        placeholder="Search by name or token..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Token</th>
            <th>Service</th>
            <th>Status</th>
            <th>Position</th>
            <th>Wait Time</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((s, index) => (
            <tr key={index}>
              <td>{s.student_name}</td>
              <td>{s.token_number}</td>
              <td>{s.service_type}</td>

              <td style={{ color: getColor(s.status) }}>
                {s.status}
              </td>

              <td>{s.position || "-"}</td>
              <td>
                {s.estimated_wait ? `${s.estimated_wait} min` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default Students;