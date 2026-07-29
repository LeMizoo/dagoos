import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dagoos-secret-key');

const publicPaths = ['/login', '/fleet/login', '/coop/login'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('dagoos_token')?.value;
  const { pathname } = req.nextUrl;

  // Routes publiques
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Pas de token → rediriger vers le login approprié
  if (!token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet/login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop/login';
    
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Redirection si déjà connecté sur une page login
    if (publicPaths.includes(pathname)) {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/dashboard', req.url));
      if (role === 'FLEET_MANAGER') return NextResponse.redirect(new URL('/fleet', req.url));
      if (role === 'COOPERATIVE') return NextResponse.redirect(new URL('/coop', req.url));
    }

    return NextResponse.next();
  } catch {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet/login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop/login';
    
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('dagoos_token', '', { maxAge: 0, path: '/' });
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
