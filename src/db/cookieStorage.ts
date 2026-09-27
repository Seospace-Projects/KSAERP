/**
 * Cookie-backed storage for the Supabase Auth session.
 * ERP business data never uses this (or localStorage).
 */

const CHUNK = 1800;

let persistAcrossSessions = true;

export function setPersistAcrossSessions(value: boolean): void {
  persistAcrossSessions = value;
}

function cookieAttrs(): string {
  const base = 'Path=/; SameSite=Lax';
  return persistAcrossSessions ? `${base}; Max-Age=${60 * 60 * 24 * 30}` : base;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const hit = document.cookie.split('; ').find(part => part.startsWith(prefix));
  if (!hit) return null;
  try {
    return decodeURIComponent(hit.slice(prefix.length));
  } catch {
    return hit.slice(prefix.length);
  }
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieAttrs()}`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; SameSite=Lax; Max-Age=0`;
}

function metaKey(key: string): string {
  return `${key}__n`;
}

function chunkKey(key: string, index: number): string {
  return `${key}__${index}`;
}

export const cookieStorage = {
  getItem(key: string): string | null {
    const countRaw = readCookie(metaKey(key));
    if (!countRaw) return readCookie(key);
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count < 1) return null;
    let out = '';
    for (let i = 0; i < count; i += 1) {
      out += readCookie(chunkKey(key, i)) ?? '';
    }
    return out || null;
  },
  setItem(key: string, value: string): void {
    const existing = Number(readCookie(metaKey(key)) || '0');
    for (let i = 0; i < existing; i += 1) clearCookie(chunkKey(key, i));
    clearCookie(metaKey(key));
    clearCookie(key);
    if (value.length <= CHUNK) {
      writeCookie(key, value);
      return;
    }
    const parts = Math.ceil(value.length / CHUNK);
    writeCookie(metaKey(key), String(parts));
    for (let i = 0; i < parts; i += 1) {
      writeCookie(chunkKey(key, i), value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },
  removeItem(key: string): void {
    const existing = Number(readCookie(metaKey(key)) || '0');
    for (let i = 0; i < existing; i += 1) clearCookie(chunkKey(key, i));
    clearCookie(metaKey(key));
    clearCookie(key);
  },
};
