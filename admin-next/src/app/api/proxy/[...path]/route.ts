import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = 'https://dagoos-api.onrender.com';

// Mapping des chemins : admin-next → API Render réelle
const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/transactions',
  '/finances/versements': '/api/versements',
  '/finances/courses': '/api/courses',
};

function resolveApiPath(proxyPath: string): string {
  // Vérifier si un mapping existe
  if (pathMapping[proxyPath]) {
    return pathMapping[proxyPath];
  }
  // Comportement standard : /api/proxy/xxx → /api/xxx
  return `/api${proxyPath}`;
}

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  const proxyPath = req.nextUrl.pathname.replace('/api/proxy', '');
  const apiPath = resolveApiPath(proxyPath);
  const searchParams = req.nextUrl.search;
  const apiUrl = `${API_BASE}${apiPath}${searchParams}`;

  const cookieStore = cookies();
  const token = cookieStore.get('dagoos_token')?.value;

  console.log(`🔐 Proxy -> ${req.method} ${apiUrl} ${token ? '(avec token)' : '(sans token)'}`);

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (req.headers.get('content-type')) headers['Content-Type'] = req.headers.get('content-type')!;

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

    const res = await fetch(apiUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    console.error(`❌ Erreur proxy ${apiUrl}:`, e.message);
    return NextResponse.json({ error: 'API indisponible', details: e.message }, { status: 502 });
  }
}
