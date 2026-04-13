import React, { useState } from "react";
import API from "../services/api";
import "./Register.css";

function Register() {

  const [form, setForm] = useState({
    student_name: "",
    roll_number: "",
    department_id: "",
    phone: "",
    category: "GENERAL"
  });

  const [message, setMessage] = useState("");

  const event_id = localStorage.getItem("event_id");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const res = await API.post("/register", {
        ...form,
        event_id
      });

      setMessage(`✅ Registered! Token: ${res.data.token_number}`);
    } catch (err) {
      setMessage("❌ Registration failed");
    }
  };

  return (
    <div className="register-container">

      <div className="register-card">

        <h2>Student Registration</h2>

        {/* FORM GRID */}
        <div className="form-grid">

          <div>
            <label>Name</label>
            <input
              name="student_name"
              onChange={handleChange}
              placeholder="Enter name"
            />
          </div>

          <div>
            <label>Roll Number</label>
            <input
              name="roll_number"
              onChange={handleChange}
              placeholder="Enter roll number"
            />
          </div>

          <div>
            <label>Department</label>
            <input
              name="department_id"
              onChange={handleChange}
              placeholder="Dept ID"
            />
          </div>

          <div>
            <label>Phone</label>
            <input
              name="phone"
              onChange={handleChange}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label>Category</label>
            <select name="category" onChange={handleChange}>
              <option value="GENERAL">General</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
            </select>
          </div>

        </div>

        {/* BUTTON */}
        <button onClick={handleSubmit}>
          Generate Token
        </button>

        {/* MESSAGE */}
        {message && <p className="message">{message}</p>}

      </div>

    </div>
  );
}

export default Register;