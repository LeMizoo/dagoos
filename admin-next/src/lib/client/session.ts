// ============================================================
// DAGOOS SESSION - CLIENT UNIQUEMENT
// ============================================================

const SESSION_STORAGE_KEY = 'dagoos_session_id';

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
