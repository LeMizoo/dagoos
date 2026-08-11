export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('/api')
    ? endpoint
    : `/api/proxy${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.includes('/login')
  ) {
    window.location.href = '/login';
  }

  return response;
};

export default apiFetch;
