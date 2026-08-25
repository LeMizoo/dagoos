export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

function getAuthSpace(pathname: string): string | null {
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/')
  ) {
    return 'admin';
  }

  if (pathname === '/flotte/urbain' || pathname.startsWith('/flotte/urbain/')) {
    return 'urbain';
  }

  if (pathname === '/flotte/interurbain' || pathname.startsWith('/flotte/interurbain/')) {
    return 'interurbain';
  }

  // Pages communes : /flotte/chauffeurs, /flotte/vehicules, etc.
  if (pathname === '/flotte' || pathname.startsWith('/flotte/')) {
    return 'flotte';
  }

  return null;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const proxyEndpoint =
    normalizedEndpoint.startsWith('/api/')
      ? normalizedEndpoint.substring(4)
      : normalizedEndpoint;

  const url = `/api/proxy${proxyEndpoint}`;

  const headers = new Headers(options.headers);

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const authSpace = getAuthSpace(pathname);

    if (authSpace) {
      headers.set('x-auth-space', authSpace);
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
    !window.location.pathname.endsWith('/urbain-login') &&
    !window.location.pathname.endsWith('/interurbain-login') &&
    !window.location.pathname.endsWith('/fleet-login') &&
    !window.location.pathname.endsWith('/coop-login') &&
    !window.location.pathname.endsWith('/register') &&
    window.location.pathname !== '/'
  ) {
    const pathname = window.location.pathname;

    let loginPath = '/login';

    if (pathname.startsWith('/flotte/urbain')) {
      loginPath = '/urbain-login';
    } else if (pathname.startsWith('/flotte/interurbain')) {
      loginPath = '/interurbain-login';
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
  const response = await apiFetch(
    endpoint,
    options
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const errorData =
      data &&
      typeof data === 'object'
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
