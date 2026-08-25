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

  const cookieName =
    space === 'admin' || space === 'dashboard'
      ? 'dagoos_admin_token'
      : space === 'urbain'
        ? 'dagoos_urbain_token'
        : 'dagoos_interurbain_token';

  cookieStore.set(cookieName, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({
    ok: true,
  });
}
