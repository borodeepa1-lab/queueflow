import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function StaffLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { showToast } = useToast();

  const login = async () => {
    try {
      const res = await API.post("/staff/login", { email, password });

      localStorage.setItem("staff", JSON.stringify(res.data.staff));
      setMessage("Staff login successful.");
      showToast({ title: "Staff login successful", type: "success" });

      navigate("/staff");

    } catch (err) {
      const nextMessage = err.response?.data?.error || "Login failed";
      setMessage(nextMessage);
      showToast({ title: nextMessage, type: "error" });
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Staff login</p>
          <h2>Access your assigned counter</h2>
        </div>
        <p className="page-copy">Staff members can sign in here and manage only the queue attached to their counter.</p>
      </section>

      <section className="panel-card panel-card--form">
        <div className="form-grid-shell">
          <label className="field">
            <span>Email</span>
            <input placeholder="Staff email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="field">
            <span>Password</span>
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <div className="field-actions field--full">
            <button type="button" className="button button--primary" onClick={login}>Login</button>
            {message ? <p className="form-message">{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default StaffLogin;
