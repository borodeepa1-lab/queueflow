import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import API from "../services/api";

const instructions = [
  "Select the live event and open the registration form.",
  "Submit student details to generate a token instantly.",
  "Track counter color, queue position, and estimated wait time.",
  "Use the admin panel to host, monitor, and manage the event."
];

const formatDate = (value) => {
  if (!value) return "Not announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function HomeScreen() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasChosenEvent, setHasChosenEvent] = useState(false);

  const selectedEventId = useMemo(() => localStorage.getItem("event_id"), []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/events");
        const list = Array.isArray(res.data) ? res.data : [];
        setEvents(list);
        if (selectedEventId) {
          const persisted = list.find((item) => String(item.event_id) === String(selectedEventId));
          if (persisted) {
            setSelectedEvent(persisted);
            setHasChosenEvent(true);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedEventId]);

  useEffect(() => {
    const fetchCounters = async () => {
      if (!hasChosenEvent || !selectedEvent?.event_id) {
        setCounters([]);
        return;
      }

      try {
        const res = await API.get(`/queue/now-serving?event_id=${selectedEvent.event_id}`);
        setCounters(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log(error);
        setCounters([]);
      }
    };

    fetchCounters();
  }, [selectedEvent, hasChosenEvent]);

  const registrationUrl = selectedEvent
    ? `${window.location.origin}/register?event_id=${selectedEvent.event_id}`
    : `${window.location.origin}/register`;
  const liveCounters = counters;

  const selectEvent = (event) => {
    localStorage.setItem("event_id", event.event_id);
    setSelectedEvent(event);
    setHasChosenEvent(true);
    navigate("/");
  };

  return (
    <div className="page">
      <section className="hero-card hero-card--home">
        <div>
          <p className="eyebrow">QueueFlow platform overview</p>
          <h2>{hasChosenEvent && selectedEvent?.event_name ? selectedEvent.event_name : "Multi-Event Queue Platform"}</h2>
          <p className="hero-copy">
            Show a live queue to participants, let admins host events from one panel, and keep every event separated by
            owner and timeline.
          </p>

          <div className="hero-actions">
            <Link to="/events" className="button button--primary">Browse event</Link>
            <Link to="/register" className="button button--ghost">Open registration</Link>
          </div>
        </div>

        <div className="hero-stat-grid">
          <article className="metric-card">
            <span>Current status</span>
            <strong>{hasChosenEvent ? selectedEvent?.status || "No event selected" : "No event selected"}</strong>
            <p>{hasChosenEvent ? "Queue board is ready for participants and staff." : "Choose an event to load live details."}</p>
          </article>
          <article className="metric-card">
            <span>Live counters</span>
            <strong>{hasChosenEvent ? liveCounters.length || "None" : "None"}</strong>
            <p>Admins can create as many counters as needed for any event format.</p>
          </article>
          <article className="metric-card">
            <span>Duration</span>
            <strong>{hasChosenEvent && selectedEvent ? formatDate(selectedEvent.end_date) : "None"}</strong>
            <p>Event cards show their real time window only after you select an event.</p>
          </article>
        </div>
      </section>

      <section className="grid grid--two">
        <article className="panel-card panel-card--event">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Live event banner</p>
              <h3>{hasChosenEvent ? selectedEvent?.event_name || "No event selected" : "No event selected"}</h3>
            </div>
            <span className={`status-pill status-pill--${(hasChosenEvent ? selectedEvent?.status : "idle" || "idle").toLowerCase()}`}>
              {hasChosenEvent ? selectedEvent?.status || "IDLE" : "IDLE"}
            </span>
          </div>

          <div className="event-banner">
            <div><p>Starts</p><strong>{hasChosenEvent ? formatDate(selectedEvent?.start_date) : "None"}</strong></div>
            <div><p>Ends</p><strong>{hasChosenEvent ? formatDate(selectedEvent?.end_date) : "None"}</strong></div>
            <div><p>Hosting mode</p><strong>{hasChosenEvent ? "Public queue" : "None"}</strong></div>
          </div>

          <p className="panel-copy">
            Home now acts like a real event landing page: banner, live queue preview, QR registration, instructions,
            and admin entry in one place.
          </p>
        </article>

        <article className="panel-card panel-card--qr">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">QR registration</p>
              <h3>Scan and join the queue</h3>
            </div>
          </div>

          <div className="qr-card">
            <QRCodeSVG value={registrationUrl} size={160} bgColor="#fffdf5" fgColor="#0f172a" />
          </div>

          <p className="panel-copy">Participants can jump directly into the selected event registration form from the QR code.</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="eyebrow">Live queue display</p>
            <h3>Live counters, visible at a glance</h3>
          </div>
          <Link to="/students" className="text-link">View full queue board</Link>
        </div>

        <div className="counter-grid">
          {(hasChosenEvent && liveCounters.length ? liveCounters : [null]).map((counter, index) => {
            const label = counter?.counter_name || "No counter allotted";
            const nextTokens = counter?.next_tokens?.length ? counter.next_tokens.join(", ") : "Waiting list not available";

            return (
              <article key={`${label}-${index}`} className={`counter-showcase counter-showcase--tone-${(index % 3) + 1}`}>
                <p>{label}</p>
                <strong>{hasChosenEvent ? counter?.now_serving || "--" : "--"}</strong>
                <span>Now serving</span>
                <small>{counter ? nextTokens : "Counters will appear here after an event is selected."}</small>
                {counter?.staff_names?.length ? <small>Assigned staff: {counter.staff_names.join(", ")}</small> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid grid--two">
        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Instructions</p>
              <h3>How participants and hosts use the platform</h3>
            </div>
          </div>
          <div className="instruction-list">
            {instructions.map((item) => (
              <div key={item} className="instruction-item">
                <span />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow">Admin access</p>
              <h3>Host events with a dedicated dashboard</h3>
            </div>
          </div>
          <p className="panel-copy">
            Admins can register their event, go live for a specific date and time window, manage queues with CRUD-style
            controls, inspect analytics, and export history.
          </p>
          <div className="stacked-actions">
            <Link to="/admin" className="button button--primary">Go to admin</Link>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="eyebrow">Available events</p>
            <h3>Select which event should drive the current queue</h3>
          </div>
        </div>

        {loading ? (
          <p className="empty-copy">Loading events...</p>
        ) : events.length ? (
          <div className="event-list-grid">
            {events.map((event) => (
              <button key={event.event_id} type="button" className="event-choice" onClick={() => selectEvent(event)}>
                <div>
                  <strong>{event.event_name}</strong>
                  <p>{formatDate(event.start_date)}</p>
                </div>
                <span className={`status-pill status-pill--${String(hasChosenEvent && String(selectedEvent?.event_id) === String(event.event_id) ? "live" : (event.status || "idle")).toLowerCase()}`}>
                  {hasChosenEvent && String(selectedEvent?.event_id) === String(event.event_id) ? "Selected" : event.status}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-copy">No events are available yet. Once an admin creates one, the live home banner will appear here.</p>
        )}
      </section>
    </div>
  );
}

export default HomeScreen;
