// src/lib/api.ts - Configuration API avec proxy Next.js

const API_BASE = '';

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = `${API_BASE}/api${endpoint}`;
  console.log('🔧 API Fetch:', url);

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    console.warn('🔄 Session expirée');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
};

export default apiFetch;
