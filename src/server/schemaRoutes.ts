import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateSchemaSql } from '../db/generateSql';
import { recheckAppSchema } from '../db/recheckSchema';
import { getSupabaseServiceRoleKey, getSupabaseUrl, isProduction } from './env';
import { sendPublicError } from './http';

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function requireSuperAdmin(req: Request, res: Response): Promise<boolean> {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    sendPublicError(res, 503, 'Service unavailable.');
    return false;
  }
  const token = bearer(req);
  if (!token) {
    sendPublicError(res, 401, 'Unauthorized.');
    return false;
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    sendPublicError(res, 401, 'Invalid session.');
    return false;
  }
  const { data: profile } = await admin
    .from('profiles')
    .select('role_id, is_active')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile || profile.role_id !== 'super_admin' || profile.is_active === false) {
    sendPublicError(res, 403, 'Forbidden.');
    return false;
  }
  return true;
}

export function registerSchemaRoutes(app: Express): void {
  app.get('/api/schema', async (req, res) => {
    if (!(await requireSuperAdmin(req, res))) return;
    res.json({ sql: generateSchemaSql() });
  });

  app.post('/api/schema/recheck', async (req, res) => {
    if (!(await requireSuperAdmin(req, res))) return;
    try {
      const result = recheckAppSchema(process.cwd(), { persist: !isProduction() });
      res.json(result);
    } catch (err) {
      sendPublicError(res, 500, 'Schema recheck failed.', err, 'schema.recheck');
    }
  });
}
