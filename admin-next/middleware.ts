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

  // Routes protégées : dashboard (admin) et flotte (urbain + interurbain)
  const isDashboard = pathname.startsWith('/dashboard');
  const isFlotte = pathname.startsWith('/flotte');

  if (!isDashboard && !isFlotte) {
    return NextResponse.next();
  }

  // ⚠️ Ces noms DOIVENT correspondre exactement à ceux posés dans
  // admin-next/src/app/api/auth/_login.ts. C'est le bug précédent :
  // ce middleware vérifiait 'dagoos_token' (jamais posé nulle part),
  // puis a été mis à jour pour protéger '/fleet' et '/coop' — des
  // routes qui n'existent plus depuis la consolidation vers '/flotte'.
  // Résultat : '/flotte/urbain' et '/flotte/interurbain' n'étaient
  // protégées par AUCUN garde serveur.
  let token: string | undefined;
  let loginPath = '/login';

  if (isDashboard) {
    token = request.cookies.get('dagoos_admin_token')?.value;
    loginPath = '/login';
  } else {
    // /flotte est partagé par les comptes urbain et interurbain :
    // n'importe lequel des deux cookies suffit à prouver la connexion.
    const urbainToken = request.cookies.get('dagoos_urbain_token')?.value;
    const interurbainToken = request.cookies.get('dagoos_interurbain_token')?.value;
    token = urbainToken || interurbainToken;
    loginPath = pathname.startsWith('/flotte/interurbain') ? '/interurbain-login' : '/urbain-login';
  }

  if (!token) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Empêche le navigateur de mettre cette page en cache local
  // (bfcache / cache disque), pour qu'un retour arrière après
  // déconnexion revienne obligatoirement chercher une version
  // fraîche au lieu d'afficher la version encore authentifiée.
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|b-trans.svg|b-trans.png).*)'],
};
