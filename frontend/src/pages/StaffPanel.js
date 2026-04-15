import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";

const statusRank = {
  IN_PROGRESS: 1,
  WAITING: 2,
  SKIPPED: 3,
  COMPLETED: 4
};

function StaffPanel() {
  const [staff, setStaff] = useState(null);
  const [tokens, setTokens] = useState([]);
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const fetchTokens = useCallback(async (staffData) => {
    if (!staffData?.event_id || !staffData?.counter_id) {
      setTokens([]);
      return;
    }

    try {
      const res = await API.get(`/queue/all-tokens?event_id=${staffData.event_id}`);
      const filtered = Array.isArray(res.data)
        ? res.data.filter((token) => String(token.counter_id) === String(staffData.counter_id))
        : [];
      setTokens(filtered);
    } catch (error) {
      console.log(error);
      showToast({ title: "Failed to load counter queue", type: "error" });
    }
  }, [showToast]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("staff") || "null");
    const queryStaffId = searchParams.get("staff_id");

    const loadStaff = async () => {
      try {
        if (queryStaffId) {
          const res = await API.get(`/staff?staff_id=${queryStaffId}`);
          const selected = Array.isArray(res.data) ? res.data[0] : null;

          if (selected) {
            setStaff(selected);
            await fetchTokens(selected);
            return;
          }
        }

        if (stored) {
          setStaff(stored);
          await fetchTokens(stored);
        }
      } catch (error) {
        console.log(error);
        showToast({ title: "Failed to load staff access", type: "error" });
      }
    };

    loadStaff();
  }, [fetchTokens, searchParams, showToast]);

  const sortedTokens = useMemo(
    () =>
      [...tokens].sort((left, right) => {
        const rankDifference = (statusRank[left.status] || 99) - (statusRank[right.status] || 99);

        if (rankDifference !== 0) {
          return rankDifference;
        }

        return String(left.token_number || "").localeCompare(String(right.token_number || ""));
      }),
    [tokens]
  );

  const handleQueueAction = async (endpoint, tokenNumber, successMessage) => {
    try {
      await API.post(endpoint, { token_number: tokenNumber });
      await fetchTokens(staff);
      showToast({ title: successMessage, type: "success" });
    } catch (error) {
      showToast({ title: error.response?.data?.error || "Queue action failed", type: "error" });
    }
  };

  if (!staff) {
    return <div className="page"><section className="panel-card"><h3>Please login as staff</h3></section></div>;
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Live admin dashboard</p>
          <h2>Queue analytics and queue control</h2>
        </div>
        <p className="page-copy">
          This tab only shows users assigned to {staff.counter_name || `Counter ${staff.counter_no || staff.counter_id}`}.
        </p>
      </section>

      <section className="analytics-strip">
        <article className="metric-card">
          <span>Total users</span>
          <strong>{tokens.length}</strong>
          <p>Participants attached to this assigned counter.</p>
        </article>
        <article className="metric-card">
          <span>Completed</span>
          <strong>{tokens.filter((token) => token.status === "COMPLETED").length}</strong>
          <p>Tokens already processed by this counter.</p>
        </article>
        <article className="metric-card">
          <span>In progress</span>
          <strong>{tokens.filter((token) => token.status === "IN_PROGRESS").length}</strong>
          <p>Current active token count for this counter.</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="eyebrow">Assigned counter</p>
            <h3>{staff.staff_name || "Staff member"}</h3>
          </div>
          <span className="status-pill status-pill--live">{staff.counter_name || `Counter ${staff.counter_no || staff.counter_id}`}</span>
        </div>

        <div className="table-shell">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>User</th>
                <th>Counter</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTokens.map((token) => (
                <tr key={token.token_number}>
                  <td>{token.token_number}</td>
                  <td>
                    <strong>{token.student_name}</strong>
                    <span>{token.email || token.roll_number || "Queue participant"}</span>
                  </td>
                  <td>{`Counter ${token.counter_no || staff.counter_no || staff.counter_id}`}</td>
                  <td><span className={`status-pill status-pill--${String(token.status || "idle").toLowerCase()}`}>{token.status}</span></td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="button button--table" onClick={() => handleQueueAction("/queue/start", token.token_number, `Token started: ${token.token_number}`)}>Start</button>
                      <button type="button" className="button button--table" onClick={() => handleQueueAction("/queue/complete", token.token_number, `Token completed: ${token.token_number}`)}>Complete</button>
                      <button type="button" className="button button--table" onClick={() => handleQueueAction("/queue/skip", token.token_number, `Token skipped: ${token.token_number}`)}>Skip</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!sortedTokens.length ? (
                <tr>
                  <td colSpan="5">No users are currently assigned to this counter.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StaffPanel;
