import express, { type Express } from 'express';
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

  app.post('/api/translate', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || String(text).trim() === '') {
        res.json({ translatedText: '' });
        return;
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        sendPublicError(res, 503, 'Translation is unavailable.');
        return;
      }
      // Lazy-load so cold starts / missing Gemini key never crash auth routes
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'ksa-erp' } },
      });
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
    res.json({
      ok: true,
      vercel: Boolean(process.env.VERCEL),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    });
  });

  // Unmatched API routes → JSON 404 (not Express HTML)
  app.use('/api', (_req, res) => {
    sendPublicError(res, 404, 'API route not found.');
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
