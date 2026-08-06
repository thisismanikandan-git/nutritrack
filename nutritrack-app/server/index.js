// Minimal backend proxy for the "Search the web" AI recipe feature.
//
// Why this exists: the Recipes tab can look up a cooking method for any dish
// via Claude + web search. Browsers can't call api.anthropic.com directly
// (CORS is blocked there, and shipping your API key to the browser would let
// anyone steal it from page source). This tiny server sits in between:
// your frontend calls THIS server, and THIS server calls Anthropic using a
// key that only ever lives on your machine / your host's environment.
//
// Setup:
//   cd server
//   npm install
//   cp .env.example .env        # then add your real ANTHROPIC_API_KEY
//   npm start                   # runs on http://localhost:8787
//
// Then in the project root .env, point the frontend at it:
//   VITE_RECIPE_API_URL=http://localhost:8787/api/recipe-search

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy server/.env.example to server/.env " +
    "and add your key from https://console.anthropic.com/settings/keys\n"
  );
}

app.post("/api/recipe-search", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    }

    // Forward the exact request body the frontend built (model, messages, tools)
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Recipe search proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log(`\n🍛 Recipe search proxy running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
