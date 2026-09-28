-- Schema for Deific Digital AI receptionist (Neon / Postgres).
-- Safe to run multiple times: every statement is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS conversations (
    id          BIGSERIAL PRIMARY KEY,
    session_id  VARCHAR(100),
    language    VARCHAR(20),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id),
    role            VARCHAR(20),   -- 'user' or 'assistant'
    message         TEXT,
    language        VARCHAR(20)    -- per-turn detected language, e.g. 'en', 'hi', 'hi-en'
);

CREATE TABLE IF NOT EXISTS leads (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(150),
    phone   VARCHAR(30),
    email   VARCHAR(200),
    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
