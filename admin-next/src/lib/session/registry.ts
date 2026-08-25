// ============================================================
// DAGOOS SESSION REGISTRY - POSTGRES (persistant)
// ============================================================

import { randomUUID } from 'crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * On utilise fetch vers l'API backend pour persister les sessions.
 * Cela évite d'importer Prisma côté Next.js.
 */
export async function createSession(
  token: string
): Promise<string> {
  const sessionId = randomUUID();

  await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        token,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      }),
    }
  );

  return sessionId;
}

export async function registerSession(
  sessionId: string,
  token: string
): Promise<void> {
  await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        token,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      }),
    }
  );
}

export async function getSessionToken(
  sessionId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions/${sessionId}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export async function deleteSession(
  sessionId: string
): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sessions/${sessionId}`,
      { method: 'DELETE' }
    );
  } catch {}
}
