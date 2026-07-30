import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('dagoos_token')?.value;
  const { pathname } = request.nextUrl;

  // Routes publiques (sans token)
  const publicPaths = ['/', '/login', '/fleet-login', '/coop-login', '/register'];
  
  // Landing pages publiques
  if (/^\/(fleet|coop)\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Routes API et statiques
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.startsWith('/images/')) {
    return NextResponse.next();
  }

  // Routes publiques exactes
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Routes protégées : dashboard, fleet/*, coop/*
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/fleet') || pathname.startsWith('/coop');
  
  if (isProtected && !token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet-login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop-login';
    
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png).*)'],
};
