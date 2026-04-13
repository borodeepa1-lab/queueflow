const db = require("../config/db");

exports.getEvents = async (req, res) => {
    try {
        const [events] = await db.promise().query(
            "SELECT * FROM events ORDER BY start_date DESC"
        );

        res.json(events);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
};