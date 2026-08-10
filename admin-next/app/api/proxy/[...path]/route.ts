import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = (process.env.API_BASE_URL || 'https://dagoos-api.onrender.com').replace(/\/$/, '');

const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/transactions',
  '/finances/versements': '/api/versements',
  '/finances/courses': '/api/courses',
};

function resolveApiPath(proxyPath: string): string {
  if (pathMapping[proxyPath]) return pathMapping[proxyPath];
  return `/api${proxyPath}`;
}

export async function GET(req: NextRequest) { return proxyRequest(req); }
export async function POST(req: NextRequest) { return proxyRequest(req); }
export async function PUT(req: NextRequest) { return proxyRequest(req); }
export async function DELETE(req: NextRequest) { return proxyRequest(req); }

async function proxyRequest(req: NextRequest) {
  const proxyPath = req.nextUrl.pathname.replace('/api/proxy', '');
  const apiPath = resolveApiPath(proxyPath);
  const searchParams = req.nextUrl.search;
  const apiUrl = `${API_BASE}${apiPath}${searchParams}`;

  // Récupérer le token depuis le header Authorization (driver) ou le cookie (admin/fleet/coop)
  const authHeader = req.headers.get('Authorization');
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('dagoos_token')?.value;
  // A cookie is refreshed at login, whereas local-storage tokens may be stale.
  const token = cookieToken || authHeader?.replace('Bearer ', '');

  console.log(`🔐 Proxy -> ${req.method} ${apiUrl} ${token ? '(avec token)' : '(sans token)'}`);

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (req.headers.get('content-type')) headers['Content-Type'] = req.headers.get('content-type')!;

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

    const res = await fetch(apiUrl, { method: req.method, headers, body, cache: 'no-store' });
    const data = await res.json().catch(() => ({ error: 'Réponse API invalide' }));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    console.error(`❌ Erreur proxy ${apiUrl}:`, e.message);
    return NextResponse.json({ error: 'API indisponible', details: e.message }, { status: 502 });
  }
}
