function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getPort(): number {
  const raw = trimEnv('PORT');
  const port = raw ? Number(raw) : 3000;
  return Number.isFinite(port) && port > 0 ? port : 3000;
}

export function getAppUrl(): string {
  return trimEnv('APP_URL') || `http://localhost:${getPort()}`;
}

export function getGeminiApiKey(): string | undefined {
  const key = trimEnv('GEMINI_API_KEY');
  if (!key || key.includes('YOUR_GEMINI')) return undefined;
  return key;
}

/** Project URL. Prefer SUPABASE_URL; VITE_SUPABASE_URL is the public client fallback. */
export function getSupabaseUrl(): string | undefined {
  const url = trimEnv('SUPABASE_URL') || trimEnv('VITE_SUPABASE_URL');
  if (!url || url.includes('YOUR_PROJECT')) return undefined;
  return url;
}

export function getSupabaseAnonKey(): string | undefined {
  const key = trimEnv('VITE_SUPABASE_ANON_KEY');
  if (!key || key.includes('YOUR_ANON')) return undefined;
  return key;
}

/** Service role key — server-only. Never read a VITE_ variant. */
export function getSupabaseServiceRoleKey(): string | undefined {
  const key = trimEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || key.includes('YOUR_SERVICE_ROLE')) return undefined;
  return key;
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function assertRequiredEnv(): void {
  // Used by local `server.ts` only. Vercel `api/index.ts` validates per-request (503).
  if (process.env.VERCEL) return;
  const missing: string[] = [];
  if (!getSupabaseUrl()) missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
  if (!getSupabaseAnonKey()) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!getSupabaseServiceRoleKey()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (isProduction() && !getGeminiApiKey()) missing.push('GEMINI_API_KEY');
  if (missing.length === 0) return;
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill in real values.`);
  process.exit(1);
}
