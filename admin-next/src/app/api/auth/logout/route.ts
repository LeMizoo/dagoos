import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/session/registry';

export async function POST(
  request: NextRequest
) {
  const cookieStore = cookies();

  const sessionId =
    request.headers.get(
      'x-session-id'
    );

  /*
   * Déconnexion de CET onglet uniquement.
   */
  if (sessionId) {
    deleteSession(sessionId);
  }

  const space =
    request.headers.get(
      'x-auth-space'
    ) || 'admin';

  /*
   * Le cookie ADMIN reste indépendant.
   * Les sessions Flotte/Coop sont gérées
   * par le registre + sessionStorage.
   */
  if (
    space === 'admin' ||
    space === 'dashboard'
  ) {
    cookieStore.set(
      'dagoos_admin_token',
      '',
      {
        httpOnly: true,
        maxAge: 0,
        path: '/',
      }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
