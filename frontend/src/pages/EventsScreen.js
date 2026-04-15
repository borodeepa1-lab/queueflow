import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

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

function EventsScreen() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const selectedEventId = localStorage.getItem("event_id");

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

  const chooseEvent = (event) => {
    localStorage.setItem("event_id", event.event_id);
    navigate("/");
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Event selection</p>
          <h2>Choose which event should be live on the frontend</h2>
        </div>
        <p className="page-copy">
          This view is useful when multiple events exist on the platform and the student-facing home page should follow
          one active queue.
        </p>
      </section>

      <section className="event-list-grid">
        {events.map((event) => (
          <article key={event.event_id} className="event-spotlight">
            <div className="panel-card__header">
              <div>
                <p className="eyebrow">Hosted event</p>
                <h3>{event.event_name}</h3>
              </div>
              <span className={`status-pill status-pill--${String(event.status || "idle").toLowerCase()}`}>
                {String(selectedEventId) === String(event.event_id) ? "Selected" : event.status}
              </span>
            </div>

            <p className="panel-copy">Start: {formatDate(event.start_date)}</p>
            <p className="panel-copy">End: {formatDate(event.end_date)}</p>

            <button type="button" className="button button--primary" onClick={() => chooseEvent(event)}>
              Set as current event
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

export default EventsScreen;
