import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('dagoos_token')?.value;
  const { pathname } = request.nextUrl;

  console.log('🔒 PATHNAME:', JSON.stringify(pathname));

  // Une landing page publique est /fleet/[slug] ou /coop/[slug]
  // où [slug] n'est PAS une page connue
  const isLandingPage = /^\/(fleet|coop)\/[a-z0-9-]+$/.test(pathname) &&
    !['drivers','vehicles','finances','messages','settings','profil','depenses','versements','rapports','carburant','consommables','gps','historique','permutation','codes','proprietaires','abonnement','societes','contrats','livraisons','notifications','demandes','departs','reservations'].includes(pathname.split('/')[2] || '');

  if (isLandingPage) {
    console.log('🔒 LANDING PUBLIQUE');
    return NextResponse.next();
  }

  const isProtected =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/fleet' ||
    pathname.startsWith('/fleet/') ||
    pathname === '/coop' ||
    pathname.startsWith('/coop/');

  console.log('🔒 isProtected:', isProtected, '| token:', token ? 'présent' : 'absent');

  if (isProtected && !token) {
    let loginPath = '/login';
    if (pathname.startsWith('/fleet')) loginPath = '/fleet-login';
    else if (pathname.startsWith('/coop')) loginPath = '/coop-login';

    console.log('🔒 REDIRECTION →', loginPath);
    
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png|icons/|images/).*)'],
};
