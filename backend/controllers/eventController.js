const db = require("../config/db");
const { logAction } = require("../utils/audit");

function resolveStatus(startDate, endDate) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && now < start) {
        return "UPCOMING";
    }

    if (end && now > end) {
        return "ENDED";
    }

    return "LIVE";
}

exports.getEvents = async (req, res) => {
    try {
        const { admin_id } = req.query;
        const params = [];
        let sql = "SELECT * FROM events";

        if (admin_id) {
            sql += " WHERE admin_id = ?";
            params.push(admin_id);
        }

        sql += " ORDER BY start_date DESC, event_id DESC";

        const [events] = await db.promise().query(
            sql,
            params
        );

        res.json(events);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
};

exports.createEvent = async (req, res) => {
    const { event_name, event_type, start_date, end_date, admin_id } = req.body;

    if (!event_name || !admin_id) {
        return res.status(400).json({ error: "Event name and admin are required" });
    }

    try {
        const status = resolveStatus(start_date, end_date);

        const [result] = await db.promise().query(
            `INSERT INTO events (event_name, event_type, start_date, end_date, status, admin_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [event_name, event_type || "GENERAL", start_date || null, end_date || null, status, admin_id]
        );

        await logAction({
            adminId: admin_id,
            eventId: result.insertId,
            action: `Event created: ${event_name}`
        });

        const [events] = await db.promise().query("SELECT * FROM events WHERE event_id = ?", [result.insertId]);
        res.status(201).json(events[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create event" });
    }
};

exports.deleteEvent = async (req, res) => {
    const { eventId } = req.params;
    const { admin_id } = req.query;

    try {
        const [events] = await db.promise().query(
            "SELECT * FROM events WHERE event_id = ? AND admin_id = ?",
            [eventId, admin_id]
        );

        if (!events.length) {
            return res.status(404).json({ error: "Event not found for this admin" });
        }

        const connection = db.promise();
        await connection.query("DELETE FROM audit_logs WHERE event_id = ?", [eventId]);
        await connection.query("DELETE FROM queue_tokens WHERE event_id = ?", [eventId]);
        await connection.query("DELETE FROM registrations WHERE event_id = ?", [eventId]);
        await connection.query("DELETE FROM staff WHERE event_id = ?", [eventId]);
        await connection.query("DELETE FROM counters WHERE event_id = ?", [eventId]);
        await connection.query("DELETE FROM events WHERE event_id = ?", [eventId]);

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to delete event" });
    }
};
