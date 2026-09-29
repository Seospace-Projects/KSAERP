import type { Express, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { initialUsers } from '../auth';
import { getAppUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from './env';
import { sendPublicError } from './http';
import { loginLimiter, passwordResetLimiter, signupLimiter } from './rateLimit';

function serviceClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function anonClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function requireUserManager(
  req: Request,
  res: Response,
): Promise<{ admin: SupabaseClient; userId: string; isSuperAdmin: boolean } | null> {
  const admin = serviceClient();
  if (!admin) {
    sendPublicError(res, 503, 'Service unavailable.');
    return null;
  }
  const token = bearer(req);
  if (!token) {
    sendPublicError(res, 401, 'Unauthorized.');
    return null;
  }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    sendPublicError(res, 401, 'Invalid session.');
    return null;
  }
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role_id, is_active')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.is_active === false) {
    sendPublicError(res, 403, 'Forbidden.');
    return null;
  }
  if (profile.role_id === 'super_admin') {
    return { admin, userId: data.user.id, isSuperAdmin: true };
  }
  const { data: role, error: roleError } = await admin
    .from('roles')
    .select('permissions')
    .eq('id', profile.role_id)
    .maybeSingle();
  const permissions = Array.isArray(role?.permissions) ? role.permissions as string[] : [];
  if (roleError || !permissions.includes('platform.users')) {
    sendPublicError(res, 403, 'Forbidden.');
    return null;
  }
  return { admin, userId: data.user.id, isSuperAdmin: false };
}

async function profileRoleId(admin: SupabaseClient, id: string): Promise<string | null> {
  const { data, error } = await admin
    .from('profiles')
    .select('role_id')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return typeof data.role_id === 'string' ? data.role_id : null;
}

async function resolveLoginEmail(admin: SupabaseClient, lookup: string): Promise<string | null> {
  const value = lookup.trim();
  if (!value) return null;
  if (value.includes('@')) return value.toLowerCase();

  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .eq('username', value.toLowerCase())
    .maybeSingle();
  if (!error && typeof data?.email === 'string' && data.email) return data.email;

  const seeded = initialUsers.find(
    user => user.username.toLowerCase() === value.toLowerCase()
      || user.email.toLowerCase() === value.toLowerCase(),
  );
  return seeded?.email || null;
}

function profileRow(id: string, body: Record<string, unknown>) {
  return {
    id,
    username: String(body.username || '').trim().toLowerCase(),
    email: String(body.email || '').trim(),
    name_en: String(body.nameEn || '').trim(),
    name_ar: String(body.nameAr || '').trim(),
    role_id: String(body.roleId || 'viewer'),
    is_active: body.isActive !== false,
  };
}

function toUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    roleId: row.role_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
}

