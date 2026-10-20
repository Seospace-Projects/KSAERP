<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KSA Accounting ERP

Bilingual (English/Arabic) Saudi VAT and ZATCA-oriented cloud accounting ERP.

View in AI Studio: https://ai.studio/apps/1ab5e18a-58ca-43e1-ae04-6ec383cae071

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in real values (never commit `.env`)
3. Apply `supabase/schema.sql` in the Supabase SQL Editor (enables RLS on every table)
4. Seed Auth users: `npm run seed:auth`
5. Start the app: `npm run dev`

## Deploy on Vercel

The frontend is Vite static assets; `/api/*` is served by the Express app in `api/index.ts`.

1. Import the GitHub repo in Vercel (Vite preset / `vercel.json` is already configured).
2. In **Project → Settings → Environment Variables**, set at least:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same as project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (**required** for user create/login API)
   - `APP_URL` = your Vercel URL, e.g. `https://your-app.vercel.app`
   - `GEMINI_API_KEY` (optional locally; needed for `/api/translate`)
3. Redeploy. Confirm `GET /api/health` returns JSON like `{ "ok": true, "hasServiceRole": true }`.
4. Build runs `npm run build:api`, which writes `api/handler.mjs`. The committed entry is `api/index.ts`.

## Environment variables

| Variable | Where it is used | Public? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser Supabase client | Yes (project URL) |
| `VITE_SUPABASE_ANON_KEY` | Browser Supabase client | Yes, **only because RLS is enabled** |
| `SUPABASE_URL` | Server (preferred URL) | Not a secret; do not prefix with `VITE_` if you want it server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Express auth/schema routes + seed script | **No — server only** |
| `GEMINI_API_KEY` | `/api/translate` on the server | **No — server only** |
| `SEED_PASSWORD_*` | `npm run seed:auth` | **No — server only** |
| `APP_URL` | CORS allowlist + password-reset redirect | Yes |
| `PORT` | Server listen port | Yes |

This app uses Vite. Any `VITE_` variable is inlined into the browser bundle (same exposure as `NEXT_PUBLIC_` / `REACT_APP_`). Never put the service role key, Gemini key, or seed passwords on a `VITE_` name.

## Secret rotation warning

If any secret was previously hardcoded in source, comments, or an old `.env` that was committed, **that old value is still recoverable from git history** (and from any clone or backup of those files). Rotate immediately before deploying:

- Supabase **anon** and **service role** keys (Project Settings → API → rotate)
- Gemini API key
- Every `SEED_PASSWORD_*` value, then update the matching Auth users in Supabase (or recreate them)
- Any other third-party key that ever appeared in the repo

Do not consider a key safe just because it was later moved to an environment variable. Rotate the leaked value, then use the new value only in `.env` / the host’s secret store.
