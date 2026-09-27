import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { registerAuthRoutes } from "./src/server/authRoutes";
import { registerSchemaRoutes } from "./src/server/schemaRoutes";
import {
  assertRequiredEnv,
  getGeminiApiKey,
  getPort,
  isProduction,
} from "./src/server/env";
import { correlationId, sendPublicError } from "./src/server/http";
import { applySecurityMiddleware } from "./src/server/security";

dotenv.config();
assertRequiredEnv();

async function startServer() {
  const app = express();
  const PORT = getPort();
  const production = isProduction();

  applySecurityMiddleware(app);
  app.use(correlationId);
  app.use(express.json({ limit: "12mb" }));

  registerAuthRoutes(app);
  registerSchemaRoutes(app);

  const apiKey = getGeminiApiKey();
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "ksa-erp",
        },
      },
    });
  }

  app.post("/api/translate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || String(text).trim() === "") {
        return res.json({ translatedText: "" });
      }

      if (!ai) {
        return sendPublicError(res, 503, "Translation is unavailable.");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following English product name/detail into a professional, concise Arabic accounting item description suitable for invoices in Saudi Arabia. ONLY return the Arabic translation text itself, with no comments, explanations, formatting, or English letters.\n\nEnglish product name: "${text}"`,
      });

      const translated = response.text?.trim() || "";
      res.json({ translatedText: translated });
    } catch (error: unknown) {
      sendPublicError(res, 500, "Translation failed.", error, "translate");
    }
  });

  if (!production) {
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

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof SyntaxError) {
      sendPublicError(res, 400, "Invalid request.", err, "json-parse");
      return;
    }
    sendPublicError(res, 500, "Request failed.", err, "unhandled");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
