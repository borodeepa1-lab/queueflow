import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const categoryOptions = ["General", "EWS", "OBC", "SC", "ST", "PWD", "Minority", "Other"];

function RegisterScreen() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [eventCounters, setEventCounters] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    roll_number: "",
    email: "",
    department_id: "",
    department_name: "",
    counter_id: "",
    phone: "",
    category: "GENERAL"
  });
  const { showToast } = useToast();

  const eventIdFromQuery = searchParams.get("event_id");
  const eventId = eventIdFromQuery || localStorage.getItem("event_id");

  useEffect(() => {
    if (eventIdFromQuery) localStorage.setItem("event_id", eventIdFromQuery);
  }, [eventIdFromQuery]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, departmentsRes] = await Promise.all([
          API.get("/events"),
          API.get("/register/departments")
        ]);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchCounters = async () => {
      if (!eventId) {
        setEventCounters([]);
        return;
      }

      try {
        const res = await API.get(`/counters?event_id=${eventId}`);
        setEventCounters(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCounters();
  }, [eventId]);

  const selectedEvent = events.find((item) => String(item.event_id) === String(eventId));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!eventId) {
      setMessage("Select an event first so the token can be generated under the right queue.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post("/register", { ...form, event_id: eventId });
      setMessage(`Registration complete. Your token is ${res.data.token_number}.`);
      showToast({ title: `Token generated: ${res.data.token_number}`, type: "success" });
    } catch (error) {
      console.log(error);
      const nextMessage = error.response?.data?.error || "Registration failed. Please check the details and try again.";
      setMessage(nextMessage);
      showToast({ title: nextMessage, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Participant registration</p>
          <h2>Generate a token for the selected event</h2>
        </div>
        <p className="page-copy">
          The form is designed for quick participant registration, whether the event is for students, employees,
          customers, or visitors.
        </p>
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Event context</p>
              <h3>{selectedEvent?.event_name || "No event selected"}</h3>
            </div>
            <span className={`status-pill status-pill--${String(selectedEvent?.status || "idle").toLowerCase()}`}>
              {selectedEvent?.status || "IDLE"}
            </span>
          </div>

          <p className="panel-copy">
            Tokens will be created only for the currently selected event, which keeps each admin&apos;s data separated.
          </p>

          <div className="info-list">
            <div><span>Event ID</span><strong>{eventId || "Select one from Home or Events"}</strong></div>
            <div><span>Queue type</span><strong>Participant service flow</strong></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Registration guidance</p>
              <h3>What this screen should communicate</h3>
            </div>
          </div>
          <div className="instruction-list">
            <div className="instruction-item"><span /><p>Keep the form short and calm so participants can finish it quickly on mobile.</p></div>
            <div className="instruction-item"><span /><p>After submission, highlight the token clearly as the main success state.</p></div>
            <div className="instruction-item"><span /><p>Use event-aware registration so tokens do not cross between different admins or hosts.</p></div>
          </div>
        </article>
      </section>

      <section className="panel-card panel-card--form">
        <div className="panel-card__header">
          <div>
            <p className="eyebrow">Registration form</p>
            <h3>Participant details</h3>
          </div>
        </div>

        <form className="form-grid-shell" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full Name</span>
            <input name="student_name" value={form.student_name} onChange={handleChange} placeholder="Name of the person" required />
          </label>

          <label className="field">
            <span>ID No</span>
            <input name="roll_number" value={form.roll_number} onChange={handleChange} placeholder="ID no of the person" required />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email of the person" required />
          </label>

          <label className="field">
            <span>Department</span>
            <select name="department_id" value={form.department_id} onChange={handleChange} required>
              <option value="">Other</option>
              {departments.map((department) => (
                <option key={department.department_id} value={department.department_id}>
                  {department.department_name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone no of the person" required pattern="[0-9]{10}" />
          </label>

          <label className="field field--full">
            <span>Other Department</span>
            <input
              name="department_name"
              value={form.department_name}
              onChange={handleChange}
              placeholder="Department in which the person works"
              disabled={Boolean(form.department_id)}
            />
          </label>

          <label className="field field--full">
            <span>Select Counter</span>
            <select name="counter_id" value={form.counter_id} onChange={handleChange}>
              <option value="">Auto assign</option>
              {eventCounters.map((counter) => (
                <option key={counter.counter_id} value={counter.counter_id}>
                  {counter.counter_name}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--full">
            <span>Category</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {categoryOptions.map((option) => (
                <option key={option} value={option.toUpperCase()}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="field-actions field--full">
            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? "Generating token..." : "Generate token"}
            </button>
            {message ? <p className="form-message">{message}</p> : null}
          </div>
        </form>
      </section>
    </div>
  );
}

export default RegisterScreen;
