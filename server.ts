import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization function for Google GenAI client to avoid crashes if API key is missing during startup
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not defined. Please add it via Settings > Secrets in the AI Studio UI to enable the chatbot."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Check config status
app.get("/api/config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Stream Gemini Chat completion using Server-Sent Events (SSE)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, temperature, systemInstruction, thinkingLevel } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Bad Request: 'messages' must be a valid array." });
    }

    const ai = getGeminiClient();

    // Map the incoming client message format to the SDK's Content structure
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const config: any = {};
    if (systemInstruction && systemInstruction.trim() !== "") {
      config.systemInstruction = systemInstruction.trim();
    }
    if (typeof temperature === "number") {
      config.temperature = temperature;
    }
    if (thinkingLevel) {
      config.thinkingConfig = { thinkingLevel };
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Gemini API stream failure:", error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message || "Failed to communicate with Gemini." });
    }
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
