import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./SidebarShell.css";

const navItems = [
  { to: "/", label: "Home", badge: "Live" },
  { to: "/register", label: "Register", badge: "Token" },
  { to: "/students", label: "Users", badge: "Queue" },
  { to: "/help", label: "Help", badge: "Guide" }
];

function SidebarShell() {
  const location = useLocation();

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-shell__brand">
        <p className="sidebar-shell__eyebrow">Multi-event queue platform</p>
        <h1>QueueFlow</h1>
        <p>
          A shared queue management frontend for admissions, campus events, and any public registration flow.
        </p>
      </div>

      <nav className="sidebar-shell__nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={location.pathname === item.to ? "active" : ""}
          >
            <span>{item.label}</span>
            <small>{item.badge}</small>
          </Link>
        ))}
      </nav>

      <div className="sidebar-shell__footer">
        <div className="sidebar-shell__note">
          <span className="sidebar-shell__pulse" />
          <p>Each admin sees only their own hosted event data and history.</p>
        </div>

        <Link
          to="/admin"
          className={location.pathname === "/admin" ? "sidebar-shell__admin active" : "sidebar-shell__admin"}
        >
          <span>Admin</span>
          <small>Host panel</small>
        </Link>
      </div>
    </aside>
  );
}

export default SidebarShell;
