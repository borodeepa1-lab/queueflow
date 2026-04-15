import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "../services/api";

const authDefaults = { name: "", contact: "", password: "" };
const eventDefaults = { event_name: "", event_type: "Admissions", start_date: "", end_date: "" };
const counterDefaults = { counter_name: "", service_type: "Verification", service_id: 1 };
const staffDefaults = { staff_name: "", email: "", password: "", counter_id: "" };

function AdminWorkspace() {
  const [view, setView] = useState("login");
  const [message, setMessage] = useState("");
  const [authForm, setAuthForm] = useState(authDefaults);
  const [eventForm, setEventForm] = useState(eventDefaults);
  const [counterForm, setCounterForm] = useState(counterDefaults);
  const [staffForm, setStaffForm] = useState(staffDefaults);
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem("admin") || "null"));
  const [events, setEvents] = useState([]);
  const [counters, setCounters] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [eventId, setEventId] = useState(() => localStorage.getItem("event_id") || "");

  const selectedEvent = useMemo(
    () => events.find((item) => String(item.event_id) === String(eventId)),
    [events, eventId]
  );

  const updateForm = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const fetchAdminEvents = async (adminId) => {
    const res = await API.get(`/auth/admins/${adminId}/events`);
    const nextEvents = Array.isArray(res.data) ? res.data : [];
    setEvents(nextEvents);
    if (nextEvents.length && !eventId) {
      localStorage.setItem("event_id", nextEvents[0].event_id);
      setEventId(String(nextEvents[0].event_id));
    }
  };

  const fetchEventState = async (nextEventId) => {
    if (!nextEventId) {
      setCounters([]);
      setStaffMembers([]);
      setTokens([]);
      setStats(null);
      setLogs([]);
      return;
    }

    const [counterRes, staffRes, tokenRes, statsRes, logRes] = await Promise.all([
      API.get(`/counters?event_id=${nextEventId}`),
      API.get(`/staff?event_id=${nextEventId}`),
      API.get(`/queue/all-tokens?event_id=${nextEventId}`),
      API.get(`/analytics?event_id=${nextEventId}`),
      API.get(`/logs?event_id=${nextEventId}`)
    ]);

    setCounters(Array.isArray(counterRes.data) ? counterRes.data : []);
    setStaffMembers(Array.isArray(staffRes.data) ? staffRes.data : []);
    setTokens(Array.isArray(tokenRes.data) ? tokenRes.data : []);
    setStats(statsRes.data || null);
    setLogs(Array.isArray(logRes.data) ? logRes.data : []);
  };

  useEffect(() => {
    if (admin?.admin_id) {
      fetchAdminEvents(admin.admin_id).catch((error) => console.log(error));
    }
  }, [admin]);

  useEffect(() => {
    if (eventId) {
      localStorage.setItem("event_id", eventId);
      fetchEventState(eventId).catch((error) => console.log(error));
    }
  }, [eventId]);

  const handleAuth = async () => {
    try {
      const endpoint = view === "login" ? "/auth/login" : "/auth/register";
      const res = await API.post(endpoint, authForm);
      setAdmin(res.data.admin);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      setMessage(res.data.message);
      setAuthForm(authDefaults);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.error || "Admin action failed");
    }
  };

  const createEvent = async () => {
    try {
      const res = await API.post("/events", { ...eventForm, admin_id: admin.admin_id });
      setEventForm(eventDefaults);
      setMessage("Event created successfully.");
      await fetchAdminEvents(admin.admin_id);
      localStorage.setItem("event_id", res.data.event_id);
      setEventId(String(res.data.event_id));
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.error || "Failed to create event");
    }
  };

  const createCounter = async () => {
    try {
      await API.post("/counters", { ...counterForm, event_id: eventId, admin_id: admin.admin_id });
      setCounterForm(counterDefaults);
      setMessage("Counter created successfully.");
      await fetchEventState(eventId);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.error || "Failed to create counter");
    }
  };

  const assignStaff = async () => {
    try {
      await API.post("/staff", {
        ...staffForm,
        event_id: eventId,
        counter_id: Number(staffForm.counter_id),
        admin_id: admin.admin_id
      });
      setStaffForm(staffDefaults);
      setMessage("Staff assigned successfully.");
      await fetchEventState(eventId);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.error || "Failed to assign staff");
    }
  };

  const updateQueue = async (endpoint, tokenNumber) => {
    await API.post(endpoint, { token_number: tokenNumber, admin_id: admin?.admin_id });
    await fetchEventState(eventId);
  };

  const exportDashboardPdf = async () => {
    const dashboard = document.getElementById("admin-dashboard-export");
    if (!dashboard) return;
    const canvas = await html2canvas(dashboard, { scale: 2, backgroundColor: "#f8fafc" });
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 190;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, width, height);
    pdf.save("queueflow-admin-dashboard.pdf");
  };

  const exportEventPdf = (event) => {
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.text(event.event_name || "Event", 15, 20);
    pdf.text(`Event ID: ${event.event_id}`, 15, 32);
    pdf.text(`Status: ${event.status || "UNKNOWN"}`, 15, 44);
    pdf.text(`Start: ${event.start_date || "Not available"}`, 15, 56);
    pdf.text(`End: ${event.end_date || "Not available"}`, 15, 68);
    pdf.save(`queueflow-event-${event.event_id}.pdf`);
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin host workspace</p>
          <h2>Register, host, assign counters and staff, then manage the queue</h2>
        </div>
        <p className="page-copy">This screen is now wired to the backend flow instead of being only a visual mock.</p>
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="segmented-control">
            <button type="button" className={view === "login" ? "active" : ""} onClick={() => setView("login")}>Login</button>
            <button type="button" className={view === "register" ? "active" : ""} onClick={() => setView("register")}>Register</button>
          </div>

          <div className="form-grid-shell">
            {view === "register" ? (
              <label className="field">
                <span>Name</span>
                <input name="name" value={authForm.name} onChange={updateForm(setAuthForm)} placeholder="Admin name" />
              </label>
            ) : null}
            <label className="field">
              <span>Email or mobile</span>
              <input name="contact" value={authForm.contact} onChange={updateForm(setAuthForm)} placeholder="Email or phone" />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" name="password" value={authForm.password} onChange={updateForm(setAuthForm)} placeholder="Password" />
            </label>
            <div className="field-actions field--full">
              <button type="button" className="button button--primary" onClick={handleAuth}>
                {view === "login" ? "Login as admin" : "Register admin"}
              </button>
              {message ? <p className="form-message">{message}</p> : null}
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Current admin</p>
              <h3>{admin?.username || "No admin logged in"}</h3>
            </div>
            <span className={`status-pill status-pill--${admin ? "live" : "idle"}`}>{admin ? admin.role : "IDLE"}</span>
          </div>
          <div className="info-list">
            <div><span>Isolation rule</span><strong>Only this admin&apos;s events are shown here.</strong></div>
            <div><span>Active event</span><strong>{selectedEvent?.event_name || "Create or select one below."}</strong></div>
            <div><span>Staff access</span><strong><Link to="/staff-login" className="text-link">Open staff login</Link></strong></div>
          </div>
        </article>
      </section>

      {admin ? (
        <>
          <section className="grid grid--two">
            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Create event</p><h3>Host a new queue</h3></div></div>
              <div className="form-grid-shell">
                <label className="field field--full"><span>Event name</span><input name="event_name" value={eventForm.event_name} onChange={updateForm(setEventForm)} placeholder="Admissions 2026" /></label>
                <label className="field"><span>Event type</span><input name="event_type" value={eventForm.event_type} onChange={updateForm(setEventForm)} placeholder="Admissions" /></label>
                <label className="field"><span>Start date and time</span><input type="datetime-local" name="start_date" value={eventForm.start_date} onChange={updateForm(setEventForm)} /></label>
                <label className="field"><span>End date and time</span><input type="datetime-local" name="end_date" value={eventForm.end_date} onChange={updateForm(setEventForm)} /></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={createEvent}>Create event</button></div>
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Select managed event</p><h3>{selectedEvent?.event_name || "Choose one"}</h3></div></div>
              <div className="event-list-grid">
                {events.map((event) => (
                  <button key={event.event_id} type="button" className="event-choice" onClick={() => setEventId(String(event.event_id))}>
                    <div><strong>{event.event_name}</strong><p>{event.start_date || "No start"} to {event.end_date || "No end"}</p></div>
                    <span className={`status-pill status-pill--${String(event.status || "idle").toLowerCase()}`}>{event.status}</span>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section className="grid grid--two">
            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Assign counters</p><h3>Create counters for this event</h3></div></div>
              <div className="form-grid-shell">
                <label className="field"><span>Counter name</span><input name="counter_name" value={counterForm.counter_name} onChange={updateForm(setCounterForm)} placeholder="Verification Counter 1" /></label>
                <label className="field"><span>Service type</span><input name="service_type" value={counterForm.service_type} onChange={updateForm(setCounterForm)} placeholder="Verification" /></label>
                <label className="field field--full"><span>Service ID</span><select name="service_id" value={counterForm.service_id} onChange={updateForm(setCounterForm)}><option value={1}>Document Verification</option><option value={2}>PWD Assistance</option><option value={3}>Loan Assistance</option></select></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={createCounter}>Create counter</button></div>
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Assign staff</p><h3>Create staff login for a counter</h3></div></div>
              <div className="form-grid-shell">
                <label className="field"><span>Staff name</span><input name="staff_name" value={staffForm.staff_name} onChange={updateForm(setStaffForm)} placeholder="Counter operator" /></label>
                <label className="field"><span>Email</span><input name="email" value={staffForm.email} onChange={updateForm(setStaffForm)} placeholder="staff@example.com" /></label>
                <label className="field"><span>Password</span><input type="password" name="password" value={staffForm.password} onChange={updateForm(setStaffForm)} placeholder="Password" /></label>
                <label className="field"><span>Counter</span><select name="counter_id" value={staffForm.counter_id} onChange={updateForm(setStaffForm)}><option value="">Select counter</option>{counters.map((counter) => <option key={counter.counter_id} value={counter.counter_id}>{counter.counter_name}</option>)}</select></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={assignStaff}>Assign staff</button></div>
              </div>
            </article>
          </section>

          <section id="admin-dashboard-export" className="panel-card">
            <div className="panel-card__header"><div><p className="eyebrow">Live admin dashboard</p><h3>Queue analytics and queue control</h3></div><button type="button" className="button button--soft" onClick={exportDashboardPdf}>Export dashboard PDF</button></div>
            <div className="analytics-strip">
              <article className="metric-card"><span>Total students</span><strong>{stats?.total_students ?? tokens.length}</strong><p>Students attached to the selected event.</p></article>
              <article className="metric-card"><span>Completed</span><strong>{stats?.completed_tokens ?? tokens.filter((token) => token.status === "COMPLETED").length}</strong><p>Tokens already processed.</p></article>
              <article className="metric-card"><span>Average wait</span><strong>{stats?.avg_wait_time ?? 0} min</strong><p>Live analytics panel for the host.</p></article>
            </div>
            <div className="table-shell">
              <table className="dashboard-table">
                <thead><tr><th>Token</th><th>Student</th><th>Counter</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.token_number}>
                      <td>{token.token_number}</td>
                      <td>{token.student_name}</td>
                      <td>{token.counter_name || token.service_type || "Counter pending"}</td>
                      <td><span className={`status-pill status-pill--${String(token.status || "idle").toLowerCase()}`}>{token.status}</span></td>
                      <td><div className="table-actions"><button type="button" className="button button--table" onClick={() => updateQueue("/queue/start", token.token_number)}>Start</button><button type="button" className="button button--table" onClick={() => updateQueue("/queue/complete", token.token_number)}>Complete</button><button type="button" className="button button--table" onClick={() => updateQueue("/queue/skip", token.token_number)}>Skip</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid--two">
            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Assigned staff</p><h3>Staff access for this event</h3></div></div>
              <div className="history-list">{staffMembers.map((member) => <article key={member.staff_id} className="history-item"><div><strong>{member.staff_name}</strong><p>{member.email} on counter {member.counter_id}</p></div><span className="status-pill status-pill--live">{member.role || "STAFF"}</span></article>)}</div>
            </article>

            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Logs</p><h3>Student and admin activity feed</h3></div></div>
              <div className="log-list">
                {logs.length ? logs.map((log) => <article key={log.log_id} className="log-item"><strong>{log.action}</strong><p>{log.admin_name || "System"} · {log.token_number || "No token"} · {new Date(log.log_time).toLocaleString("en-IN")}</p></article>) : <p className="empty-copy">Logs will appear here when the selected event starts receiving activity.</p>}
              </div>
            </article>
          </section>

          <section className="panel-card">
            <div className="panel-card__header"><div><p className="eyebrow">Event history</p><h3>Hosted events and PDF export</h3></div></div>
            <div className="history-list">{events.map((event) => <article key={event.event_id} className="history-item"><div><strong>{event.event_name}</strong><p>{event.start_date || "No start time"} to {event.end_date || "No end time"}</p></div><button type="button" className="button button--soft" onClick={() => exportEventPdf(event)}>Export PDF</button></article>)}</div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default AdminWorkspace;
