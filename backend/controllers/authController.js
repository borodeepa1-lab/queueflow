const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { logAction } = require("../utils/audit");

exports.registerAdmin = async (req, res) => {
  const { name, contact, password } = req.body;

  if (!name || !contact || !password) {
    return res.status(400).json({ error: "Name, contact, and password are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.promise().query(
      `INSERT INTO admins (username, contact, password_hash, role)
       VALUES (?, ?, ?, 'SUPER_ADMIN')`,
      [name, contact, passwordHash]
    );

    await logAction({
      adminId: result.insertId,
      action: `Admin registered: ${name}`
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        admin_id: result.insertId,
        username: name,
        contact,
        role: "SUPER_ADMIN"
      }
    });
  } catch (error) {
    console.log(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "An admin with this contact already exists" });
    }

    res.status(500).json({ error: "Admin registration failed" });
  }
};

exports.loginAdmin = async (req, res) => {
  const { contact, password } = req.body;

  if (!contact || !password) {
    return res.status(400).json({ error: "Contact and password are required" });
  }

  try {
    const [admins] = await db.promise().query(
      `SELECT admin_id, username, contact, password_hash, role
       FROM admins
       WHERE contact = ? OR username = ?
       LIMIT 1`,
      [contact, contact]
    );

    if (!admins.length) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const admin = admins[0];
    const isMatch =
      admin.password_hash === password || (await bcrypt.compare(password, admin.password_hash));

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    await logAction({
      adminId: admin.admin_id,
      action: `Admin login: ${admin.username}`
    });

    res.json({
      message: "Admin login successful",
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        contact: admin.contact,
        role: admin.role
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Admin login failed" });
  }
};

exports.getAdminEvents = async (req, res) => {
  const { adminId } = req.params;

  try {
    const [events] = await db.promise().query(
      `SELECT *
       FROM events
       WHERE admin_id = ?
       ORDER BY start_date DESC, event_id DESC`,
      [adminId]
    );

    res.json(events);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch admin events" });
  }
};
