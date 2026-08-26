import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages publiques : aucune redirection
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/urbain-login' ||
    pathname === '/interurbain-login' ||
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

  // Vérifier le cookie pour les pages protégées
  const isAdminPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isUrbainPath = pathname === '/flotte/urbain' || pathname.startsWith('/flotte/urbain/');
  const isInterurbainPath = pathname === '/flotte/interurbain' || pathname.startsWith('/flotte/interurbain/');
  const isFlottePath = pathname === '/flotte' || pathname.startsWith('/flotte/');

  if (isAdminPath || isUrbainPath || isInterurbainPath || isFlottePath) {
    const adminToken = request.cookies.get('dagoos_admin_token')?.value;
    const urbainToken = request.cookies.get('dagoos_urbain_token')?.value;
    const interurbainToken = request.cookies.get('dagoos_interurbain_token')?.value;

    const hasToken = adminToken || urbainToken || interurbainToken;

    if (!hasToken) {
      const loginPath = isAdminPath ? '/login' : isInterurbainPath ? '/interurbain-login' : '/urbain-login';
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  const response = NextResponse.next();
  
  // Empêcher le cache des pages protégées
  if (isAdminPath || isFlottePath || isUrbainPath || isInterurbainPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png|icons/|images/).*)',
  ],
};
