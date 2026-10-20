/**
 * Vercel serverless entry — exposes Express auth/schema/translate routes.
 * Local dev still uses `server.ts` (Express + Vite middleware).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiApp } from '../src/server/createApp';

const app = createApiApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Serverless handler failed.';
    console.error(JSON.stringify({ context: 'vercel.api', error: message }));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Request failed.', detail: message });
    }
  }
}
