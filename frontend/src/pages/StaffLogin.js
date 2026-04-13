import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function StaffLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await API.post("/staff/login", { email, password });

      localStorage.setItem("staff", JSON.stringify(res.data.staff));

      navigate("/staff");

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div>
      <h2>Staff Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Login</button>
    </div>
  );
}

export default StaffLogin;