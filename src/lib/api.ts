export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

const SESSION_STORAGE_KEY = 'dagoos_session_id';

function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionId(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const proxyEndpoint = normalizedEndpoint.startsWith('/api/')
    ? normalizedEndpoint.substring(4)
    : normalizedEndpoint;

  const url = `/api/proxy${proxyEndpoint}`;

  const headers = new Headers(options.headers);

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;

    if (
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/')
    ) {
      headers.set('x-auth-space', 'admin');
    } else if (
      pathname === '/flotte' ||
      pathname.startsWith('/flotte/')
    ) {
      headers.set('x-auth-space', 'fleet');
    } else if (
      pathname === '/fleet' ||
      pathname.startsWith('/fleet/')
    ) {
      headers.set('x-auth-space', 'fleet');
    } else if (
      pathname === '/coop' ||
      pathname.startsWith('/coop/')
    ) {
      headers.set('x-auth-space', 'coop');
    }

    const sessionId = getSessionId();

    if (sessionId) {
      headers.set('x-session-id', sessionId);
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
    !window.location.pathname.endsWith('/flotte-login') &&
    !window.location.pathname.endsWith('/fleet-login') &&
    !window.location.pathname.endsWith('/coop-login') &&
    !window.location.pathname.endsWith('/register') &&
    window.location.pathname !== '/'
  ) {
    clearSessionId();

    const pathname = window.location.pathname;
    let loginPath = '/login';

    if (pathname.startsWith('/flotte')) {
      loginPath = '/flotte-login';
    } else if (pathname.startsWith('/fleet')) {
      loginPath = '/fleet-login';
    } else if (pathname.startsWith('/coop')) {
      loginPath = '/coop-login';
    }

    const redirect = encodeURIComponent(
      `${pathname}${window.location.search}`
    );

    window.location.href =
      `${loginPath}?redirect=${redirect}`;
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
