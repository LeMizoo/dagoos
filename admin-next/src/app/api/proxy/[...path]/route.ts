import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { getSessionToken } from '@/lib/session/registry';

const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/finances/transactions',
  '/finances/versements': '/api/finances/versements',
  '/finances/courses': '/api/finances/courses',
  '/finances/stats/summary': '/api/finances/stats/summary',
};

function resolveApiPath(proxyPath: string): string {
  if (pathMapping[proxyPath]) return pathMapping[proxyPath];
  if (proxyPath.startsWith('/api/')) return proxyPath;
  return `/api${proxyPath}`;
}

export async function GET(req: NextRequest) { return proxyRequest(req); }
export async function POST(req: NextRequest) { return proxyRequest(req); }
export async function PUT(req: NextRequest) { return proxyRequest(req); }
export async function PATCH(req: NextRequest) { return proxyRequest(req); }
export async function DELETE(req: NextRequest) { return proxyRequest(req); }

async function proxyRequest(req: NextRequest) {
  const proxyPath = req.nextUrl.pathname.replace('/api/proxy', '');
  const apiPath = resolveApiPath(proxyPath);
  const searchParams = req.nextUrl.search;
  const apiUrl = `${API_BASE_URL}${apiPath}${searchParams}`;

  const cookieStore = cookies();
  const authSpace = req.headers.get('x-auth-space');
  const sessionId = req.headers.get('x-session-id');

  let token: string | null = null;

  // Priorité 1 : session par onglet
  if (sessionId) {
    token = getSessionToken(sessionId);
  }

  // Priorité 2 : cookie correspondant à l'espace courant
  if (!token) {
    if (authSpace === 'admin' || authSpace === 'dashboard') {
      token = cookieStore.get('dagoos_admin_token')?.value ?? null;
    } else if (authSpace === 'fleet') {
      token = cookieStore.get('dagoos_fleet_token')?.value ?? null;
    } else if (authSpace === 'coop') {
      token = cookieStore.get('dagoos_coop_token')?.value ?? null;
    }
  }

  const authorization = token ? `Bearer ${token}` : null;

  console.log(
    `[Proxy] ${req.method} ${apiPath} ${authorization ? '(auth)' : '(no auth)'}${sessionId ? ` [session:${sessionId.slice(0, 8)}]` : ''}`
  );

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (authorization) headers.Authorization = authorization;

    const contentType = req.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

    const upstream = await fetch(apiUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { error: text || 'Réponse invalide' }; }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error('[Proxy] API indisponible:', error);
    return NextResponse.json({ error: 'API indisponible' }, { status: 502 });
  }
}
