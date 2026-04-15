import React, { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import SidebarShell from "./components/SidebarShell";
import HomeScreen from "./pages/HomeScreen";
import EventsScreen from "./pages/EventsScreen";
import RegisterScreen from "./pages/RegisterScreen";
import StudentsScreen from "./pages/StudentsScreen";
import AdminHostPanel from "./pages/AdminHostPanel";
import StaffLogin from "./pages/StaffLogin";
import StaffPanel from "./pages/StaffPanel";
import HelpScreen from "./pages/HelpScreen";
import { ToastProvider } from "./context/ToastContext";
import "./AppShell.css";

function App() {
  useEffect(() => {
    if (!sessionStorage.getItem("queueflow-session-started")) {
      localStorage.removeItem("event_id");
      sessionStorage.setItem("queueflow-session-started", "true");
    }
  }, []);

  return (
    <ToastProvider>
      <Router>
        <div className="app-shell">
          <SidebarShell />

          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/events" element={<EventsScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/students" element={<StudentsScreen />} />
              <Route path="/admin" element={<AdminHostPanel />} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/staff" element={<StaffPanel />} />
              <Route path="/login" element={<Navigate to="/admin" replace />} />
              <Route path="/help" element={<HelpScreen />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
