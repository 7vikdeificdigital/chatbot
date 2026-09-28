const express = require("express");
const businessConfig = require("../config/businessConfig");
const { getAIReply, extractLead } = require("../services/aiService");
const { getOrCreateConversation } = require("../models/conversations");
const { addMessage } = require("../models/messages");
const { createLead } = require("../models/leads");
const { synthesize } = require("../services/ttsService");
const { transcribe } = require("../services/sttService");

const router = express.Router();

// In-memory conversation history per sessionId (mirrors utils/sessions.js pattern)
const webSessions = new Map();
function getMessages(sessionId) {
  if (!webSessions.has(sessionId)) webSessions.set(sessionId, []);
  return webSessions.get(sessionId);
}

// POST /web/start  { sessionId }
// Creates the conversation row and returns the greeting to speak first.
router.post("/start", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

    await getOrCreateConversation(sessionId);

    const messages = getMessages(sessionId);
    messages.push({ role: "assistant", content: businessConfig.greeting });

    await logTurn(sessionId, "assistant", businessConfig.greeting);

    res.json({ reply: businessConfig.greeting });
  } catch (err) {
    console.error("[/web/start] error:", err);
    res.status(500).json({ error: err.message });
  }
});

async function logTurn(sessionId, role, text) {
  const conversationId = await getOrCreateConversation(sessionId);
  await addMessage(conversationId, role, text);
}

// POST /web/chat  { sessionId, message }
// message = the text the browser's speech recognition transcribed from the mic.
router.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    const messages = getMessages(sessionId);
    messages.push({ role: "user", content: message });
    await logTurn(sessionId, "user", message);

    const rawReply = await getAIReply(messages);
    const { speech, lead } = extractLead(rawReply);

    messages.push({ role: "assistant", content: speech });
    await logTurn(sessionId, "assistant", speech);

    let leadCaptured = false;
    if (lead) {
      await createLead(lead);
      leadCaptured = true;
    }

    res.json({ reply: speech, leadCaptured });
  } catch (err) {
    console.error("[/web/chat] error:", err);
    res.status(500).json({ error: "AI service error. Check server logs (likely GROQ_API_KEY)." });
  }
});

// POST /web/tts  { text, lang }  -> mp3 audio (same Indian voice on every device)
router.post("/tts", async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    const { audio, voice } = await synthesize(text.slice(0, 800), lang);
    res.set({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Voice": voice,
    });
    res.send(audio);
  } catch (err) {
    console.error("[/web/tts] error:", err.message);
    res.status(500).json({ error: "tts failed" });
  }
});

// POST /web/stt  (raw audio body: audio/mp4 on iPhone, audio/webm elsewhere) -> { text }
router.post("/stt", express.raw({ type: () => true, limit: "10mb" }), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length < 1000) return res.json({ text: "" });
    const text = await transcribe(req.body, req.headers["content-type"]);
    res.json({ text });
  } catch (err) {
    console.error("[/web/stt] error:", err.message);
    res.status(500).json({ error: "stt failed" });
  }
});

module.exports = router;
