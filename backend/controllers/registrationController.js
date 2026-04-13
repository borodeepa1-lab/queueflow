const db = require("../config/db");

exports.registerStudent = async (req, res) => {

    const { student_name, roll_number, department_id, category, phone } = req.body;

    try {

        const [result] = await db.promise().query(
            `INSERT INTO registrations 
            (student_name, roll_number, department_id, category, phone)
            VALUES (?, ?, ?, ?, ?)`,
            [student_name, roll_number, department_id, category, phone]
        );

        res.json({
            message: "Registration successful",
            registration_id: result.insertId
        });

    } catch (error) {
        console.log(error);

        // Handle duplicate roll number
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                error: "Student already registered"
            });
        }

        res.status(500).json({
            error: "Registration failed"
        });
    }
};