import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Liste des chemins publics (accessibles sans token)
const publicPaths = [
  '/',
  '/login',
  '/fleet-login',
  '/coop-login',
  '/register',
];

// Extensions de fichiers statiques à ignorer
const staticExtensions = [
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico',
  '.css', '.js', '.json', '.woff', '.woff2', '.ttf',
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('dagoos_token')?.value;
  const { pathname } = req.nextUrl;

  // Ignorer les fichiers statiques
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Ignorer les chemins Next.js internes et API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next();
  }

  // Chemins publics
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Pas de token → rediriger vers login approprié
  if (!token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet-login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop-login';

    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token présent → laisser passer (la vérification JWT se fait côté API)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|images|favicon\\.ico|b-trans\\.svg|b-trans\\.png).*)',
  ],
};
