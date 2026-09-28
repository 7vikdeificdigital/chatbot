/**
 * Server-side text-to-speech, so every device (Android, iPhone, laptop) plays the SAME voice.
 *
 * Provider order:
 *  1. Azure Speech (official, reliable) — used if AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set.
 *  2. Microsoft Edge neural voices via the `msedge-tts` package — free, no key needed (unofficial).
 *
 * Both give the same voices: en-IN-NeerjaNeural (Indian English) and hi-IN-SwaraNeural (Hindi).
 */

const VOICES = {
  "en-IN": process.env.TTS_VOICE_EN || "en-IN-NeerjaNeural",
  "hi-IN": process.env.TTS_VOICE_HI || "hi-IN-SwaraNeural",
};

const cache = new Map(); // repeated sentences (like the greeting) come back instantly
const CACHE_MAX = 100;

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function azureSynthesize(text, voice, lang) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const ssml =
    `<speak version='1.0' xml:lang='${lang}'>` +
    `<voice xml:lang='${lang}' name='${voice}'>${escapeXml(text)}</voice></speak>`;

  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "deific-digital-receptionist",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function edgeSynthesize(text, voice) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Different package versions return either a stream or { audioStream, ... }
  const result = await tts.toStream(text);
  const stream = result && result.audioStream ? result.audioStream : result;

  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const audio = Buffer.concat(chunks);
  if (!audio.length) throw new Error("Edge TTS returned empty audio");
  return audio;
}

/**
 * @param {string} text  what to speak
 * @param {string} lang  'hi-IN' for Devanagari text, otherwise 'en-IN'
 * @returns {Promise<{audio: Buffer, voice: string}>}
 */
async function synthesize(text, lang) {
  const safeLang = lang === "hi-IN" ? "hi-IN" : "en-IN";
  const voice = VOICES[safeLang];
  const cacheKey = `${voice}|${text}`;

  if (cache.has(cacheKey)) return { audio: cache.get(cacheKey), voice };

  const useAzure = process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION;
  const audio = useAzure
    ? await azureSynthesize(text, voice, safeLang)
    : await edgeSynthesize(text, voice);

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(cacheKey, audio);
  return { audio, voice };
}

module.exports = { synthesize };
