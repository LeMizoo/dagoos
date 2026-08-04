import { NextRequest, NextResponse } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    const apiRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json();
      return apiError(err.error || 'Email ou mot de passe incorrect', apiRes.status);
    }

    const data = await apiRes.json();
    
    const res = apiSuccess({ user: data.user || data });
    res.cookies.set('dagoos_token', data.token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 3600,
      path: '/',
      sameSite: 'lax',
    });

    return res;
  } catch (e: any) {
    return apiError(e.message);
  }
}