export function registerAuthRoutes(app: Express): void {
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const admin = serviceClient();
    const anon = anonClient();
    if (!admin || !anon) {
      sendPublicError(res, 503, 'Service unavailable.');
      return;
    }
    const lookup = String(req.body?.lookup || req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!lookup || !password) {
      sendPublicError(res, 400, 'Username and password are required.');
      return;
    }
    try {
      const email = await resolveLoginEmail(admin, lookup);
      if (!email) {
        sendPublicError(res, 401, 'Invalid username or password.');
        return;
      }
      const { data, error } = await anon.auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) {
        sendPublicError(res, 401, 'Invalid username or password.', error, 'auth.login');
        return;
      }
      const { data: profile } = await admin
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!profile || profile.is_active === false) {
        sendPublicError(res, 403, 'This account is disabled.');
        return;
      }
      res.json({
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        },
      });
    } catch (err) {
      sendPublicError(res, 500, 'Sign-in failed.', err, 'auth.login');
    }
  });

  app.post('/api/auth/password-reset', passwordResetLimiter, async (req, res) => {
    const admin = serviceClient();
    const anon = anonClient();
    if (!admin || !anon) {
      sendPublicError(res, 503, 'Service unavailable.');
      return;
    }
    const lookup = String(req.body?.lookup || req.body?.username || '').trim();
    if (!lookup) {
      sendPublicError(res, 400, 'Username or email is required.');
      return;
    }
    try {
      const email = await resolveLoginEmail(admin, lookup);
      if (email) {
        await anon.auth.resetPasswordForEmail(email, { redirectTo: getAppUrl() });
      }
      res.json({ ok: true });
    } catch (err) {
      sendPublicError(res, 500, 'Request failed.', err, 'auth.password-reset');
    }
  });

  app.post('/api/auth/lookup-email', loginLimiter, async (req, res) => {
    const admin = serviceClient();
    if (!admin) {
      sendPublicError(res, 503, 'Service unavailable.');
      return;
    }
    const lookup = String(req.body?.lookup || '').trim();
    if (!lookup) {
      sendPublicError(res, 400, 'Lookup is required.');
      return;
    }
    try {
      const email = await resolveLoginEmail(admin, lookup);
      res.json({ email: email || null });
    } catch (err) {
      sendPublicError(res, 500, 'Lookup failed.', err, 'auth.lookup-email');
    }
  });

  app.post('/api/auth/users', signupLimiter, async (req, res) => {
    const ctx = await requireUserManager(req, res);
    if (!ctx) return;
    try {
      const body = req.body || {};
      const username = String(body.username || '').trim().toLowerCase();
      const email = String(body.email || '').trim() || `${username}@ksa-erp.sa`;
      const password = String(body.password || '');
      const roleId = String(body.roleId || body.role_id || 'viewer');
      if (!username || !body.nameEn) {
        sendPublicError(res, 400, 'Username and English name are required.');
        return;
      }
      if (!password) {
        sendPublicError(res, 400, 'Password is required.');
        return;
      }
      if (!ctx.isSuperAdmin && roleId === 'super_admin') {
        sendPublicError(res, 403, 'Only Super Admin can create Super Admin accounts.');
        return;
      }
      const created = await ctx.admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (created.error || !created.data.user) {
        sendPublicError(res, 400, 'Could not create user.', created.error, 'auth.createUser');
        return;
      }
      const row = profileRow(created.data.user.id, { ...body, username, email, roleId });
      const { data, error } = await ctx.admin.from('profiles').upsert({
        ...row,
        created_at: new Date().toISOString(),
      }).select('*').single();
      if (error) {
        await ctx.admin.auth.admin.deleteUser(created.data.user.id);
        sendPublicError(res, 400, 'Could not create user.', error, 'auth.createProfile');
        return;
      }
      res.json({ user: toUser(data as Record<string, unknown>) });
    } catch (err) {
      sendPublicError(res, 500, 'Could not create user.', err, 'auth.createUser');
    }
  });

  app.patch('/api/auth/users/:id', async (req, res) => {
    const ctx = await requireUserManager(req, res);
    if (!ctx) return;
    try {
      const id = req.params.id;
      const body = req.body || {};
      const targetRole = await profileRoleId(ctx.admin, id);
      if (!ctx.isSuperAdmin && targetRole === 'super_admin') {
        sendPublicError(res, 403, 'Super Admin accounts cannot be modified by other roles.');
        return;
      }
      const nextRoleId = body.roleId !== undefined || body.role_id !== undefined
        ? String(body.roleId || body.role_id || '')
        : null;
      if (!ctx.isSuperAdmin && nextRoleId === 'super_admin') {
        sendPublicError(res, 403, 'Only Super Admin can assign the Super Admin role.');
        return;
      }
      const row = profileRow(id, body);
      if (body.password) {
        const updated = await ctx.admin.auth.admin.updateUserById(id, {
          password: String(body.password),
          email: row.email,
        });
        if (updated.error) {
          sendPublicError(res, 400, 'Could not update user.', updated.error, 'auth.updatePassword');
          return;
        }
      } else if (row.email) {
        await ctx.admin.auth.admin.updateUserById(id, { email: row.email });
      }
      const { data, error } = await ctx.admin.from('profiles').update({
        username: row.username,
        email: row.email,
        name_en: row.name_en,
        name_ar: row.name_ar,
        role_id: row.role_id,
        is_active: row.is_active,
      }).eq('id', id).select('*').single();
      if (error) {
        sendPublicError(res, 400, 'Could not update user.', error, 'auth.updateProfile');
        return;
      }
      res.json({ user: toUser(data as Record<string, unknown>) });
    } catch (err) {
      sendPublicError(res, 500, 'Could not update user.', err, 'auth.updateUser');
    }
  });

  app.delete('/api/auth/users/:id', async (req, res) => {
    const ctx = await requireUserManager(req, res);
    if (!ctx) return;
    try {
      const id = req.params.id;
      if (id === ctx.userId) {
        sendPublicError(res, 400, 'You cannot delete your own account.');
        return;
      }
      const targetRole = await profileRoleId(ctx.admin, id);
      if (!ctx.isSuperAdmin && targetRole === 'super_admin') {
        sendPublicError(res, 403, 'Super Admin accounts cannot be deleted by other roles.');
        return;
      }
      const deleted = await ctx.admin.auth.admin.deleteUser(id);
      if (deleted.error) {
        sendPublicError(res, 400, 'Could not delete user.', deleted.error, 'auth.deleteUser');
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      sendPublicError(res, 500, 'Could not delete user.', err, 'auth.deleteUser');
    }
  });
}
