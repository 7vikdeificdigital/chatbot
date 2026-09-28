/**
 * Run once (or anytime) to make sure the Postgres/Neon tables exist.
 * Usage: npm run db:setup
 * Safe to re-run — every statement in db/schema.sql is IF NOT EXISTS.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing in .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");

  try {
    await pool.query(sql);
    console.log("[migrate] Tables are ready (conversations, messages, leads).");
  } catch (err) {
    console.error("[migrate] Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
