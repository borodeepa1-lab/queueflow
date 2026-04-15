const db = require("../config/db");

async function logAction({ tokenId = null, adminId = null, eventId = null, action }) {
  if (!action) {
    return;
  }

  try {
    await db.promise().query(
      `INSERT INTO audit_logs (token_id, admin_id, event_id, action)
       VALUES (?, ?, ?, ?)`,
      [tokenId, adminId, eventId, action]
    );
  } catch (error) {
    console.log("Audit log failed", error.message);
  }
}

module.exports = {
  logAction
};
