const db = require("../config/db");
const { logAction } = require("../utils/audit");

async function chooseCounter(eventId) {
    const [counters] = await db.promise().query(
        `SELECT c.counter_id, c.service_id, c.service_type, COUNT(qt.token_id) AS queue_count
         FROM counters c
         LEFT JOIN queue_tokens qt
           ON qt.counter_id = c.counter_id
          AND qt.status IN ('WAITING', 'IN_PROGRESS')
         WHERE c.event_id = ?
         GROUP BY c.counter_id, c.service_id, c.service_type
         ORDER BY queue_count ASC, c.counter_id ASC
         LIMIT 1`,
        [eventId]
    );

    return counters[0] || null;
}

async function chooseRequestedCounter(eventId, counterId) {
    const [rows] = await db.promise().query(
        `SELECT counter_id, counter_name, service_id, service_type
         FROM counters
         WHERE event_id = ? AND counter_id = ?
         LIMIT 1`,
        [eventId, counterId]
    );

    return rows[0] || null;
}

function normalizeCategory(category) {
    if (["SC", "ST", "OBC", "RESERVED"].includes(category)) {
        return "RESERVED";
    }

    if (category === "PWD") {
        return "PWD";
    }

    return "GENERAL";
}

async function buildTokenNumber(serviceId) {
    const [serviceRows] = await db.promise().query(
        "SELECT token_prefix FROM services WHERE service_id = ? LIMIT 1",
        [serviceId]
    );

    const prefix = serviceRows[0]?.token_prefix || "Q";

    const [lastTokenRows] = await db.promise().query(
        `SELECT token_number
         FROM queue_tokens
         WHERE service_id = ?
         ORDER BY token_id DESC
         LIMIT 1`,
        [serviceId]
    );

    let nextNumber = 1;

    if (lastTokenRows.length > 0) {
        const parts = String(lastTokenRows[0].token_number).split("-");
        const numericPart = Number(parts[parts.length - 1]);
        if (!Number.isNaN(numericPart)) {
            nextNumber = numericPart + 1;
        }
    }

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

exports.registerStudent = async (req, res) => {

    const {
        student_name,
        roll_number,
        email,
        department_id,
        department_name,
        category,
        phone,
        event_id,
        counter_id
    } = req.body;

    if (!student_name || !roll_number || !email || !phone || !event_id) {
        return res.status(400).json({ error: "Full name, ID number, email, phone, and event are required" });
    }

    try {
        const normalizedDepartmentId = department_id ? Number(department_id) : null;
        const counter = counter_id
            ? await chooseRequestedCounter(event_id, counter_id)
            : await chooseCounter(event_id);

        if (!counter) {
            return res.status(400).json({ error: "No counters are configured for this event" });
        }

        const tokenNumber = await buildTokenNumber(counter.service_id || 1);

        const [result] = await db.promise().query(
            `INSERT INTO registrations 
            (student_name, roll_number, email, department_id, department_name, category, phone, event_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_name,
                roll_number,
                email,
                Number.isNaN(normalizedDepartmentId) ? null : normalizedDepartmentId,
                department_name || null,
                normalizeCategory(category),
                phone,
                event_id
            ]
        );

        const registrationId = result.insertId;

        const [tokenResult] = await db.promise().query(
            `INSERT INTO queue_tokens
             (token_number, registration_id, event_id, service_id, counter_id)
             VALUES (?, ?, ?, ?, ?)`,
            [tokenNumber, registrationId, event_id, counter.service_id || 1, counter.counter_id]
        );

        await logAction({
            tokenId: tokenResult.insertId,
            eventId: event_id,
            action: `Student registered: ${student_name} (${tokenNumber})`
        });

        const [positionRows] = await db.promise().query(
            `SELECT COUNT(*) AS position
             FROM queue_tokens
             WHERE counter_id = ?
               AND status = 'WAITING'
               AND token_id <= ?`,
            [counter.counter_id, tokenResult.insertId]
        );

        res.json({
            message: "Registration successful",
            registration_id: registrationId,
            token_number: tokenNumber,
            counter_id: counter.counter_id,
            counter_name: counter.counter_name || counter.service_type || `Counter ${counter.counter_id}`,
            position: positionRows[0]?.position || 1,
            estimated_wait_minutes: (positionRows[0]?.position || 1) * 3
        });

    } catch (error) {
        console.log(error);

        // Handle duplicate roll number
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                error: "Student already registered"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2" || error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
            return res.status(400).json({
                error: "Please select a valid department for registration"
            });
        }

        res.status(500).json({
            error: "Registration failed"
        });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT department_id, department_name FROM departments ORDER BY department_name ASC"
        );

        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch departments" });
    }
};
