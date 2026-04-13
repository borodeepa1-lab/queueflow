import React, { useEffect, useState } from "react";
import API from "../services/api";

function StaffPanel() {

  const [staff, setStaff] = useState(null);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("staff"));
    if (stored) {
      setStaff(stored);
      fetchTokens(stored.counter_id);
    }
  }, []);

  const fetchTokens = async (counter_id) => {
    try {
      const res = await API.get(`/queue/all-tokens?event_id=${staff.event_id}`);
      
      // filter tokens for this counter
      const filtered = res.data.filter(t => t.counter_id === counter_id);

      setTokens(filtered);
    } catch (err) {
      console.log(err);
    }
  };

  const startToken = async (token) => {
    await API.post("/queue/start", { token_number: token });
    fetchTokens(staff.counter_id);
  };

  const completeToken = async (token) => {
    await API.post("/queue/complete", { token_number: token });
    fetchTokens(staff.counter_id);
  };

  const skipToken = async (token) => {
    await API.post("/queue/skip", { token_number: token });
    fetchTokens(staff.counter_id);
  };

  if (!staff) {
    return <h2>Please login as staff</h2>;
  }

  return (
    <div>

      <h2>Staff Panel</h2>
      <h3>Counter: {staff.counter_id}</h3>

      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tokens.map((t, i) => (
            <tr key={i}>
              <td>{t.token_number}</td>
              <td>{t.status}</td>

              <td>
                <button onClick={() => startToken(t.token_number)}>
                  Start
                </button>

                <button onClick={() => completeToken(t.token_number)}>
                  Complete
                </button>

                <button onClick={() => skipToken(t.token_number)}>
                  Skip
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default StaffPanel;