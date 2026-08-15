/**
 * Configuration centralisée Admin-Next
 *
 * API_BASE_URL est utilisé uniquement côté serveur.
 * Le frontend passe par les routes Next.js /api.
 */

export const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:5001';

export const PROXY_PATH = '/api/proxy';

export const isProduction = process.env.NODE_ENV === 'production';

export const isDevelopment = process.env.NODE_ENV === 'development';
