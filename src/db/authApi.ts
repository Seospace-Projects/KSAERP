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

export async function createUserAccount(input: UserWriteInput): Promise<AuthUser> {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Failed to create user.');
  return body.user as AuthUser;
}

export async function updateUserAccount(id: string, input: UserWriteInput): Promise<AuthUser> {
  const res = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Failed to update user.');
  return body.user as AuthUser;
}

export async function deleteUserAccount(id: string): Promise<void> {
  const res = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Failed to delete user.');
}
