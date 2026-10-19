/** Single-device session fingerprint stored after a successful login. */

const STORAGE_KEY = 'ksa-erp-active-session';

export function storeActiveSessionId(sessionId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, sessionId);
    localStorage.setItem(STORAGE_KEY, sessionId);
  } catch {
    // Storage may be unavailable in private mode.
  }
}

export function readActiveSessionId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearActiveSessionId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function remoteSessionIdFromUser(user: {
  app_metadata?: Record<string, unknown> | null;
} | null | undefined): string | null {
  const raw = user?.app_metadata?.active_session_id;
  return typeof raw === 'string' && raw ? raw : null;
}
