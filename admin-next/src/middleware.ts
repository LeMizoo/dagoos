import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================
  // PAGES PUBLIQUES
  // ============================================================

  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/fleet-login' ||
    pathname === '/coop-login' ||
    pathname === '/register';

  if (isPublicPage) {
    return NextResponse.next();
  }

  // ============================================================
  // LANDINGS PUBLIQUES DES ORGANISATIONS
  // ============================================================
  //
  // /fleet/[slug] et /coop/[slug] sont publiques.
  //
  // Attention :
  // /fleet-login et /coop-login ont déjà été traitées
  // ci-dessus et ne peuvent donc jamais être interprétées
  // comme des routes de portail.
  //

  const isPublicOrganizationLanding =
    /^\/(fleet|coop)\/[a-z0-9-]+$/.test(pathname);

  if (isPublicOrganizationLanding) {
    return NextResponse.next();
  }

  // ============================================================
  // PORTAIL ADMIN
  // ============================================================

  const isAdminPath =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  // ============================================================
  // PORTAIL FLEET
  // ============================================================

  const isFleetPath =
    pathname === '/fleet' ||
    pathname.startsWith('/fleet/');

  // ============================================================
  // PORTAIL COOP
  // ============================================================

  const isCoopPath =
    pathname === '/coop' ||
    pathname.startsWith('/coop/');

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================

  let token: string | undefined;

  if (isAdminPath) {
    token = request.cookies.get('dagoos_admin_token')?.value;
  } else if (isFleetPath) {
    token = request.cookies.get('dagoos_fleet_token')?.value;
  } else if (isCoopPath) {
    token = request.cookies.get('dagoos_coop_token')?.value;
  }

  // ============================================================
  // REDIRECTION VERS LE LOGIN APPROPRIÉ
  // ============================================================

  if ((isAdminPath || isFleetPath || isCoopPath) && !token) {
    const loginPath = isAdminPath
      ? '/login'
      : isFleetPath
        ? '/fleet-login'
        : '/coop-login';

    const loginUrl = new URL(loginPath, request.url);

    loginUrl.searchParams.set(
      'redirect',
      `${pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png|icons/|images/).*)',
  ],
};