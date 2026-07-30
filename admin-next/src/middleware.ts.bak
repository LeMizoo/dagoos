import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dagoos-secret-key');
const publicPaths = ['/login', '/fleet-login', '/coop-login', '/register', '/'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('dagoos_token')?.value;
  const { pathname } = req.nextUrl;

  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.startsWith('/images/') || pathname === '/favicon.ico' || pathname === '/b-trans.svg' || pathname === '/b-trans.png') {
    return NextResponse.next();
  }

  if (!token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet-login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop-login';
    const loginUrl = new URL(loginPath, req.url);
    if (pathname !== '/' && pathname !== loginPath) loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (pathname === '/login' || pathname === '/fleet-login' || pathname === '/coop-login') {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/dashboard', req.url));
      if (role === 'FLEET_MANAGER') return NextResponse.redirect(new URL('/fleet', req.url));
      if (role === 'COOPERATIVE') return NextResponse.redirect(new URL('/coop', req.url));
    }

    if (pathname.startsWith('/dashboard') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/login', req.url));
    if (pathname.startsWith('/fleet') && role !== 'FLEET_MANAGER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/fleet-login', req.url));
    if (pathname.startsWith('/coop') && role !== 'COOPERATIVE' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/coop-login', req.url));

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set('dagoos_token', '', { maxAge: 0, path: '/' });
    return res;
  }
}

export const config = { matcher: ['/((?!_next|favicon.ico|b-trans.svg|b-trans.png|images).*)'] };
