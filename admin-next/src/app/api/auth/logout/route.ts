import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest
) {
  const cookieStore = cookies();

  const space =
    request.headers.get(
      'x-auth-space'
    ) || 'admin';

  // Supprimer TOUS les cookies de session
  cookieStore.set('dagoos_admin_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  cookieStore.set('dagoos_urbain_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  cookieStore.set('dagoos_interurbain_token', '', { httpOnly: true, maxAge: 0, path: '/' });

  const response = NextResponse.json({
    ok: true,
  });

  // Forcer le navigateur à vider le cache
  response.headers.set('Clear-Site-Data', '"cache", "cookies"');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return response;
}
