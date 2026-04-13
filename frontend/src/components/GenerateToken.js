import React, { useState } from "react";
import API from "../services/api";

function GenerateToken() {

  const [data, setData] = useState({
    registration_id: "",
    service_id: 1,
    event_id: 1
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const generateToken = async () => {
    try {
      const res = await API.post("/token/generate", data);
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
    <div>
      <h2>Generate Token</h2>

      <input
        name="registration_id"
        placeholder="Enter Registration ID"
        onChange={handleChange}
      />

      <select name="service_id" onChange={handleChange}>
        <option value="1">Document Verification</option>
        <option value="2">PWD Assistance</option>
        <option value="3">Loan Desk</option>
      </select>

      <button onClick={generateToken}>Generate Token</button>

      {result && (
        <div className="queue-box">
          <h3>Token: {result.token}</h3>
          <p>Position: {result.position}</p>
          <p>Estimated Wait: {result.estimated_wait_minutes} min</p>
        </div>
      )}
    </div>
  );
}

export default GenerateToken;