import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const pathMapping: Record<string, string> = {
  '/finances/transactions': '/api/finances/transactions',
  '/finances/versements': '/api/finances/versements',
  '/finances/courses': '/api/finances/courses',
  '/finances/stats/summary': '/api/finances/stats/summary',
};

function resolveApiPath(
  proxyPath: string
): string {
  if (pathMapping[proxyPath]) {
    return pathMapping[proxyPath];
  }

  if (proxyPath.startsWith('/api/')) {
    return proxyPath;
  }

  return `/api${proxyPath}`;
}

export async function GET(
  req: NextRequest
) {
  return proxyRequest(req);
}

export async function POST(
  req: NextRequest
) {
  return proxyRequest(req);
}

export async function PUT(
  req: NextRequest
) {
  return proxyRequest(req);
}

export async function PATCH(
  req: NextRequest
) {
  return proxyRequest(req);
}

export async function DELETE(
  req: NextRequest
) {
  return proxyRequest(req);
}

async function proxyRequest(
  req: NextRequest
) {
  const proxyPath =
    req.nextUrl.pathname.replace(
      '/api/proxy',
      ''
    );

  const apiPath =
    resolveApiPath(proxyPath);

  const apiUrl =
    `${API_BASE_URL}${apiPath}${req.nextUrl.search}`;

  const cookieStore = cookies();

  const authSpace =
    req.headers.get('x-auth-space');

  let token: string | null = null;

  /*
   * Authentification exclusivement par cookie HttpOnly
   * selon l'espace métier courant.
   */
  if (authSpace === 'admin' || authSpace === 'dashboard') {
    token = cookieStore.get('dagoos_admin_token')?.value ?? null;
  } else if (authSpace === 'urbain') {
    token = cookieStore.get('dagoos_urbain_token')?.value ?? null;
  } else if (authSpace === 'interurbain') {
    token = cookieStore.get('dagoos_interurbain_token')?.value ?? null;
  }

  /*
   * Fallback cookies selon l'espace.
   */
  if (!token) {
    if (authSpace === 'admin' || authSpace === 'dashboard') {
      token = cookieStore.get('dagoos_admin_token')?.value ?? null;
    } else if (authSpace === 'fleet' || authSpace === 'flotte') {
      token = cookieStore.get('dagoos_urbain_token')?.value ?? null;
    } else if (authSpace === 'coop') {
      token = cookieStore.get('dagoos_interurbain_token')?.value ?? null;
    }
  }

  const authorization =
    token
      ? `Bearer ${token}`
      : null;

  console.log(
    `[Proxy] ${req.method} ${apiPath} ` +
      `${authorization ? '(auth)' : '(no auth)'}`
  );

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authorization) {
      headers.Authorization =
        authorization;
    }

    const contentType =
      req.headers.get(
        'content-type'
      );

    if (contentType) {
      headers['Content-Type'] =
        contentType;
    }

    const body =
      req.method !== 'GET' &&
      req.method !== 'HEAD'
        ? await req.text()
        : undefined;

    const upstream = await fetch(
      apiUrl,
      {
        method: req.method,
        headers,
        body,
        cache: 'no-store',
      }
    );

    const text =
      await upstream.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error:
          text ||
          'Réponse invalide',
      };
    }

    return NextResponse.json(
      data,
      {
        status:
          upstream.status,
      }
    );
  } catch (error) {
    console.error(
      '[Proxy] API indisponible:',
      error
    );

    return NextResponse.json(
      {
        error:
          'API indisponible',
      },
      {
        status: 502,
      }
    );
  }
}
