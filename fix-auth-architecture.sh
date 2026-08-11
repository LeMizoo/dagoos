#!/usr/bin/env bash
set -e

ROOT="/d/Dagoos"
NEXT="$ROOT/admin-next"
API="$ROOT/apps/api"

echo "=========================================="
echo " DAGOOS - CORRECTION ARCHITECTURE AUTH"
echo "=========================================="
echo

echo "[1/6] Vérification des dossiers..."

if [ ! -d "$NEXT" ]; then
  echo "ERREUR: $NEXT introuvable"
  exit 1
fi

if [ ! -d "$API" ]; then
  echo "ERREUR: $API introuvable"
  exit 1
fi

echo "OK"
echo

echo "[2/6] Création de la sauvegarde..."

BACKUP="$ROOT/backup-auth-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"

mkdir -p "$BACKUP/admin-next/src/app/api/auth"
mkdir -p "$BACKUP/admin-next/src/app/api"
mkdir -p "$BACKUP/admin-next/src/lib"

cp -f "$NEXT/src/lib/api.ts" \
  "$BACKUP/admin-next/src/lib/api.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/auth/_login.ts" \
  "$BACKUP/admin-next/src/app/api/auth/_login.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/auth/me/route.ts" \
  "$BACKUP/admin-next/src/app/api/auth/me-route.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/auth/driver-login/route.ts" \
  "$BACKUP/admin-next/src/app/api/auth/driver-login-route.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/proxy/[...path]/route.ts" \
  "$BACKUP/admin-next/src/app/api/proxy-route.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/vehicles/route.ts" \
  "$BACKUP/admin-next/src/app/api/vehicles-route.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/drivers/route.ts" \
  "$BACKUP/admin-next/src/app/api/drivers-route.ts" 2>/dev/null || true

cp -f "$NEXT/src/app/api/organizations/route.ts" \
  "$BACKUP/admin-next/src/app/api/organizations-route.ts" 2>/dev/null || true

echo "Sauvegarde : $BACKUP"
echo

echo "[3/6] Correction de la configuration API..."

cat > "$NEXT/src/lib/api.ts" <<'FILE'
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('/api')
    ? endpoint
    : `/api/proxy${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.includes('/login')
  ) {
    window.location.href = '/login';
  }

  return response;
};

export default apiFetch;
FILE

echo "OK"
echo

echo "[4/6] Correction du proxy Next..."

cat > "$NEXT/src/app/api/proxy/[...path]/route.ts" <<'FILE'
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
FILE

echo "OK"
echo

echo "[5/6] Correction de /auth/me..."

cat > "$NEXT/src/app/api/auth/me/route.ts" <<'FILE'
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = (
  process.env.API_BASE_URL ||
  'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE}/api/auth/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: 'Réponse invalide du serveur API',
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[auth/me]', error);

    return NextResponse.json(
      {
        error: "Service d'authentification indisponible",
      },
      { status: 502 }
    );
  }
}
FILE

echo "OK"
echo

echo "[6/6] Vérification des logins administrateur codés en dur..."

echo
echo "Occurrences de admin@dagoos.mg :"
grep -RFn "admin@dagoos.mg" \
  "$NEXT/src/app/api" \
  "$NEXT/src/lib" \
  2>/dev/null || true

echo
echo "Occurrences de URLs Markdown incorrectes :"
grep -RFn "\[https://dagoos-api.onrender.com\]" \
  "$NEXT/src" \
  2>/dev/null || true

echo
echo "=========================================="
echo " CORRECTION PARTIELLE TERMINÉE"
echo "=========================================="
echo
echo "Sauvegarde : $BACKUP"
echo
echo "IMPORTANT : les routes vehicles/drivers/organizations"
echo "ne seront PAS encore remplacées automatiquement."
echo "Elles nécessitent une vérification des permissions backend"
echo "afin de ne pas casser les rôles ADMIN/FLEET/COOP."
echo
echo "Lancement de la vérification TypeScript..."
echo

cd "$NEXT"

if npm run build; then
  echo
  echo "=========================================="
  echo " BUILD NEXT.JS : OK"
  echo "=========================================="
else
  echo
  echo "=========================================="
  echo " BUILD NEXT.JS : ERREUR"
  echo "=========================================="
  echo
  echo "Les fichiers ont été sauvegardés avant modification."
  exit 1
fi
