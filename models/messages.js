const { getPool } = require("../config/db");

async function addMessage(conversationId, role, message, language = null) {
  const pool = getPool();
  await pool.query(
    "INSERT INTO messages (conversation_id, role, message, language) VALUES ($1, $2, $3, $4)",
    [conversationId, role, message, language]
  );
}

async function listMessages(conversationId, limit = 200) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY id ASC LIMIT $2",
    [conversationId, limit]
  );
  return result.rows;
}

async function listRecentMessages(limit = 50) {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM messages ORDER BY id DESC LIMIT $1", [limit]);
  return result.rows;
}

module.exports = { addMessage, listMessages, listRecentMessages };
