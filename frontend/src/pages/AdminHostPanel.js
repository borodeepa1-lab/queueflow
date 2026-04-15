import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const authDefaults = { name: "", contact: "", password: "" };
const eventDefaults = { event_name: "", event_type: "", start_date: "", end_date: "" };
const counterDefaults = { counter_name: "", service_type: "", service_id: 1 };
const staffDefaults = { staff_name: "", email: "", password: "", counter_id: "" };

function AdminHostPanel() {
  const [view, setView] = useState("login");
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
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [eventId, setEventId] = useState(() => localStorage.getItem("event_id") || "");
  const { showToast } = useToast();

  const selectedEvent = useMemo(
    () => events.find((item) => String(item.event_id) === String(eventId)),
    [events, eventId]
  );

  const updateForm = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("event_id");
    setAdmin(null);
    setEvents([]);
    setCounters([]);
    setStaffMembers([]);
    setTokens([]);
    setStats(null);
    setLogs([]);
    showToast({ title: "Admin logged out", type: "success" });
  };

  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem("admin");
      localStorage.removeItem("staff");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const fetchAdminEvents = async (adminId) => {
    const res = await API.get(`/auth/admins/${adminId}/events`);
    setEvents(Array.isArray(res.data) ? res.data : []);
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
      fetchAdminEvents(admin.admin_id).catch(console.log);
    }
  }, [admin]);

  useEffect(() => {
    if (eventId) {
      localStorage.setItem("event_id", eventId);
      fetchEventState(eventId).catch(console.log);
    }
  }, [eventId]);

  const handleAuth = async () => {
    try {
      const endpoint = view === "login" ? "/auth/login" : "/auth/register";
      const payload = view === "login" ? { contact: authForm.contact, password: authForm.password } : authForm;
      const res = await API.post(endpoint, payload);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      setAdmin(res.data.admin);
      setAuthForm(authDefaults);
      showToast({ title: res.data.message, type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Admin action failed", type: "error" });
    }
  };

  const createEvent = async () => {
    try {
      const res = await API.post("/events", { ...eventForm, admin_id: admin.admin_id });
      await fetchAdminEvents(admin.admin_id);
      setEventForm(eventDefaults);
      setEventId(String(res.data.event_id));
      showToast({ title: "Event created", type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Event creation failed", type: "error" });
    }
  };

  const deleteEvent = async (targetEventId) => {
    try {
      await API.delete(`/events/${targetEventId}?admin_id=${admin.admin_id}`);
      if (String(eventId) === String(targetEventId)) {
        setEventId("");
      }
      await fetchAdminEvents(admin.admin_id);
      await fetchEventState("");
      showToast({ title: "Event deleted", type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Event deletion failed", type: "error" });
    }
  };

  const createCounter = async () => {
    try {
      await API.post("/counters", { ...counterForm, event_id: eventId, admin_id: admin.admin_id });
      setCounterForm(counterDefaults);
      await fetchEventState(eventId);
      showToast({ title: "Counter created", type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Counter creation failed", type: "error" });
    }
  };

  const assignStaff = async () => {
    try {
      await API.post("/staff", {
        ...staffForm,
        counter_id: Number(staffForm.counter_id),
        event_id: eventId,
        admin_id: admin.admin_id
      });
      setStaffForm(staffDefaults);
      await fetchEventState(eventId);
      showToast({ title: "Staff added", type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Staff assignment failed", type: "error" });
    }
  };

  const removeStaff = async (staffId) => {
    try {
      await API.delete(`/staff/${staffId}?admin_id=${admin.admin_id}`);
      await fetchEventState(eventId);
      showToast({ title: "Staff deleted", type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Staff deletion failed", type: "error" });
    }
  };

  const limitedTokens = tokens.slice(0, 3);
  const historyEvents = events.slice(0, 3);
  const visibleStaff = staffMembers.slice(0, 5);
  const visibleLogs = logs.slice(0, 5);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Host panel</p>
          <h2>Main admin page</h2>
        </div>
        {admin ? <button type="button" className="button button--soft" onClick={logout}>Logout</button> : null}
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="segmented-control">
            <button type="button" className={view === "login" ? "active" : ""} onClick={() => setView("login")}>Login</button>
            <button type="button" className={view === "register" ? "active" : ""} onClick={() => setView("register")}>Register</button>
          </div>
          <div className="form-grid-shell">
            {view === "register" ? <label className="field"><span>Name</span><input name="name" value={authForm.name} onChange={updateForm(setAuthForm)} placeholder="Host name" /></label> : null}
            <label className="field"><span>Email or mobile</span><input name="contact" value={authForm.contact} onChange={updateForm(setAuthForm)} placeholder="Contact" /></label>
            <label className="field"><span>Password</span><input type="password" name="password" value={authForm.password} onChange={updateForm(setAuthForm)} placeholder="Password" /></label>
            <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={handleAuth}>{view === "login" ? "Login" : "Register"}</button></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div><p className="eyebrow">Current admin</p><h3>{admin?.username || "NONE"}</h3></div>
            <span className={`status-pill status-pill--${admin ? "live" : "idle"}`}>{admin ? admin.role : "NONE"}</span>
          </div>
          <div className="info-list">
            <div><span>Isolation rule</span><strong>{admin ? "Only this admin's events are shown here." : "NONE"}</strong></div>
            <div><span>Active event</span><strong>{selectedEvent?.event_name || "NONE"}</strong></div>
            <div>
              <span>Staff access</span>
              <strong>
                {admin ? <Link to="/staff-login" className="text-link">Open staff login</Link> : "Disabled"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      {admin ? (
        <>
          <section className="grid grid--two">
            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Create event</p><h3>Host a new event</h3></div></div>
              <div className="form-grid-shell">
                <label className="field field--full"><span>Event name</span><input name="event_name" value={eventForm.event_name} onChange={updateForm(setEventForm)} placeholder="Demo event for all users" /></label>
                <label className="field"><span>Event type</span><input name="event_type" value={eventForm.event_type} onChange={updateForm(setEventForm)} placeholder="Admissions, support desk, customer service" /></label>
                <label className="field"><span>Start date and time</span><input type="datetime-local" name="start_date" value={eventForm.start_date} onChange={updateForm(setEventForm)} /></label>
                <label className="field"><span>End date and time</span><input type="datetime-local" name="end_date" value={eventForm.end_date} onChange={updateForm(setEventForm)} /></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={createEvent}>Create event</button></div>
              </div>
            </article>

            <article className="panel-card panel-card--scroll">
              <div className="panel-card__header"><div><p className="eyebrow">Managed events</p><h3>{selectedEvent?.event_name || "Choose one"}</h3></div></div>
              <div className="scroll-list">
                {events.map((event) => (
                  <div key={event.event_id} className="history-item">
                    <div>
                      <strong>{event.event_name}</strong>
                      <p>{event.start_date || "No start"} to {event.end_date || "No end"}</p>
                    </div>
                    <div className="table-actions">
                      <span className={`status-pill status-pill--${String(String(eventId) === String(event.event_id) ? "live" : (event.status || "idle")).toLowerCase()}`}>{String(eventId) === String(event.event_id) ? "Selected" : event.status}</span>
                      <button type="button" className="button button--table" onClick={() => setEventId(String(event.event_id))}>Use</button>
                      <button type="button" className="button button--table" onClick={() => deleteEvent(event.event_id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid grid--two">
            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Assign counter</p><h3>Counters for the selected event</h3></div></div>
              <div className="form-grid-shell">
                <label className="field"><span>Counter name</span><input name="counter_name" value={counterForm.counter_name} onChange={updateForm(setCounterForm)} placeholder="Demo Counter" /></label>
                <label className="field"><span>Service type</span><input name="service_type" value={counterForm.service_type} onChange={updateForm(setCounterForm)} placeholder="Type written by admin" /></label>
                <label className="field field--full"><span>Service ID</span><select name="service_id" value={counterForm.service_id} onChange={updateForm(setCounterForm)}><option value={1}>Document Verification</option><option value={2}>PWD Assistance</option><option value={3}>Loan Assistance</option></select></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={createCounter}>Add counter</button></div>
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-card__header"><div><p className="eyebrow">Add staff</p><h3>Create staff login for a counter</h3></div></div>
              <div className="form-grid-shell">
                <label className="field"><span>Staff name</span><input name="staff_name" value={staffForm.staff_name} onChange={updateForm(setStaffForm)} placeholder="Staff member name" /></label>
                <label className="field"><span>Staff email</span><input name="email" value={staffForm.email} onChange={updateForm(setStaffForm)} placeholder="staff@example.com" /></label>
                <label className="field"><span>Password</span><input type="password" name="password" value={staffForm.password} onChange={updateForm(setStaffForm)} placeholder="Password" /></label>
                <label className="field"><span>Counter no</span><select name="counter_id" value={staffForm.counter_id} onChange={updateForm(setStaffForm)}><option value="">Select counter</option>{counters.map((counter) => <option key={counter.counter_id} value={counter.counter_id}>{`Counter ${counter.counter_no || counter.counter_id} · ${counter.counter_name}`}</option>)}</select></label>
                <div className="field-actions field--full"><button type="button" className="button button--primary" onClick={assignStaff}>Add staff</button></div>
              </div>
            </article>
          </section>

          <section className="grid grid--two">
            <article className="panel-card panel-card--scroll">
              <div className="panel-card__header"><div><p className="eyebrow">Assigned staff</p><h3>Visible 5 entries</h3></div></div>
              <div className="scroll-list">
                {visibleStaff.map((member) => (
                  <div key={member.staff_id} className="history-item">
                    <div>
                      <strong>{member.staff_name}</strong>
                      <p>{member.email} · {member.counter_name || `Counter ${member.counter_id}`}</p>
                    </div>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="button button--table"
                        onClick={() => window.open(`${window.location.origin}/staff?staff_id=${member.staff_id}`, "_blank", "noopener,noreferrer")}
                      >
                        Manage
                      </button>
                      <button type="button" className="button button--table" onClick={() => removeStaff(member.staff_id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card panel-card--scroll">
              <div className="panel-card__header"><div><p className="eyebrow">Logs</p><h3>Visible 5 entries</h3></div></div>
              <div className="scroll-list">
                {visibleLogs.map((log) => (
                  <div key={log.log_id} className="log-item">
                    <strong>{log.action}</strong>
                    <p>{log.token_number || "No token"} at {new Date(log.log_time).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel-card panel-card--scroll">
            <div className="panel-card__header"><div><p className="eyebrow">Live admin dashboard</p><h3>Visible 3 entries</h3></div></div>
            <div className="analytics-strip">
              <article className="metric-card"><span>Total users</span><strong>{stats?.total_students ?? tokens.length}</strong><p>All registrations in this event.</p></article>
              <article className="metric-card"><span>Completed tokens</span><strong>{stats?.completed_tokens ?? 0}</strong><p>Completed queue entries.</p></article>
              <article className="metric-card"><span>Average wait</span><strong>{stats?.avg_wait_time ?? 0} min</strong><p>Average wait for this event.</p></article>
            </div>
            <div className="table-shell">
              <table className="dashboard-table">
                <thead><tr><th>Token</th><th>Participant</th><th>Counter</th><th>Status</th></tr></thead>
                <tbody>
                  {limitedTokens.map((token) => (
                    <tr key={token.token_number}>
                      <td>{token.token_number}</td>
                      <td>{token.student_name}</td>
                      <td>{token.counter_name}</td>
                      <td><span className={`status-pill status-pill--${String(token.status || "idle").toLowerCase()}`}>{token.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel-card panel-card--scroll">
            <div className="panel-card__header"><div><p className="eyebrow">Event history</p><h3>Visible 3 rows</h3></div></div>
            <div className="scroll-list">
              {historyEvents.map((event) => (
                <div key={event.event_id} className="history-item">
                  <div>
                    <strong>{event.event_name}</strong>
                    <p>{event.start_date || "No start"} to {event.end_date || "No end"}</p>
                  </div>
                  <button type="button" className="button button--table" onClick={() => setDetailsEvent(event)}>Show details</button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {detailsEvent ? (
        <section className="panel-card">
          <div className="panel-card__header"><div><p className="eyebrow">Event details</p><h3>{detailsEvent.event_name}</h3></div><button type="button" className="button button--soft" onClick={() => setDetailsEvent(null)}>Close</button></div>
          <div className="info-list">
            <div><span>Name</span><strong>{detailsEvent.event_name}</strong></div>
            <div><span>Event ID</span><strong>{detailsEvent.event_id}</strong></div>
            <div><span>Status</span><strong>{detailsEvent.status}</strong></div>
            <div><span>Start</span><strong>{detailsEvent.start_date || "None"}</strong></div>
            <div><span>End</span><strong>{detailsEvent.end_date || "None"}</strong></div>
            <div><span>No of users registered</span><strong>{tokens.length}</strong></div>
            <div><span>Avg Wait time</span><strong>{stats?.avg_wait_time ?? 0} min</strong></div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default AdminHostPanel;
