import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Events() {

  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const selectEvent = (event) => {
    // Save selected event
    localStorage.setItem("event_id", event.event_id);

    navigate("/");
  };

  return (
    <div>
      <h2>Available Events</h2>

      <div className="event-grid">
        {events.map((event) => (
          <div key={event.event_id} className="event-card">

            <h3>{event.event_name}</h3>

            <p>Status: 
              <span className={`status ${event.status.toLowerCase()}`}>
                {event.status}
              </span>
            </p>

            <p>Start: {event.start_date}</p>
            <p>End: {event.end_date}</p>

            <button onClick={() => selectEvent(event)}>
              Join Event
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;