import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/session/registry';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const sessionId = request.headers.get('x-session-id');

  if (sessionId) {
    deleteSession(sessionId);
  }

  const space = request.headers.get('x-auth-space') || 'admin';

  const cookieNames =
    space === 'fleet'
      ? ['dagoos_fleet_token']
      : space === 'coop'
        ? ['dagoos_coop_token']
        : ['dagoos_admin_token'];

  for (const cookieName of cookieNames) {
    cookieStore.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }

  return NextResponse.json({ ok: true });
}
