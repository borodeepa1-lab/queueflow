import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import Events from "./pages/Events";
import Register from "./pages/Register";
import Students from "./pages/Students";
import AdminDashboard from "./pages/AdminDashboard";
import StaffPanel from "./pages/StaffPanel";
import Login from "./pages/Login";
import Help from "./pages/Help";

import "./App.css";

function App() {
  return (
    <Router>
      <Sidebar />

      <div className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/students" element={<Students />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<StaffPanel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

