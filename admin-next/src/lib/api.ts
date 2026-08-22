export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `/api/proxy${normalizedEndpoint}`;

  const headers = new Headers(options.headers);

  // Ajouter le token localStorage comme fallback au cookie
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('dagoos_token');
    if (localToken && !headers.has('Authorization')) {
      headers.set('Authorization', 'Bearer ' + localToken);
    }
  }

  if (
    options.body &&
    !headers.has('Content-Type') &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: options.cache ?? 'no-store',
  });

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.endsWith('/login') &&
    !window.location.pathname.endsWith('/fleet-login') &&
    !window.location.pathname.endsWith('/coop-login') &&
    !window.location.pathname.endsWith('/register') &&
    !window.location.pathname.startsWith('/coop/') &&
    !window.location.pathname.startsWith('/fleet/') &&
    window.location.pathname !== '/'
  ) {
    const pathname = window.location.pathname;

    let loginPath = '/login';

    if (pathname.startsWith('/fleet')) {
      loginPath = '/fleet-login';
    } else if (pathname.startsWith('/coop')) {
      loginPath = '/coop-login';
    }

    const redirect = encodeURIComponent(
      `${pathname}${window.location.search}`
    );

    window.location.href = `${loginPath}?redirect=${redirect}`;
  }

  return response;
}

export async function apiJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(endpoint, options);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData =
      data && typeof data === 'object'
        ? (data as ApiError)
        : {};

    throw new Error(
      errorData.error ||
        errorData.message ||
        `Erreur API (${response.status})`
    );
  }

  return data as T;
}

export default apiFetch;
