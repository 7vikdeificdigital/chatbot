# Deific Digital — AI Web Receptionist (Demo)

A browser-based AI receptionist for **Deific Digital** (IT services, web/app development, AI
solutions & digital marketing). Visitors talk to it (mic in, voice out, using the browser's own
speech APIs) or type; the AI explains services from `config/businessConfig.js`, answers FAQs, and
captures leads (name, phone/email, what they need) into a Postgres (Neon) database.

**No phone calling, no Twilio.** This is purely a web widget/page.

**Cost to run this demo: $0.** Neon's free tier + Groq's free tier cover it.

## What it uses
| Piece | Service | Why it's free |
|---|---|---|
| Conversation AI (the "brain") | **Groq** (`openai/gpt-oss-120b`) | Generous free API tier, fast responses |
| Database | **Neon** (serverless Postgres) | Free tier, plenty for a demo |
| Speech-to-text / text-to-speech | Browser's built-in Web Speech API | Free, no extra key needed |
| Server | Node.js / Express | Runs anywhere (your laptop, Render, Railway, etc.) |

---

## 1. One-time setup

### A. Neon (free Postgres database)
1. Go to https://neon.tech and create a free account/project.
2. On the project dashboard, click **Connect** and copy the connection string. It looks like:
   `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`
3. Paste it into `.env` as `DATABASE_URL`.
4. Run `npm run db:setup` — this creates the `conversations`, `messages` and `leads` tables
   (safe to re-run any time; see `db/schema.sql` if you'd rather run the SQL yourself in Neon's SQL editor).

### B. Groq (free LLM API key)
1. Sign up at https://console.groq.com
2. Create an API key, paste into `.env` as `GROQ_API_KEY`.

### C. Install dependencies
```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and GROQ_API_KEY
npm run db:setup       # creates conversations / messages / leads tables on Neon
```

### D. Personalize for the business
Open `config/businessConfig.js` and edit:
- `companyName`, `businessType`, `phone`, `email`, `address`, `workingHours`, `greeting`
- The `services` array and the `faq` array
- `customInstructions` — tone, what to collect from a lead, what NOT to say (prices, guarantees, etc.)

This is the only file you need to touch to re-brand the demo for a different business.

---

## 2. Running it

```bash
npm start
```

Open **http://localhost:3000** in **Google Chrome or Microsoft Edge** (Safari/Firefox don't support
the built-in speech recognition this page uses — typing still works everywhere, only the mic button
needs Chrome/Edge).

Tap the mic (or type) and talk to the AI. Every turn is saved to Postgres, and if the visitor wants a
quote/callback, their details are saved to the `leads` table automatically.

**Show the stored data (great for the demo):**
```bash
curl http://localhost:3000/api/conversations
curl http://localhost:3000/api/messages
curl http://localhost:3000/api/leads
```
Or open your Neon project → SQL editor / Tables to show it live.

To put this online for others to use (not just localhost), deploy the server to something like
Render or Railway, set the same environment variables there, and share that URL.

---

## How a chat flows
1. Visitor opens the page → a session starts → a row is created in `conversations` → the AI greets
   them using `businessConfig.greeting`.
2. Every turn (visitor + AI) is saved as a row in `messages`, linked by `conversation_id`.
3. Each message goes to Groq's LLM with a system prompt built from `businessConfig` (services, FAQ,
   custom instructions).
4. If the visitor wants a quote/callback, the AI collects name, phone/email, and what they need, one
   question at a time.
5. Once confirmed, the AI saves a row to `leads` and reads back a short confirmation.

## Before using this with a real business (not just a demo)
- **Data privacy**: lead data (name/phone/email) is personal data — plan for access controls and
  compliance with India's DPDP Act (or applicable local law) before going live.
- **Scale**: move the Groq key to a paid tier if traffic grows, and move in-memory session storage
  (the `webSessions` map in `routes/webRoutes.js`) to Redis so sessions survive restarts and work
  across multiple server instances.
- **Human fallback**: add a way for the visitor to reach a real person for anything outside what the
  assistant should handle.

---

## 📱 Phone (Android / iPhone) pe chalane ke liye
Phone browsers **mic sirf HTTPS link** pe allow karte hain (`http://192.168.x.x:3000` pe mic nahi chalega).

**Quick test (laptop se, temporary HTTPS link):**
```bash
npm start                      # ek terminal me
npx cloudflared tunnel --url http://localhost:3000   # doosre terminal me -> https://xxxx.trycloudflare.com deta hai
# ya: ngrok http 3000
```
Wo `https://...` link phone me kholo.

**Permanent:** Render / Railway pe deploy karo (Build: `npm install`, Start: `npm start`) aur env vars me
`DATABASE_URL` + `GROQ_API_KEY` daalo. Milne wala `https://` link kisi bhi phone pe chalega.

Mic support: Android **Chrome** ✅ · iPhone **Safari** ✅ (Chrome/in-app browsers pe nahi) — jahan mic na ho wahan type karke bhi baat ho sakti hai.
