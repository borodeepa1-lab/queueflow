const db = require("../config/db");

exports.getLogs = async (req, res) => {
  const { event_id, admin_id } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (event_id) {
      conditions.push("al.event_id = ?");
      params.push(event_id);
    }

    if (admin_id) {
      conditions.push("al.admin_id = ?");
      params.push(admin_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [logs] = await db.promise().query(
      `SELECT al.*, a.username AS admin_name, qt.token_number
       FROM audit_logs al
       LEFT JOIN admins a ON al.admin_id = a.admin_id
       LEFT JOIN queue_tokens qt ON al.token_id = qt.token_id
       ${whereClause}
       ORDER BY al.log_time DESC, al.log_id DESC
       LIMIT 100`,
      params
    );

    res.json(logs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
