import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {

  const location = useLocation();

  return (
    <div className="sidebar">

      {/* LOGO */}
      <h2 className="logo">QueueFlow</h2>

      {/* MENU */}
      <nav className="menu">

        <Link 
          to="/" 
          className={location.pathname === "/" ? "active" : ""}
        >
          🏠 Home
        </Link>

        <Link 
          to="/events" 
          className={location.pathname === "/events" ? "active" : ""}
        >
          📅 Events
        </Link>

        <Link 
          to="/register" 
          className={location.pathname === "/register" ? "active" : ""}
        >
          📝 Register
        </Link>

        <Link 
          to="/students" 
          className={location.pathname === "/students" ? "active" : ""}
        >
          👥 Students
        </Link>

        <Link 
          to="/help" 
          className={location.pathname === "/help" ? "active" : ""}
        >
          ❓ Help
        </Link>

      </nav>

      {/* BOTTOM */}
      <div className="bottom">
        <Link 
          to="/login" 
          className={location.pathname === "/login" ? "active" : ""}
        >
          🔐 Admin
        </Link>
      </div>

    </div>
  );
}

export default Sidebar;