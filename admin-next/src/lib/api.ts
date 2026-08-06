// src/lib/api.ts - Configuration API avec token
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://dagoos-api.onrender.com';

console.log('🔧 API_BASE:', API_BASE);

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('dagoos_token');
    if (token) return token;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') return value;
    }
  }
  return null;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const url = `${API_BASE}${endpoint}`;
  console.log('🌐 Fetching:', url);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    console.warn('🔄 Token expiré');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
};

export default apiFetch;
