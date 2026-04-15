const db = require("../config/db");
const { logAction } = require("../utils/audit");

exports.assignStaff = async (req, res) => {
  const { staff_name, email, password, role, counter_id, event_id, admin_id } = req.body;

  if (!staff_name || !email || !password || !counter_id || !event_id) {
    return res.status(400).json({ error: "Staff details, counter, and event are required" });
  }

  try {
    const [counterRows] = await db.promise().query(
      `SELECT counter_no
       FROM (
         SELECT counter_id, event_id,
                ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY counter_id ASC) AS counter_no
         FROM counters
       ) ordered_counters
       WHERE counter_id = ? AND event_id = ?
       LIMIT 1`,
      [counter_id, event_id]
    );

    const counterNo = counterRows[0]?.counter_no || counter_id;

    const [result] = await db.promise().query(
      `INSERT INTO staff (staff_name, email, password, role, counter_id, event_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [staff_name, email, password, role || "STAFF", counter_id, event_id]
    );

    await logAction({
      adminId: admin_id || null,
      eventId: event_id,
      action: `Staff assigned: ${staff_name} to counter ${counterNo}`
    });

    const [rows] = await db.promise().query(
      "SELECT * FROM staff WHERE staff_id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.log(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Staff email already exists" });
    }

    res.status(500).json({ error: "Staff assignment failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [staff] = await db.promise().query(
      `SELECT s.*, CONCAT('Counter ', c.counter_no) AS counter_name, c.counter_name AS counter_title, c.counter_no
       FROM staff s
       LEFT JOIN (
         SELECT counter_id, counter_name, event_id,
                ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY counter_id ASC) AS counter_no
         FROM counters
       ) c ON c.counter_id = s.counter_id AND c.event_id = s.event_id
       WHERE s.email = ? AND s.password = ?`,
      [email, password]
    );

    if (staff.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      staff: staff[0]
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.getStaff = async (req, res) => {
  const { event_id, staff_id } = req.query;

  try {
    if (staff_id) {
      const [single] = await db.promise().query(
        `SELECT s.*, CONCAT('Counter ', c.counter_no) AS counter_name, c.counter_name AS counter_title, c.counter_no
         FROM staff s
         LEFT JOIN (
           SELECT counter_id, counter_name, event_id,
                  ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY counter_id ASC) AS counter_no
           FROM counters
         ) c ON c.counter_id = s.counter_id AND c.event_id = s.event_id
         WHERE s.staff_id = ?
         LIMIT 1`,
        [staff_id]
      );

      return res.json(single);
    }

    const [rows] = await db.promise().query(
      `SELECT s.*, CONCAT('Counter ', c.counter_no) AS counter_name, c.counter_name AS counter_title, c.counter_no
       FROM staff s
       LEFT JOIN (
         SELECT counter_id, counter_name, event_id,
                ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY counter_id ASC) AS counter_no
         FROM counters
       ) c ON c.counter_id = s.counter_id AND c.event_id = s.event_id
       WHERE (? IS NULL OR s.event_id = ?)
       ORDER BY s.staff_id DESC`,
      [event_id || null, event_id || null]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

exports.deleteStaff = async (req, res) => {
  const { staffId } = req.params;
  const { admin_id } = req.query;

  try {
    const [rows] = await db.promise().query(
      `SELECT s.*, e.admin_id AS event_admin_id
       FROM staff s
       JOIN events e ON e.event_id = s.event_id
       WHERE s.staff_id = ?`,
      [staffId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    if (String(rows[0].event_admin_id) !== String(admin_id)) {
      return res.status(403).json({ error: "You can only delete your own assigned staff" });
    }

    await db.promise().query("DELETE FROM staff WHERE staff_id = ?", [staffId]);

    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
};
