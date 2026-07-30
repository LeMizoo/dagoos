import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes (accessibles sans authentification)
  const publicRoutes = [
    '/',
    '/login',
    '/fleet-login',
    '/coop-login',
    '/register',
    '/api',
  ];

  // Landing pages des organisations (accessibles sans auth)
  const isFleetLanding = pathname.startsWith('/fleet/') && pathname !== '/fleet-login' && pathname !== '/fleet';
  const isCoopLanding = pathname.startsWith('/coop/') && pathname !== '/coop-login' && pathname !== '/coop';
  
  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = [
    '/dashboard',
    '/fleet',
    '/coop',
  ];

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isLandingPage = isFleetLanding || isCoopLanding;

  // Si c'est une landing page, on laisse passer
  if (isLandingPage) {
    return NextResponse.next();
  }

  // Si la route est publique, on laisse passer
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Si pas de token et route protégée → rediriger vers login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (assets folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
