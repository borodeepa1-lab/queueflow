const db = require("../config/db");

exports.generateToken = async (req, res) => {

    const { registration_id, service_id, event_id } = req.body;

    try {

        // Duplicate check
        const [existing] = await db.promise().query(
            `SELECT * FROM queue_tokens
             WHERE registration_id = ?
             AND service_id = ?
             AND status IN ('WAITING','IN_PROGRESS')`,
            [registration_id, service_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: "You already have an active token for this service"
            });
        }

        // Get prefix
        const [service] = await db.promise().query(
            "SELECT token_prefix FROM services WHERE service_id = ?",
            [service_id]
        );

        const prefix = service[0].token_prefix;

        // Last token
        const [lastToken] = await db.promise().query(
            `SELECT token_number FROM queue_tokens
             WHERE service_id = ?
             ORDER BY token_id DESC LIMIT 1`,
            [service_id]
        );

        let nextNumber = 1;

        if (lastToken.length > 0) {
            const last = lastToken[0].token_number.split("-")[1];
            nextNumber = parseInt(last) + 1;
        }

        const tokenNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

        // Insert
        await db.promise().query(
            `INSERT INTO queue_tokens
            (token_number, registration_id, event_id, service_id)
            VALUES (?, ?, ?, ?)`,
            [tokenNumber, registration_id, event_id, service_id]
        );

        res.json({ token: tokenNumber });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Token generation failed" });
    }
};