const db = require("../config/db");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [staff] = await db.promise().query(
      "SELECT * FROM staff WHERE email = ? AND password = ?",
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