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
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return `${fallback} (HTTP ${res.status}). Is the app server running?`;
  }
  const body = await res.json().catch(() => ({} as { error?: unknown }));
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return `${fallback} (HTTP ${res.status}).`;
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
