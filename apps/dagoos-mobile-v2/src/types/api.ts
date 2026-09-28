// ============================================================
// API — Types TypeScript
// Phase 0 — Étape 0.13.1
// ============================================================

/**
 * Erreur API enrichie.
 * Porte le contexte de l'échec (status HTTP, données, endpoint, timeout).
 */
export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  endpoint: string;
  code?: string;
  isTimeout?: boolean;
}

/**
 * Options passées à apiFetch.
 */
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  timeout?: number;
  retry?: boolean;
}
