const db = require("../config/db");
const { logAction } = require("../utils/audit");

exports.getCounters = async (req, res) => {
  const { event_id } = req.query;

  try {
    const [rows] = await db.promise().query(
      `SELECT counter_rows.*,
              GROUP_CONCAT(s.staff_name ORDER BY s.staff_id SEPARATOR ', ') AS staff_names
       FROM (
         SELECT c.*,
                ROW_NUMBER() OVER (PARTITION BY c.event_id ORDER BY c.counter_id ASC) AS counter_no
         FROM counters c
         WHERE (? IS NULL OR c.event_id = ?)
       ) AS counter_rows
       LEFT JOIN staff s ON s.counter_id = counter_rows.counter_id
       GROUP BY counter_rows.counter_id, counter_rows.counter_name, counter_rows.service_id,
                counter_rows.event_id, counter_rows.service_type, counter_rows.counter_no
       ORDER BY counter_rows.counter_id ASC`,
      [event_id || null, event_id || null]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch counters" });
  }
};

exports.createCounter = async (req, res) => {
  const { counter_name, service_id, service_type, event_id, admin_id } = req.body;

  if (!counter_name || !event_id) {
    return res.status(400).json({ error: "Counter name and event are required" });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO counters (counter_name, service_id, event_id, service_type)
       VALUES (?, ?, ?, ?)`,
      [counter_name, service_id || 1, event_id, service_type || "Verification"]
    );

    await logAction({
      adminId: admin_id || null,
      eventId: event_id,
      action: `Counter created: ${counter_name}`
    });

    const [rows] = await db.promise().query(
      "SELECT * FROM counters WHERE counter_id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create counter" });
  }
};
