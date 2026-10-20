/**
 * Committed Vercel Serverless entry (must exist in git for `functions` matching).
 * Loads the esbuild bundle produced by `npm run build:api` during Vercel buildCommand.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

type ExpressApp = (req: IncomingMessage, res: ServerResponse) => unknown;

let cached: ExpressApp | null = null;

async function loadApp(): Promise<ExpressApp> {
  if (cached) return cached;
  const mod = await import('./handler.mjs');
  const app = (mod as { default?: ExpressApp }).default;
  if (typeof app !== 'function') {
    throw new Error('API handler bundle did not export an Express app.');
  }
  cached = app;
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'API handler failed to load.';
    console.error(JSON.stringify({ context: 'vercel.api.index', error: message }));
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        error: 'API failed to start.',
        detail: message,
        hint: 'Ensure Vercel build runs `node scripts/build-api.mjs` and SUPABASE_SERVICE_ROLE_KEY is set.',
      }));
    }
  }
}
