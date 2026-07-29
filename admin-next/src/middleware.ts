import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dagoos-secret-key');

const publicPaths = ['/login', '/fleet/login', '/coop/login', '/register'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('dagoos_token')?.value;
  const { pathname } = req.nextUrl;

  // Routes publiques
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Pas de token → rediriger vers le bon login
  if (!token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet/login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop/login';
    
    const loginUrl = new URL(loginPath, req.url);
    if (pathname !== '/' && pathname !== loginPath) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Rediriger vers le bon dashboard selon le rôle après login
    if (pathname === '/login' || pathname === '/') {
      if (role === 'FLEET_MANAGER') return NextResponse.redirect(new URL('/fleet', req.url));
      if (role === 'COOPERATIVE') return NextResponse.redirect(new URL('/coop', req.url));
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protection par rôle
    if (pathname.startsWith('/fleet') && role !== 'FLEET_MANAGER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/coop') && role !== 'COOPERATIVE' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/dashboard') && role !== 'ADMIN') {
      if (role === 'FLEET_MANAGER') return NextResponse.redirect(new URL('/fleet', req.url));
      if (role === 'COOPERATIVE') return NextResponse.redirect(new URL('/coop', req.url));
    }

    return NextResponse.next();
  } catch {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet/login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop/login';
    
    const loginUrl = new URL(loginPath, req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api/auth).*)'],
};
