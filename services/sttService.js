/**
 * Server-side speech-to-text (Groq Whisper). Used by iPhones, where Safari's built-in
 * SpeechRecognition can't listen hands-free. Uses the same GROQ_API_KEY as the chat model.
 */
const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

// Whisper sometimes "hears" these on near-silence
const HALLUCINATIONS = /^(thank you\.?|thanks for watching\.?|thanks\.?|you\.?|bye\.?|\.+)$/i;

function extFor(contentType) {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("webm")) return "webm";
  if (ct.includes("ogg")) return "ogg";
  if (ct.includes("wav")) return "wav";
  if (ct.includes("mpeg") || ct.includes("mp3")) return "mp3";
  return "m4a"; // iOS Safari records audio/mp4
}

async function transcribe(buffer, contentType) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const mime = (contentType || "audio/mp4").split(";")[0] || "audio/mp4";

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), `speech.${extFor(contentType)}`);
  form.append("model", STT_MODEL);
  form.append("response_format", "json");
  form.append("temperature", "0");
  // Nudges Whisper to write Hinglish in Roman letters instead of Urdu/Devanagari guesses
  form.append("prompt", "Namaste, mujhe website banwani hai. Price kya hai? Deific Digital, bhai.");

  const res = await fetch(GROQ_STT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Groq STT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.text || "").trim();
  return HALLUCINATIONS.test(text) ? "" : text;
}

module.exports = { transcribe };
