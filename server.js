/* =========================================================
   NELOY AI - RENDER BACKEND (FIXED)
   File: server.js

   Fixes:
   - gemini-2.5-flash is no longer available to new users
   - Default model is now gemini-3.8-flash
   - Automatic fallback to other models on 404 / retired model
   - Working model is cached (no discovery on every request)

   Node.js 18+
   Render Start Command: node server.js
========================================================= */

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const API_VERSION = "v1beta";
const BASE_URL = "https://generativelanguage.googleapis.com";

// Models to try first (in order). Env var GEMINI_MODEL goes first.
// NOTE: if you set GEMINI_MODEL=gemini-2.5-flash on Render, delete it
// or change it to gemini-3.8-flash.
const PREFERRED_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash"
].filter(Boolean);

// Cache of the model that worked last
let workingModel = null;

app.use(express.json({ limit: "1mb" }));

// CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// Website files
app.use(express.static(path.join(__dirname)));


/* =========================================================
   HELPERS
========================================================= */

// List models that support generateContent (newest flash first)
async function discoverModels() {
    const response = await fetch(
        `${BASE_URL}/${API_VERSION}/models?pageSize=100`,
        { headers: { "x-goog-api-key": GEMINI_API_KEY } }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error("Model discovery failed: " + JSON.stringify(data));
    }

    return (data.models || [])
        .filter(m =>
            (m.supportedGenerationMethods || []).includes("generateContent")
        )
        .map(m => m.name.replace(/^models\//, ""))
        .filter(name => name.toLowerCase().includes("flash"))
        .filter(name => !/(image|tts|live|audio|embedding|thinking-exp)/i.test(name))
        .sort()
        .reverse(); // higher version numbers first
}

// Build the ordered list of models to try
async function getCandidateModels() {
    const list = [];

    if (workingModel) list.push(workingModel);
    PREFERRED_MODELS.forEach(m => list.push(m));

    try {
        const discovered = await discoverModels();
        discovered.forEach(m => list.push(m));
    } catch (err) {
        console.error("Discovery warning:", err.message);
    }

    // Remove duplicates, keep order
    return [...new Set(list)];
}

// Is this a "model not available" type of error?
function isModelUnavailable(status, data) {
    const msg = (data?.error?.message || "").toLowerCase();
    return (
        status === 404 ||
        data?.error?.status === "NOT_FOUND" ||
        msg.includes("no longer available") ||
        msg.includes("is not found") ||
        msg.includes("not supported")
    );
}

// Call one model
async function callGemini(model, prompt, language) {
    const url = `${BASE_URL}/${API_VERSION}/models/${model}:generateContent`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{
                    text:
                        "You are Neloy AI, a friendly and helpful AI voice assistant. " +
                        "Answer clearly and accurately. " +
                        "Use plain text without unnecessary markdown. " +
                        "Always reply in " + language + "."
                }]
            },
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}


/* =========================================================
   CHAT API
========================================================= */

app.post("/api/chat", async (req, res) => {

    try {

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is not configured."
            });
        }

        const prompt = String((req.body && req.body.prompt) || "").trim();

        const language =
            req.body && req.body.language === "bangla" ? "Bangla" : "English";

        if (!prompt) {
            return res.status(400).json({ error: "Please enter a message." });
        }

        const candidates = await getCandidateModels();
        let lastError = null;

        for (const model of candidates) {

            const result = await callGemini(model, prompt, language);

            // Model unavailable -> try the next one
            if (!result.ok && isModelUnavailable(result.status, result.data)) {
                console.warn(`Model ${model} unavailable, trying next...`);
                if (workingModel === model) workingModel = null;
                lastError = result.data;
                continue;
            }

            // Other API error (quota, bad key, etc.) -> stop
            if (!result.ok) {
                console.error("Gemini API Error:", JSON.stringify(result.data));
                return res.status(502).json({
                    error: "Gemini API request failed.",
                    details:
                        result.data.error?.message || "Unknown Gemini API error."
                });
            }

            // Extract answer
            const answer = result.data.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

            if (!answer) {
                console.error("Gemini returned no answer:", JSON.stringify(result.data));
                lastError = result.data;
                continue; // try next model
            }

            if (workingModel !== model) {
                workingModel = model;
                console.log("Using Gemini model:", model);
            }

            return res.json({
                success: true,
                answer: answer,
                model: model
            });
        }

        // Nothing worked
        console.error("All models failed:", JSON.stringify(lastError));
        return res.status(502).json({
            error: "No available Gemini model worked.",
            details:
                lastError?.error?.message ||
                "Please set GEMINI_MODEL to a valid model name."
        });

    } catch (error) {

        console.error("Server Error:", error.message);

        return res.status(500).json({
            error: "Server error.",
            details: error.message
        });
    }
});


/* =========================================================
   SERVER START
========================================================= */

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("NELOY AI SERVER STARTED");
    console.log("Port:", PORT);
    console.log("API Version:", API_VERSION);
    console.log("Preferred models:", PREFERRED_MODELS.join(", "));
    console.log("--------------------------------");
});
