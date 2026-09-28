require("dotenv").config();
const path = require("path");
const express = require("express");
const { connectDB } = require("./config/db");

const dataRoutes = require("./routes/dataRoutes");
const webRoutes = require("./routes/webRoutes");

const app = express();
app.use(express.json()); // for our own JSON API calls (e.g. /web/chat)
app.use(express.static(path.join(__dirname, "public"))); // serves public/index.html at "/"

app.use("/api", dataRoutes);
app.use("/web", webRoutes);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] Listening on port ${PORT}`);
      console.log(`[server] Web receptionist: http://localhost:${PORT} (open in Chrome/Edge)`);
    });
  })
  .catch((err) => {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  });
