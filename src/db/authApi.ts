import type { AuthUser } from '../types';
import { getSupabase } from './client';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export type UserWriteInput = {
  username: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleId: string;
  isActive: boolean;
  password?: string;
};

async function readApiError(res: Response, fallback: string): Promise<string> {
  const raw = await res.text().catch(() => '');
  try {
    const body = JSON.parse(raw) as { error?: unknown; detail?: unknown };
    if (typeof body.error === 'string' && body.error.trim()) {
      return typeof body.detail === 'string' && body.detail.trim()
        ? `${body.error} ${body.detail}`
        : body.error;
    }
  } catch {
    // non-JSON body from platform crash page
  }
  if (raw && raw.length < 240 && !raw.trimStart().startsWith('<')) {
    return `${fallback}: ${raw.trim()}`;
  }
  return `${fallback} (HTTP ${res.status}). Check Vercel function logs and env vars (SUPABASE_SERVICE_ROLE_KEY).`;
}

export async function createUserAccount(input: UserWriteInput): Promise<AuthUser> {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to create user'));
  const body = await res.json().catch(() => ({} as { user?: AuthUser }));
  if (!body.user) throw new Error('Failed to create user: empty response.');
  return body.user;
}

export async function updateUserAccount(id: string, input: UserWriteInput): Promise<AuthUser> {
  const res = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to update user'));
  const body = await res.json().catch(() => ({} as { user?: AuthUser }));
  if (!body.user) throw new Error('Failed to update user: empty response.');
  return body.user;
}

export async function deleteUserAccount(id: string): Promise<void> {
  const res = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(await readApiError(res, 'Failed to delete user'));
}
