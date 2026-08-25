// ============================================================
// DAGOOS SESSION REGISTRY
// Permet de stocker les tokens par sessionId (onglet)
// ============================================================

import { randomUUID } from 'crypto';

const sessionTokens = new Map<string, string>();

export function createSession(
  token: string
): string {
  const sessionId = randomUUID();
  sessionTokens.set(sessionId, token);
  return sessionId;
}

export function registerSession(
  sessionId: string,
  token: string
): void {
  sessionTokens.set(sessionId, token);
}

export function getSessionToken(
  sessionId: string
): string | null {
  return sessionTokens.get(sessionId) || null;
}

export function deleteSession(
  sessionId: string
): void {
  sessionTokens.delete(sessionId);
}
