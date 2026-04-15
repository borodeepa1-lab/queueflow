import React, { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "../services/api";

const initialAdminForm = {
  name: "",
  contact: "",
  password: "",
  event_name: "",
  event_type: "Admissions",
  start_date: "",
  end_date: ""
};

function AdminScreen() {
  const [view, setView] = useState("login");
  const [tokens, setTokens] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(initialAdminForm);
  const eventId = localStorage.getItem("event_id");

  const refetchTokens = async () => {
    if (!eventId) {
      setTokens([]);
      return;
    }

    const res = await API.get(`/queue/all-tokens?event_id=${eventId}`);
    setTokens(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/events");
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!eventId) {
          setTokens([]);
        } else {
          const tokenRes = await API.get(`/queue/all-tokens?event_id=${eventId}`);
          setTokens(Array.isArray(tokenRes.data) ? tokenRes.data : []);
        }
      } catch (error) {
        console.log(error);
      }

      if (!eventId) {
        setStats(null);
        return;
      }

      try {
        const res = await API.get(`/analytics?event_id=${eventId}`);
        setStats(res.data);
      } catch (error) {
        console.log(error);
        setStats(null);
      }
    };

    fetchData();
  }, [eventId]);

  const selectedEvent = useMemo(
    () => events.find((item) => String(item.event_id) === String(eventId)),
    [eventId, events]
  );

  const logs = useMemo(() => {
    const tokenLogs = tokens.slice(0, 6).map((token, index) => ({
      id: `${token.token_number}-${index}`,
      title: `${token.student_name || "Student"} updated token ${token.token_number}`,
      meta: `${token.status || "UNKNOWN"} at ${token.counter_name || token.service_type || "assigned counter"}`
    }));

    const eventLog = selectedEvent ? [{
      id: "event-live",
      title: `${selectedEvent.event_name} is visible on the platform`,
      meta: `Status ${selectedEvent.status || "IDLE"} for event ${selectedEvent.event_id}`
    }] : [];

    return [...eventLog, ...tokenLogs];
  }, [selectedEvent, tokens]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const startToken = async (tokenNumber) => {
    await API.post("/queue/start", { token_number: tokenNumber });
    await refetchTokens();
  };

  const completeToken = async (tokenNumber) => {
    await API.post("/queue/complete", { token_number: tokenNumber });
    await refetchTokens();
  };

  const skipToken = async (tokenNumber) => {
    await API.post("/queue/skip", { token_number: tokenNumber });
    await refetchTokens();
  };

  const generateDashboardPdf = async () => {
    const dashboard = document.getElementById("admin-dashboard-export");
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard, { scale: 2, backgroundColor: "#f8fafc" });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 190;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imageData, "PNG", 10, 10, width, height);
    pdf.save("queueflow-admin-dashboard.pdf");
  };

  const generateEventHistoryPdf = (event) => {
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFontSize(18);
    pdf.text(event.event_name || "Event", 15, 20);
    pdf.setFontSize(11);
    pdf.text(`Event ID: ${event.event_id}`, 15, 32);
    pdf.text(`Status: ${event.status || "UNKNOWN"}`, 15, 40);
    pdf.text(`Start: ${event.start_date || "Not available"}`, 15, 48);
    pdf.text(`End: ${event.end_date || "Not available"}`, 15, 56);
    pdf.text("History export placeholder for analytics PDF view.", 15, 70);
    pdf.save(`queueflow-event-${event.event_id}.pdf`);
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin host workspace</p>
          <h2>Register, go live, manage queues, and review event history</h2>
        </div>
        <p className="page-copy">
          This frontend now treats admin as the host role: a person can create an event, control the live queue, and
          later export event history without seeing other admins&apos; data.
        </p>
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="segmented-control">
            <button type="button" className={view === "login" ? "active" : ""} onClick={() => setView("login")}>Login</button>
            <button type="button" className={view === "register" ? "active" : ""} onClick={() => setView("register")}>Register</button>
          </div>

          <div className="form-grid-shell">
            <label className="field">
              <span>Name</span>
              <input name="name" value={form.name} onChange={updateForm} placeholder="Admin name" />
            </label>

            <label className="field">
              <span>Email or mobile</span>
              <input name="contact" value={form.contact} onChange={updateForm} placeholder="Email or phone" />
            </label>

            <label className="field field--full">
              <span>Password</span>
              <input type="password" name="password" value={form.password} onChange={updateForm} placeholder="Password" />
            </label>

            {view === "register" ? (
              <>
                <label className="field">
                  <span>Event name</span>
                  <input name="event_name" value={form.event_name} onChange={updateForm} placeholder="Admissions 2026" />
                </label>

                <label className="field">
                  <span>Event type</span>
                  <input name="event_type" value={form.event_type} onChange={updateForm} placeholder="Admissions" />
                </label>

                <label className="field">
                  <span>Start date and time</span>
                  <input type="datetime-local" name="start_date" value={form.start_date} onChange={updateForm} />
                </label>

                <label className="field">
                  <span>End date and time</span>
                  <input type="datetime-local" name="end_date" value={form.end_date} onChange={updateForm} />
                </label>
              </>
            ) : null}

            <div className="field-actions field--full">
              <button type="button" className="button button--primary">
                {view === "login" ? "Enter admin panel" : "Create admin and event"}
              </button>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Current live event</p>
              <h3>{selectedEvent?.event_name || "No event selected"}</h3>
            </div>
            <span className={`status-pill status-pill--${String(selectedEvent?.status || "idle").toLowerCase()}`}>
              {selectedEvent?.status || "IDLE"}
            </span>
          </div>

          <p className="panel-copy">
            When an admin starts hosting, the event should remain live only for the configured time window and then
            switch back to a no-event state.
          </p>

          <div className="info-list">
            <div><span>Isolation rule</span><strong>Each admin sees only their own events</strong></div>
            <div><span>Control model</span><strong>CRUD access for hosts</strong></div>
            <div><span>History output</span><strong>Per-event analytics PDF</strong></div>
          </div>
        </article>
      </section>

      <section id="admin-dashboard-export" className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="eyebrow">Live admin dashboard</p>
            <h3>Queue analytics and queue control</h3>
          </div>
          <button type="button" className="button button--soft" onClick={generateDashboardPdf}>Export dashboard PDF</button>
        </div>

        <div className="analytics-strip">
          <article className="metric-card">
            <span>Total students</span>
            <strong>{stats?.total_students ?? tokens.length}</strong>
            <p>Students currently attached to the selected event.</p>
          </article>
          <article className="metric-card">
            <span>Completed</span>
            <strong>{stats?.completed_tokens ?? tokens.filter((token) => token.status === "COMPLETED").length}</strong>
            <p>Tokens already processed by staff or admin.</p>
          </article>
          <article className="metric-card">
            <span>Average wait</span>
            <strong>{stats?.avg_wait_time ?? 0} min</strong>
            <p>Live analytics panel for the host.</p>
          </article>
        </div>

        <div className="table-shell">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Student</th>
                <th>Service</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.token_number}>
                  <td>{token.token_number}</td>
                  <td>{token.student_name}</td>
                  <td>{token.service_type || token.counter_name || "Counter pending"}</td>
                  <td>
                    <span className={`status-pill status-pill--${String(token.status || "idle").toLowerCase()}`}>
                      {token.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="button button--table" onClick={() => startToken(token.token_number)}>Start</button>
                      <button type="button" className="button button--table" onClick={() => completeToken(token.token_number)}>Complete</button>
                      <button type="button" className="button button--table" onClick={() => skipToken(token.token_number)}>Skip</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Logs</p>
              <h3>Student and admin activity feed</h3>
            </div>
          </div>

          <div className="log-list">
            {logs.length ? logs.map((log) => (
              <article key={log.id} className="log-item">
                <strong>{log.title}</strong>
                <p>{log.meta}</p>
              </article>
            )) : <p className="empty-copy">Logs will appear here when the selected event starts receiving activity.</p>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Event history</p>
              <h3>Hosted events and PDF export</h3>
            </div>
          </div>

          <div className="history-list">
            {events.map((event) => (
              <article key={event.event_id} className="history-item">
                <div>
                  <strong>{event.event_name}</strong>
                  <p>{event.start_date || "No start time"} to {event.end_date || "No end time"}</p>
                </div>
                <button type="button" className="button button--soft" onClick={() => generateEventHistoryPdf(event)}>Export PDF</button>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminScreen;
