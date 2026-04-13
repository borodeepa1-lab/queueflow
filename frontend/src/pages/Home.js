import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Home.css";

function Home() {

  const [event, setEvent] = useState(null);
  const [counters, setCounters] = useState([]);

  const event_id = localStorage.getItem("event_id");

  useEffect(() => {
    if (event_id) {
      fetchEvent();
      fetchCounters();
    }
  }, [event_id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events`);
      const selected = res.data.find(e => e.event_id === Number(event_id));
      setEvent(selected);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCounters = async () => {
    try {
      const res = await API.get(`/queue/now-serving?event_id=${event_id}`);
      setCounters(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!event_id) {
    return <h2 className="empty">Please select an event</h2>;
  }

  return (
    <div className="home-container">

      {/* HEADER */}
      <div className="home-header">
        <h1>QueueFlow Dashboard</h1>
      </div>

      {/* TOP CARDS */}
      <div className="top-cards">

        {/* EVENT INFO */}
        <div className="card">
          <h3>Current Event</h3>
          <h2>{event?.event_name}</h2>

          <p className={`status ${event?.status}`}>
            {event?.status}
          </p>

          <p>Counters: {counters.length}</p>
        </div>

        {/* QR */}
        <div className="card center">
          <h3>Scan to Register</h3>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:3000/register?event_id=${event_id}`}
            alt="QR"
          />
        </div>

      </div>

      {/* COUNTERS */}
      <div className="card">
        <h2>Live Counters</h2>

        <div className="counter-grid">
          {counters.map((c, index) => (
            <div key={index} className="counter-card">
              <h3>{c.counter_name}</h3>

              <div className="token">
                {c.now_serving || "-"}
              </div>

              <p className="next">
                Next: {c.next_tokens?.join(", ") || "None"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="card">
        <h3>Instructions</h3>
        <ul>
          <li>Scan QR Code</li>
          <li>Register details</li>
          <li>Get your token</li>
          <li>Wait for your turn</li>
        </ul>
      </div>

    </div>
  );
}

export default Home;