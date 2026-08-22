import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });

  const space = request.headers.get('x-auth-space');

  const cookieName =
    space === 'admin'
      ? 'dagoos_admin_token'
      : 'dagoos_org_token';

  res.cookies.set(cookieName, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  return res;
}
