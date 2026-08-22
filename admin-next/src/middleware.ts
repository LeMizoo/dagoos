import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages publiques : landing /fleet/[slug] et /coop/[slug]
  // Ces pages n'ont PAS de sous-routes connues
  const isLandingPage =
    /^\/(fleet|coop)\/[a-z0-9-]+$/.test(pathname) &&
    !pathname.includes('/drivers') &&
    !pathname.includes('/vehicles') &&
    !pathname.includes('/finances') &&
    !pathname.includes('/settings') &&
    !pathname.includes('/departs') &&
    !pathname.includes('/reservations') &&
    !pathname.includes('/contrats') &&
    !pathname.includes('/livraisons') &&
    !pathname.includes('/messages') &&
    !pathname.includes('/notifications') &&
    !pathname.includes('/profil') &&
    !pathname.includes('/societes') &&
    !pathname.includes('/versements') &&
    !pathname.includes('/depenses') &&
    !pathname.includes('/rapports') &&
    !pathname.includes('/permutation') &&
    !pathname.includes('/codes') &&
    !pathname.includes('/proprietaires') &&
    !pathname.includes('/demandes');

  if (isLandingPage) {
    return NextResponse.next();
  }

  const isAdminPath =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  const isFleetPath =
    pathname === '/fleet' ||
    pathname.startsWith('/fleet/');

  const isCoopPath =
    pathname === '/coop' ||
    pathname.startsWith('/coop/');

  const token = isAdminPath
    ? request.cookies.get('dagoos_admin_token')?.value
    : isFleetPath || isCoopPath
      ? request.cookies.get('dagoos_org_token')?.value
      : null;

  if ((isAdminPath || isFleetPath || isCoopPath) && !token) {
    const loginPath = isAdminPath ? '/login' : isFleetPath ? '/fleet-login' : '/coop-login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png|icons/|images/).*)'],
};
