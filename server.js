/* =========================================================
   NELOY AI - RENDER BACKEND
   File: server.js

   Features:
   - Serves website files
   - POST /api/chat
   - Google Gemini API
   - Automatic model discovery
   - English and Bangla responses
   - Detailed error handling

   Node.js 18+
   Render Start Command: node server.js
========================================================= */

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API configuration
const API_VERSION = "v1beta";
const PREFERRED_MODEL =
    process.env.GEMINI_MODEL || "gemini-1.5-flash";

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
   FIND AVAILABLE GEMINI MODEL
========================================================= */

async function getGeminiModel() {

    const response = await fetch(
        `https://generativelanguage.googleapis.com/${API_VERSION}/models`,
        {
            method: "GET",
            headers: {
                "x-goog-api-key": GEMINI_API_KEY
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            "Model discovery failed: " +
            JSON.stringify(data)
        );
    }

    const models = (data.models || []).filter(model =>
        (model.supportedGenerationMethods || [])
            .includes("generateContent")
    );

    if (models.length === 0) {
        throw new Error(
            "No Gemini models support generateContent."
        );
    }

    // Preferred model
    const preferred = models.find(model =>
        model.name === `models/${PREFERRED_MODEL}`
    );

    if (preferred) {
        return preferred.name;
    }

    // Fallback to another available Flash model
    const flashModel = models.find(model =>
        model.name.toLowerCase().includes("flash")
    );

    if (flashModel) {
        return flashModel.name;
    }

    // Last fallback
    return models[0].name;
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

        const prompt = String(
            (req.body && req.body.prompt) || ""
        ).trim();

        const language =
            req.body && req.body.language === "bangla"
                ? "Bangla"
                : "English";

        if (!prompt) {
            return res.status(400).json({
                error: "Please enter a message."
            });
        }

        // Discover available model
        const model = await getGeminiModel();

        console.log("Selected Gemini model:", model);

        // Gemini API URL
        const url =
            `https://generativelanguage.googleapis.com/` +
            `${API_VERSION}/${model}:generateContent`;

        // Send request to Gemini
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
                            "You are Neloy AI, a friendly and helpful AI voice assistant. " +
                            "Answer clearly and accurately. " +
                            "Use plain text without unnecessary markdown. " +
                            "Always reply in " + language + "."
                    }]
                },

                contents: [{
                    role: "user",
                    parts: [{
                        text: prompt
                    }]
                }],

                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }

            })

        });

        const data = await geminiResponse.json();

        // API error handling
        if (!geminiResponse.ok) {

            console.error(
                "Gemini API Error:",
                JSON.stringify(data)
            );

            return res.status(502).json({
                error: "Gemini API request failed.",
                details:
                    data.error?.message ||
                    "Unknown Gemini API error."
            });
        }

        // Extract answer
        const answer =
            data.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!answer) {

            console.error(
                "Gemini returned no answer:",
                JSON.stringify(data)
            );

            return res.status(502).json({
                error: "Gemini did not return a text answer."
            });
        }

        // Successful response
        return res.json({
            success: true,
            answer: answer,
            model: model
        });

    } catch (error) {

        console.error(
            "Server Error:",
            error.message
        );

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
    console.log("--------------------------------");

});
