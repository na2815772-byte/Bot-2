/* =========================================================
NELOY AI - RENDER BACKEND (server.js)
- Serves your website files (index.html, script.js, ...)
- POST /api/chat  ->  calls Google Gemini
- API key is read from Render Environment Variable:
  GEMINI_API_KEY   (never put the key in script.js)
- Optional env variable: GEMINI_MODEL (default below)
Requires Node 18+ (built-in fetch).

package.json needs:  "dependencies": { "express": "^4.19.2" }
Render start command:  node server.js
========================================================= */

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

app.use(express.json({ limit: "1mb" }));

/* Allow the website to call this server even if hosted elsewhere */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

/* Serve website files from the same folder */
app.use(express.static(path.join(__dirname)));

app.post("/api/chat", async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
        }

        const prompt = String((req.body && req.body.prompt) || "").trim();
        const language = req.body && req.body.language === "bangla" ? "Bangla" : "English";

        if (!prompt) {
            return res.status(400).json({ error: "Empty prompt." });
        }

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            GEMINI_MODEL +
            ":generateContent";

        const geminiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{
                        text:
                            "You are Neloy AI, a friendly voice assistant. " +
                            "Answer clearly and briefly in plain text (no markdown). " +
                            "Reply in " + language + "."
                    }]
                },
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error("Gemini error:", JSON.stringify(data));
            return res.status(502).json({ error: "Gemini request failed." });
        }

        const parts =
            (data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts) || [];

        const answer = parts.map(p => p.text || "").join("").trim();

        res.json({ answer });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

app.listen(PORT, () => {
    console.log("Neloy AI server running on port " + PORT);
});
