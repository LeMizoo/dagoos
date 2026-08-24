import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages publiques : aucune redirection
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/flotte-login' ||
    pathname === '/fleet-login' ||
    pathname === '/coop-login' ||
    pathname === '/register';

  if (isPublicPage) {
    return NextResponse.next();
  }

  // Landings publiques des organisations
  const isPublicOrganizationLanding =
    /^\/(fleet|coop)\/[a-z0-9-]+$/.test(pathname);

  if (isPublicOrganizationLanding) {
    return NextResponse.next();
  }

  // Le middleware ne gère plus l'authentification.
  // L'authentification est gérée par le proxy et le AuthContext côté client.
  // Chaque onglet a sa propre session via sessionStorage + registre serveur.

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png|icons/|images/).*)',
  ],
};
