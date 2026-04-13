import React, { useState } from "react";
import API from "../services/api";

function AdminPanel() {

  const [serviceId, setServiceId] = useState(1);
  const [currentToken, setCurrentToken] = useState(null);
  const [message, setMessage] = useState("");

  // Get next token
  const getNext = async () => {
    try {
      const res = await API.get(`/queue/next?service_id=${serviceId}`);
      setCurrentToken(res.data);
      setMessage("");
    } catch (err) {
      setMessage("No tokens available");
    }
  };

  // Start token
  const startToken = async () => {
    try {
      await API.post("/queue/start", {
        token_id: currentToken.token_id,
        counter_id: 1
      });

      setMessage("Token started");
    } catch (err) {
      setMessage("Error starting token");
    }
  };

  // Complete token
  const completeToken = async () => {
    try {
      await API.post("/queue/complete", {
        token_id: currentToken.token_id
      });

      setMessage("Token completed");
      setCurrentToken(null);
    } catch (err) {
      setMessage("Error completing token");
    }
  };

  // Skip token
  const skipToken = async () => {
    try {
      await API.post("/queue/skip", {
        token_id: currentToken.token_id
      });

      setMessage("Token skipped");
      setCurrentToken(null);
    } catch (err) {
      setMessage("Error skipping token");
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      {/* Service Selection */}
      <select onChange={(e) => setServiceId(e.target.value)}>
        <option value="1">Document Verification</option>
        <option value="2">PWD Assistance</option>
        <option value="3">Loan Desk</option>
      </select>

      <button onClick={getNext}>Get Next Token</button>

      {/* Current Token Display */}
      {currentToken && (
        <div className="queue-card">
          <h3>Current Token</h3>
          <div className="big">{currentToken.token_number}</div>

          <button onClick={startToken}>Start</button>
          <button onClick={completeToken}>Complete</button>
          <button onClick={skipToken}>Skip</button>
        </div>
      )}

      {message && <p className="success">{message}</p>}
    </div>
  );
}

export default AdminPanel;