const db = require("../config/db");

exports.getNextToken = async (req, res) => {

    const { service_id } = req.query;

    try {

        const [rows] = await db.promise().query(
            `SELECT * FROM queue_tokens
             WHERE service_id = ?
             AND status = 'WAITING'
             ORDER BY priority_level DESC, token_time ASC
             LIMIT 1`,
            [service_id]
        );

        if (rows.length === 0) {
            return res.json({ message: "No tokens in queue" });
        }

        res.json(rows[0]);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch next token" });
    }
};

exports.startToken = async (req, res) => {
  const { token_number } = req.body;

  try {

    // 1️⃣ Get token details
    const [token] = await db.promise().query(
      "SELECT * FROM queue_tokens WHERE token_number = ?",
      [token_number]
    );

    if (token.length === 0) {
      return res.status(404).json({ error: "Token not found" });
    }

    const counter_id = token[0].counter_id;

    // 2️⃣ Check if any token already IN_PROGRESS for this counter
    const [active] = await db.promise().query(
      `SELECT * FROM queue_tokens 
       WHERE counter_id = ? AND status = 'IN_PROGRESS'`,
      [counter_id]
    );

    if (active.length > 0) {
      return res.status(400).json({
        error: "Another token is already in progress at this counter"
      });
    }

    // 3️⃣ Start token
    await db.promise().query(
      `UPDATE queue_tokens 
       SET status = 'IN_PROGRESS'
       WHERE token_number = ?`,
      [token_number]
    );

    res.json({ message: "Token started successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to start token" });
  }
};

exports.completeToken = async (req, res) => {
  const { token_number } = req.body;

  try {
    await db.promise().query(
      `UPDATE queue_tokens 
       SET status = 'COMPLETED'
       WHERE token_number = ?`,
      [token_number]
    );

    res.json({ message: "Token completed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};

exports.skipToken = async (req, res) => {
  const { token_number } = req.body;

  await db.promise().query(
    `UPDATE queue_tokens 
     SET status = 'SKIPPED'
     WHERE token_number = ?`,
    [token_number]
  );

  res.json({ message: "Token skipped" });
};

exports.nowServing = async (req, res) => {

    const { service_id } = req.query;

    try {

        const [current] = await db.promise().query(
            `SELECT token_number
             FROM queue_tokens
             WHERE service_id = ?
             AND status = 'IN_PROGRESS'
             LIMIT 1`,
            [service_id]
        );

        const [next] = await db.promise().query(
            `SELECT token_number
             FROM queue_tokens
             WHERE service_id = ?
             AND status = 'WAITING'
             ORDER BY priority_level DESC, token_time ASC
             LIMIT 5`,
            [service_id]
        );

        res.json({
            now_serving: current[0]?.token_number || "None",
            next_tokens: next.map(t => t.token_number)
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch queue" });
    }
};

exports.getAllTokens = async (req, res) => {
    const { event_id } = req.query;

    try {
        const [tokens] = await db.promise().query(
            `
            SELECT 
                r.student_name,
                qt.token_number,
                c.service_type,
                qt.status,

                -- Queue position (only for waiting)
                (
                    SELECT COUNT(*) 
                    FROM queue_tokens qt2
                    WHERE qt2.service_id = qt.service_id
                    AND qt2.status = 'WAITING'
                    AND qt2.token_id <= qt.token_id
                ) AS position

            FROM queue_tokens qt
            JOIN registrations r ON qt.registration_id = r.registration_id
            JOIN counters c ON qt.counter_id = c.counter_id

            WHERE qt.event_id = ?
            ORDER BY qt.token_id ASC
            `,
            [event_id]
        );

        // Add estimated wait (3 min per person)
        const result = tokens.map(t => ({
            ...t,
            estimated_wait: t.position ? t.position * 3 : null
        }));

        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch tokens" });
    }
};