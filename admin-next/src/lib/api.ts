// src/lib/api.ts - Configuration API avec proxy Next.js

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter le token du localStorage ou cookie
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('dagoos_token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
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
