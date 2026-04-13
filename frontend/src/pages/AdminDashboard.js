import React, { useEffect, useState } from "react";
import API from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function AdminDashboard() {

  const [tokens, setTokens] = useState([]);

  const event_id = localStorage.getItem("event_id");

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await API.get(`/queue/all-tokens?event_id=${event_id}`);
      setTokens(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const startToken = async (token) => {
    await API.post("/queue/start", { token_number: token });
    fetchTokens();
  };

  const completeToken = async (token) => {
    await API.post("/queue/complete", { token_number: token });
    fetchTokens();
  };

  const skipToken = async (token) => {
    await API.post("/queue/skip", { token_number: token });
    fetchTokens();
  };

  useEffect(() => {
    fetchTokens();
    fetchAnalytics();
  }, []);

  const [stats, setStats] = useState(null);

  const fetchAnalytics = async () => {
    const res = await API.get(`/analytics?event_id=${event_id}`);
    setStats(res.data);
  };

  const generatePDF = () => {
  const input = document.body;

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 0, 0);

    pdf.save("report.pdf");
  });
};

  return (
    <div>

      <h2>Admin Dashboard</h2>

      {stats && (
        <div className="stats">
          <p>Total Students: {stats.total_students}</p>
          <p>Completed: {stats.completed_tokens}</p>
          <p>Avg Wait: {stats.avg_wait_time} min</p>
        </div>
      )}

      <button onClick={generatePDF}>Download Report</button>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Name</th>
            <th>Service</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tokens.map((t, index) => (
            <tr key={index}>
              <td>{t.token_number}</td>
              <td>{t.student_name}</td>
              <td>{t.service_type}</td>
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

export default AdminDashboard;