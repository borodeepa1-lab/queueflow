const db = require("../config/db");
const { logAction } = require("../utils/audit");

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
  const { token_number, admin_id } = req.body;

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
       SET status = 'IN_PROGRESS',
           called_time = NOW()
       WHERE token_number = ?`,
      [token_number]
    );

    await logAction({
      tokenId: token[0].token_id,
      adminId: admin_id || null,
      eventId: token[0].event_id,
      action: `Token started: ${token_number}`
    });

    res.json({ message: "Token started successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to start token" });
  }
};

exports.completeToken = async (req, res) => {
  const { token_number, admin_id } = req.body;

  try {
    const [tokenRows] = await db.promise().query(
      "SELECT token_id, event_id FROM queue_tokens WHERE token_number = ?",
      [token_number]
    );

    await db.promise().query(
      `UPDATE queue_tokens 
       SET status = 'COMPLETED',
           completed_time = NOW()
       WHERE token_number = ?`,
      [token_number]
    );

    if (tokenRows.length) {
      await logAction({
        tokenId: tokenRows[0].token_id,
        adminId: admin_id || null,
        eventId: tokenRows[0].event_id,
        action: `Token completed: ${token_number}`
      });
    }

    res.json({ message: "Token completed" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
};

exports.skipToken = async (req, res) => {
  const { token_number, admin_id } = req.body;

  try {
    const [tokenRows] = await db.promise().query(
      "SELECT token_id, event_id FROM queue_tokens WHERE token_number = ?",
      [token_number]
    );

    await db.promise().query(
      `UPDATE queue_tokens 
       SET status = 'SKIPPED'
       WHERE token_number = ?`,
      [token_number]
    );

    if (tokenRows.length) {
      await logAction({
        tokenId: tokenRows[0].token_id,
        adminId: admin_id || null,
        eventId: tokenRows[0].event_id,
        action: `Token skipped: ${token_number}`
      });
    }

    res.json({ message: "Token skipped" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to skip token" });
  }
};

exports.nowServing = async (req, res) => {
    const { event_id, service_id } = req.query;

    try {
        if (event_id) {
            const [counters] = await db.promise().query(
                `SELECT counter_rows.counter_id, counter_rows.counter_name, counter_rows.counter_no, counter_rows.service_type,
                        GROUP_CONCAT(s.staff_name ORDER BY s.staff_id SEPARATOR ', ') AS staff_names
                 FROM (
                    SELECT c.*,
                           ROW_NUMBER() OVER (PARTITION BY c.event_id ORDER BY c.counter_id ASC) AS counter_no
                    FROM counters c
                    WHERE c.event_id = ?
                 ) AS counter_rows
                 LEFT JOIN staff s ON s.counter_id = counter_rows.counter_id
                 GROUP BY counter_rows.counter_id, counter_rows.counter_name, counter_rows.counter_no, counter_rows.service_type
                 ORDER BY counter_rows.counter_id ASC`,
                [event_id]
            );

            const result = [];

            for (const counter of counters) {
                const [current] = await db.promise().query(
                    `SELECT token_number
                     FROM queue_tokens
                     WHERE counter_id = ?
                       AND status = 'IN_PROGRESS'
                     ORDER BY token_id ASC
                     LIMIT 1`,
                    [counter.counter_id]
                );

                const [next] = await db.promise().query(
                    `SELECT token_number
                     FROM queue_tokens
                     WHERE counter_id = ?
                       AND status = 'WAITING'
                     ORDER BY priority_level DESC, token_time ASC
                     LIMIT 5`,
                    [counter.counter_id]
                );

                result.push({
                    counter_id: counter.counter_id,
                    counter_name: counter.counter_name,
                    counter_no: counter.counter_no,
                    service_type: counter.service_type,
                    staff_names: counter.staff_names ? counter.staff_names.split(", ") : [],
                    now_serving: current[0]?.token_number || null,
                    next_tokens: next.map((item) => item.token_number)
                });
            }

            return res.json(result);
        }

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
        console.log(error);
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
                r.roll_number,
                r.email,
                qt.token_number,
                qt.counter_id,
                c.counter_name,
                c.counter_no,
                c.service_type,
                qt.status,

                -- Queue position (only for waiting)
                (
                    SELECT COUNT(*) 
                    FROM queue_tokens qt2
                    WHERE qt2.counter_id = qt.counter_id
                    AND qt2.status = 'WAITING'
                    AND qt2.token_id <= qt.token_id
                ) AS position

            FROM queue_tokens qt
            JOIN registrations r ON qt.registration_id = r.registration_id
            JOIN (
                SELECT counter_id, counter_name, service_type, event_id,
                       ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY counter_id ASC) AS counter_no
                FROM counters
            ) c ON qt.counter_id = c.counter_id AND qt.event_id = c.event_id

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
