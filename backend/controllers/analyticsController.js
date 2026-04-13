const db = require("../config/db");

exports.getAnalytics = async (req, res) => {
  const { event_id } = req.query;

  try {

    // Total students
    const [total] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?`,
      [event_id]
    );

    // Completed tokens
    const [completed] = await db.promise().query(
      `SELECT COUNT(*) AS completed FROM queue_tokens 
       WHERE event_id = ? AND status = 'COMPLETED'`,
      [event_id]
    );

   const [avg] = await db.promise().query(
  `SELECT AVG(TIMESTAMPDIFF(MINUTE, qt.token_time, NOW())) AS avg_wait 
   FROM queue_tokens qt 
   WHERE qt.event_id = ?`,
  [event_id]
);

    // Service distribution
    const [services] = await db.promise().query(
      `SELECT c.service_type, COUNT(*) AS count
       FROM queue_tokens qt
       JOIN counters c ON qt.counter_id = c.counter_id
       WHERE qt.event_id = ?
       GROUP BY c.service_type`,
      [event_id]
    );

    res.json({
      total_students: total[0].total,
      completed_tokens: completed[0].completed,
      avg_wait_time: Math.round(avg[0].avg_wait || 0),
      service_distribution: services
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Analytics failed" });
  }
};