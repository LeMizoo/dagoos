// ============================================================
// API — Client HTTP TypeScript
// Phase 0 — Étape 0.13.1
// Adapté de apps/dagoos-mobile/js/api.js (P3)
// ============================================================

import type { ApiError, ApiOptions } from '../types/api';

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const API_URL: string =
  import.meta.env.VITE_API_URL || 'https://dagoos-api.onrender.com/api';

// ------------------------------------------------------------
// Constantes par défaut
// ------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

// ------------------------------------------------------------
// apiFetch — moteur HTTP
// ------------------------------------------------------------

async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = API_URL + endpoint;
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;

  // ----------------------------------------------------------
  // Politique de retry — sûre par défaut
  //
  // GET / HEAD      : retry automatique (lectures idempotentes).
  // POST/PUT/PATCH/DELETE : 1 seule tentative par défaut
  //   (créations / mutations : un retry peut rejouer une action
  //    déjà appliquée côté backend).
  //
  // Overrides explicites (toujours prioritaires) :
  //   retry: true  -> force le retry (appel réellement idempotent)
  //   retry: false -> force une seule tentative
  // ----------------------------------------------------------
  const method = (options.method ?? 'GET').toUpperCase();
  const isIdempotentMethod = method === 'GET' || method === 'HEAD';

  const maxAttempts =
    options.retry === true
      ? DEFAULT_RETRY_ATTEMPTS
      : options.retry === false
        ? 1
        : isIdempotentMethod
          ? DEFAULT_RETRY_ATTEMPTS
          : 1;

  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const config: RequestInit = {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      signal: controller.signal,
    };

    if (options.body !== undefined) {
      config.body =
        typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') ?? '';

      let data: unknown;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let message = 'Erreur HTTP ' + response.status;

        if (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
        ) {
          message = (data as { error: string }).error;
        }

        const apiError = new Error(message) as ApiError;
        apiError.status = response.status;
        apiError.data = data;
        apiError.endpoint = endpoint;

        throw apiError;
      }

      return data as T;
    } catch (err) {
      // Timeout (AbortError)
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < maxAttempts) {
          console.warn(
            'Timeout API (' +
              endpoint +
              ') après ' +
              Math.round(timeoutMs / 1000) +
              ' secondes. Nouvelle tentative...'
          );

          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, RETRY_DELAY_MS);
          });

          continue;
        }

        const timeoutError = new Error(
          'La requête API a expiré après ' +
            Math.round(timeoutMs / 1000) +
            ' secondes et une nouvelle tentative.'
        ) as ApiError;

        timeoutError.code = 'API_TIMEOUT';
        timeoutError.endpoint = endpoint;
        timeoutError.isTimeout = true;

        console.error('Timeout API définitif (' + endpoint + '):', timeoutError);

        throw timeoutError;
      }

      // Erreur déjà enrichie (HTTP)
      if (err instanceof Error && 'endpoint' in err) {
        throw err;
      }

      console.error('Erreur API (' + endpoint + '):', err);
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Ne devrait jamais arriver : la boucle retourne ou throw
  throw new Error('apiFetch : sortie inattendue de boucle');
}

// ------------------------------------------------------------
// API publique
// ------------------------------------------------------------

export async function apiGet<T>(
  endpoint: string,
  options?: ApiOptions
): Promise<T> {
  return apiFetch<T>(endpoint, options);
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  options?: ApiOptions
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'POST', body });
}

export async function apiGetSafe<T>(
  endpoint: string,
  fallback: T,
  options?: ApiOptions
): Promise<T> {
  try {
    return await apiGet<T>(endpoint, options);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      'isTimeout' in err &&
      (err as ApiError).isTimeout === true;

    const kind = isTimeout ? 'timeout' : 'erreur';

    console.warn(
      '[apiSafe] ' + endpoint + ' indisponible (' + kind + '):',
      err instanceof Error ? err.message : err
    );

    return fallback;
  }
}
