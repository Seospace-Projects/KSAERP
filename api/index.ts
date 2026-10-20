/**
 * Vercel serverless entry — exposes Express auth/schema/translate routes.
 * Local dev still uses `server.ts` (Express + Vite middleware).
 */
import { createApiApp } from '../src/server/createApp';

const app = createApiApp();
export default app;
