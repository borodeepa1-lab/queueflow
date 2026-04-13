import React, { useEffect, useState } from "react";
import API from "../services/api";

function QueueDisplay() {

  const [queue, setQueue] = useState({
    now_serving: "--",
    next_tokens: []
  });

  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue/now-serving?service_id=1");

      setQueue({
        now_serving: res.data.now_serving || "--",
        next_tokens: res.data.next_tokens || []
      });

      setLoading(false);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchQueue();

    const interval = setInterval(fetchQueue, 5000); // auto refresh

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Live Queue</h2>

      {loading ? (
        <p>Loading queue...</p>
      ) : (
        <>
          {/* Now Serving */}
          <div className="queue-card">
            <h3>Now Serving</h3>
            <div className="big">{queue.now_serving}</div>
          </div>

          {/* Next Tokens */}
          <div className="queue-card">
            <h3>Upcoming Tokens</h3>

            {queue.next_tokens.length === 0 ? (
              <p>No tokens waiting</p>
            ) : (
              queue.next_tokens.map((token, index) => (
                <div key={index} className="next">
                  {token}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default QueueDisplay;