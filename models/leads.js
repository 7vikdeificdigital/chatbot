const { getPool } = require("../config/db");

async function createLead({ name, phone, email, message }) {
  const pool = getPool();
  const result = await pool.query(
    "INSERT INTO leads (name, phone, email, message) VALUES ($1, $2, $3, $4) RETURNING *",
    [name || null, phone || null, email || null, message || null]
  );
  return result.rows[0];
}

async function listLeads(limit = 50) {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM leads ORDER BY id DESC LIMIT $1", [limit]);
  return result.rows;
}

module.exports = { createLead, listLeads };
