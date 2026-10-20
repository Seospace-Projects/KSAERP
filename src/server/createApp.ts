import express, { type Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import { registerAuthRoutes } from './authRoutes';
import { registerSchemaRoutes } from './schemaRoutes';
import { getGeminiApiKey } from './env';
import { correlationId, sendPublicError } from './http';
import { applySecurityMiddleware } from './security';

/**
 * API-only Express app shared by local `server.ts` and Vercel `api/index.ts`.
 * Does not serve Vite/static assets (Vercel CDN / local Vite middleware handle that).
 */
export function createApiApp(): Express {
  const app = express();

  applySecurityMiddleware(app);
  app.use(correlationId);
  app.use(express.json({ limit: '12mb' }));

  registerAuthRoutes(app);
  registerSchemaRoutes(app);

  const apiKey = getGeminiApiKey();
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'ksa-erp' } },
      })
    : null;

  app.post('/api/translate', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || String(text).trim() === '') {
        res.json({ translatedText: '' });
        return;
      }
      if (!ai) {
        sendPublicError(res, 503, 'Translation is unavailable.');
        return;
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Translate the following English product name/detail into a professional, concise Arabic accounting item description suitable for invoices in Saudi Arabia. ONLY return the Arabic translation text itself, with no comments, explanations, formatting, or English letters.\n\nEnglish product name: "${text}"`,
      });
      res.json({ translatedText: response.text?.trim() || '' });
    } catch (error: unknown) {
      sendPublicError(res, 500, 'Translation failed.', error, 'translate');
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof SyntaxError) {
      sendPublicError(res, 400, 'Invalid request.', err, 'json-parse');
      return;
    }
    sendPublicError(res, 500, 'Request failed.', err, 'unhandled');
  });

  return app;
}
