// lib/api.js
// Client API frontend : l'authentification est gérée par le cookie
// HTTP-only "dagoos_token" côté serveur Next.js.

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Les appels frontend passent par le proxy Next.js.
  // Le proxy lit le cookie HTTP-only dagoos_token et transmet
  // automatiquement le Bearer token à l'API backend.
  const proxyEndpoint = endpoint.startsWith('/api/proxy')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(proxyEndpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    console.warn('Session expirée');

    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      const path = window.location.pathname;

      if (path.startsWith('/fleet')) {
        window.location.href = '/fleet-login';
      } else if (path.startsWith('/coop')) {
        window.location.href = '/coop-login';
      } else {
        window.location.href = '/login';
      }
    }
  }

  return response;
};

export default apiFetch;
