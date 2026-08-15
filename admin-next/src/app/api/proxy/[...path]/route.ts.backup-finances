import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = (
  process.env.API_BASE_URL ||
  'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/transactions',
  '/finances/versements': '/api/versements',
  '/finances/courses': '/api/courses',
};

function resolveApiPath(proxyPath: string): string {
  if (pathMapping[proxyPath]) {
    return pathMapping[proxyPath];
  }

  if (proxyPath.startsWith('/api/')) {
    return proxyPath;
  }

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

export async function PATCH(req: NextRequest) {
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
  const cookieToken = cookieStore.get('dagoos_token')?.value;

  const authorization =
    req.headers.get('authorization') ||
    (cookieToken ? `Bearer ${cookieToken}` : null);

  console.log(
    `[Proxy] ${req.method} ${apiPath} ${
      authorization ? '(auth)' : '(no auth)'
    }`
  );

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    const contentType = req.headers.get('content-type');

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const body =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined;

    const upstream = await fetch(apiUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Réponse invalide du serveur API',
      };
    }

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error('[Proxy] API indisponible:', error);

    return NextResponse.json(
      {
        error: 'API indisponible',
      },
      {
        status: 502,
      }
    );
  }
}
