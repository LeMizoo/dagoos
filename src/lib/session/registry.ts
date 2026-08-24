type SessionEntry = {
  token: string;
  createdAt: number;
  expiresAt: number;
};

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const globalForSessions = globalThis as typeof globalThis & {
  __dagoosSessionRegistry?: Map<string, SessionEntry>;
};

const registry =
  globalForSessions.__dagoosSessionRegistry ??
  new Map<string, SessionEntry>();

if (!globalForSessions.__dagoosSessionRegistry) {
  globalForSessions.__dagoosSessionRegistry = registry;
}

function cleanupExpired() {
  const now = Date.now();

  for (const [sessionId, session] of registry.entries()) {
    if (session.expiresAt <= now) {
      registry.delete(sessionId);
    }
  }
}

export function createSession(token: string): string {
  cleanupExpired();

  const sessionId = crypto.randomUUID();
  const now = Date.now();

  registry.set(sessionId, {
    token,
    createdAt: now,
    expiresAt: now + SESSION_TTL,
  });

  return sessionId;
}

export function getSessionToken(sessionId: string): string | null {
  cleanupExpired();

  const session = registry.get(sessionId);

  if (!session) {
    return null;
  }

  return session.token;
}

export function deleteSession(sessionId: string): void {
  registry.delete(sessionId);
}

export function hasSession(sessionId: string): boolean {
  return getSessionToken(sessionId) !== null;
}
