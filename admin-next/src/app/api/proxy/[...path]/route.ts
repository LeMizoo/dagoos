import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/finances/transactions',
  '/finances/versements': '/api/finances/versements',
  '/finances/courses': '/api/finances/courses',
  '/finances/stats/summary': '/api/finances/stats/summary',
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

  const apiUrl = `${API_BASE_URL}${apiPath}${searchParams}`;

  const cookieStore = cookies();
  
  // Déterminer l'espace à partir du chemin de la requête
  const requestPath = req.nextUrl.pathname.replace('/api/proxy', '');
  const isFleetPath = requestPath.startsWith('/fleet') || requestPath.includes('/fleet');
  const isCoopPath = requestPath.startsWith('/coop') || requestPath.includes('/coop');
  const isDashboardPath = requestPath.startsWith('/dashboard') || requestPath.includes('/dashboard');
  
  // L'espace peut être explicitement indiqué par le frontend
  const authSpace = req.headers.get('x-auth-space');
  
  // Sélectionner le cookie selon l'espace
  let cookieToken = null;
  
  if (authSpace === 'fleet' || isFleetPath) {
    cookieToken = cookieStore.get('dagoos_fleet_token')?.value;
  } else if (authSpace === 'coop' || isCoopPath) {
    cookieToken = cookieStore.get('dagoos_coop_token')?.value;
  } else if (authSpace === 'admin' || isDashboardPath) {
    cookieToken = cookieStore.get('dagoos_token')?.value;
  } else {
    // Fallback : utiliser le premier cookie disponible
    cookieToken = 
      cookieStore.get('dagoos_fleet_token')?.value ||
      cookieStore.get('dagoos_coop_token')?.value ||
      cookieStore.get('dagoos_token')?.value;
  }

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
