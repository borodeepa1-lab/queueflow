const db = require("../config/db");

const statements = [
  "ALTER TABLE events MODIFY start_date DATETIME NULL",
  "ALTER TABLE events MODIFY end_date DATETIME NULL",
  "ALTER TABLE queue_tokens MODIFY token_number VARCHAR(20) UNIQUE"
];

const conditionalColumns = [
  {
    table: "admins",
    column: "contact",
    sql: "ALTER TABLE admins ADD COLUMN contact VARCHAR(255) NULL AFTER username"
  },
  {
    table: "admins",
    column: "created_at",
    sql: "ALTER TABLE admins ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  },
  {
    table: "staff",
    column: "email",
    sql: "ALTER TABLE staff ADD COLUMN email VARCHAR(255) NULL AFTER staff_name"
  },
  {
    table: "staff",
    column: "password",
    sql: "ALTER TABLE staff ADD COLUMN password VARCHAR(255) NULL AFTER email"
  },
  {
    table: "staff",
    column: "created_at",
    sql: "ALTER TABLE staff ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  },
  {
    table: "registrations",
    column: "created_at",
    sql: "ALTER TABLE registrations ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
  },
  {
    table: "registrations",
    column: "email",
    sql: "ALTER TABLE registrations ADD COLUMN email VARCHAR(255) NULL AFTER roll_number"
  },
  {
    table: "registrations",
    column: "department_name",
    sql: "ALTER TABLE registrations ADD COLUMN department_name VARCHAR(150) NULL AFTER department_id"
  },
  {
    table: "audit_logs",
    column: "event_id",
    sql: "ALTER TABLE audit_logs ADD COLUMN event_id INT NULL AFTER admin_id"
  },
  {
    table: "events",
    column: "ended_at",
    sql: "ALTER TABLE events ADD COLUMN ended_at DATETIME NULL AFTER status"
  }
];

const seedStatements = [
  `UPDATE admins
   SET contact = COALESCE(contact, 'admin@queueflow.local'),
       created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
   WHERE admin_id = 1`,
  `INSERT INTO admins (username, contact, password_hash, role)
   SELECT 'admin', 'admin@queueflow.local', 'admin123', 'SUPER_ADMIN'
   WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin')`
];

async function runStatement(connection, sql) {
  try {
    await connection.query(sql);
  } catch (error) {
    if (
      error.code === "ER_DUP_FIELDNAME" ||
      error.code === "ER_FK_DUP_NAME" ||
      error.code === "ER_DUP_KEYNAME"
    ) {
      return;
    }

    throw error;
  }
}

async function ensureDatabase() {
  const connection = db.promise();

  for (const statement of statements) {
    await runStatement(connection, statement);
  }

  for (const item of conditionalColumns) {
    const [rows] = await connection.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [item.table, item.column]
    );

    if (!rows.length) {
      await runStatement(connection, item.sql);
    }
  }

  await runStatement(
    connection,
    "ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_event FOREIGN KEY (event_id) REFERENCES events(event_id)"
  );

  for (const statement of seedStatements) {
    await connection.query(statement);
  }
}

module.exports = {
  ensureDatabase
};
