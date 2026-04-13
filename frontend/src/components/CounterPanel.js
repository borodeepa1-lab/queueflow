import React from "react";

function CounterPanel({ title, current, next }) {
  return (
    <div className="counter-card">
      <h3>{title}</h3>

      <div className="big-token">
        {current || "--"}
      </div>

      <p>Next:</p>

      <div>
        {next && next.length > 0
          ? next.map((t, i) => <span key={i}>{t} </span>)
          : "No queue"}
      </div>
    </div>
  );
}

export default CounterPanel;