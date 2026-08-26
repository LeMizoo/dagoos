import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques (sans token)
  const publicPaths = ['/', '/login', '/urbain-login', '/interurbain-login', '/register'];

  // Routes API et statiques
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.startsWith('/images/')) {
    return NextResponse.next();
  }

  // Routes publiques exactes
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Protection stricte par espace
  const isAdminPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isUrbainPath = pathname === '/flotte/urbain' || pathname.startsWith('/flotte/urbain/');
  const isInterurbainPath = pathname === '/flotte/interurbain' || pathname.startsWith('/flotte/interurbain/');
  const isFlotteEntry = pathname === '/flotte';

  const adminToken = request.cookies.get('dagoos_admin_token')?.value;
  const urbainToken = request.cookies.get('dagoos_urbain_token')?.value;
  const interurbainToken = request.cookies.get('dagoos_interurbain_token')?.value;

  if (isAdminPath && !adminToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isUrbainPath && !urbainToken) {
    return NextResponse.redirect(new URL('/urbain-login', request.url));
  }

  if (isInterurbainPath && !interurbainToken) {
    return NextResponse.redirect(new URL('/interurbain-login', request.url));
  }

  if (isFlotteEntry && !urbainToken && !interurbainToken) {
    return NextResponse.redirect(new URL('/urbain-login', request.url));
  }

  const response = NextResponse.next();

  if (isAdminPath || isFlotteEntry || isUrbainPath || isInterurbainPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png).*)'],
};
