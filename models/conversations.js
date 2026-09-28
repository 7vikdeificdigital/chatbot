const { getPool } = require("../config/db");

// Creates a conversation row if one doesn't already exist for this session_id,
// and always returns the conversation's id.
async function getOrCreateConversation(sessionId, language = null) {
  const pool = getPool();

  const existing = await pool.query(
    "SELECT id FROM conversations WHERE session_id = $1 LIMIT 1",
    [sessionId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await pool.query(
    "INSERT INTO conversations (session_id, language) VALUES ($1, $2) RETURNING id",
    [sessionId, language]
  );
  return inserted.rows[0].id;
}

async function listConversations(limit = 50) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM conversations ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}

module.exports = { getOrCreateConversation, listConversations };
