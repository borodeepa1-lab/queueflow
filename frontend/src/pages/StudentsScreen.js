import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const sortOptions = [
  { value: "stack", label: "Queue stack" },
  { value: "wait", label: "Wait time" },
  { value: "status", label: "Status" },
  { value: "counter", label: "Counter" },
  { value: "name", label: "Participant name" }
];

const statusRank = {
  IN_PROGRESS: 1,
  WAITING: 2,
  SKIPPED: 3,
  COMPLETED: 4
};

const counterColor = (student) => {
  if (student.status === "SKIPPED") return "counter-tag--red";
  if (student.status === "COMPLETED") return "counter-tag--green";
  if (student.status === "IN_PROGRESS") return "counter-tag--orange";
  return "counter-tag--orange";
};

function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("position");
  const [sortDirection, setSortDirection] = useState("asc");
  const eventId = localStorage.getItem("event_id");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!eventId) {
        setStudents([]);
        return;
      }

      try {
        const res = await API.get(`/queue/all-tokens?event_id=${eventId}`);
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchStudents();
  }, [eventId]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const searchSpace = [
        student.student_name,
        student.token_number,
        student.roll_number,
        student.service_type,
        student.counter_name
      ].filter(Boolean).join(" ").toLowerCase();

      return searchSpace.includes(query);
    });

    const direction = sortDirection === "asc" ? 1 : -1;

    return filtered.sort((left, right) => {
      switch (sortBy) {
        case "wait":
          return ((left.estimated_wait || 0) - (right.estimated_wait || 0)) * direction;
        case "status":
          return ((statusRank[left.status] || 99) - (statusRank[right.status] || 99)) * direction;
        case "counter":
          return String(left.counter_name || left.service_type || "").localeCompare(
            String(right.counter_name || right.service_type || "")
          ) * direction;
        case "name":
          return String(left.student_name || "").localeCompare(String(right.student_name || "")) * direction;
        case "stack":
        default:
          return ((statusRank[left.status] || 99) - (statusRank[right.status] || 99)) * direction;
      }
    });
  }, [search, sortBy, sortDirection, students]);

  const averageWait = students.length
    ? Math.round(students.reduce((sum, student) => sum + Number(student.estimated_wait || 0), 0) / students.length)
    : 0;
  const activeTokens = students.filter((student) => ["WAITING", "IN_PROGRESS", "SKIPPED"].includes(student.status)).length;
  const completedTokens = students.filter((student) => student.status === "COMPLETED").length;

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Participant queue board</p>
          <h2>Search tokens, wait time, and counter assignment</h2>
        </div>
        <p className="page-copy">
          This screen is designed as the participant-facing queue list with searchable status, color-coded tokens, and
          multiple sort methods.
        </p>
      </section>

      <section className="analytics-strip">
        <article className="metric-card">
          <span>Active tokens</span>
          <strong>{activeTokens}</strong>
          <p>Waiting, in-progress, and skipped tokens are counted here.</p>
        </article>
        <article className="metric-card">
          <span>Completed tokens</span>
          <strong>{completedTokens}</strong>
          <p>Completed entries are stacked at the bottom of the list.</p>
        </article>
        <article className="metric-card">
          <span>Total tokens</span>
          <strong>{students.length}</strong>
          <p>Total tokens generated for the selected event.</p>
        </article>
        <article className="metric-card">
          <span>Average wait</span>
          <strong>{averageWait || 3} min</strong>
          <p>Shows the default average time when live data is not available.</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="queue-toolbar">
          <label className="field">
            <span>Search participant or token</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, token, roll number, or counter"
            />
          </label>

          <label className="field">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Direction</span>
            <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        <div className="table-shell">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Token</th>
                <th>Counter</th>
                <th>Status</th>
                <th>Wait</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={`${student.token_number}-${student.student_name}`}>
                  <td><strong>{student.student_name}</strong><span>{student.email || student.roll_number || student.service_type || "Participant token"}</span></td>
                  <td>{student.token_number}</td>
                  <td>
                    <span className={`counter-tag ${counterColor(student)}`}>
                      {student.counter_name || student.service_type || "Counter pending"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill status-pill--${String(student.status || "idle").toLowerCase()}`}>
                      {student.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td>{student.estimated_wait ? `${student.estimated_wait} min` : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StudentsScreen;
