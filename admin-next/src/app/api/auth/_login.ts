import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

type LoginEndpoint =
  | 'login'
  | 'urbain-login'
  | 'interurbain-login';

export async function login(
  request: NextRequest,
  endpoint: LoginEndpoint
) {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      `${API_BASE_URL}/api/auth/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
        cache: 'no-store',
      }
    );

    const data = await upstream
      .json()
      .catch(() => ({
        error: 'Réponse invalide du serveur API',
      }));

    if (!upstream.ok || !data.token) {
      return NextResponse.json(
        {
          error:
            data.error ||
            'Email ou mot de passe incorrect',
        },
        {
          status: upstream.ok ? 502 : upstream.status,
        }
      );
    }

    // Déterminer le cookie selon le rôle métier
    let cookieName = 'dagoos_admin_token';
    let redirectPath = '/dashboard';

    if (endpoint === 'urbain-login') {
      cookieName = 'dagoos_urbain_token';
      redirectPath = '/flotte/urbain';
    } else if (endpoint === 'interurbain-login') {
      cookieName = 'dagoos_interurbain_token';
      redirectPath = '/flotte/interurbain';
    }

    const response = NextResponse.json(
      {
        user: data.user,
        redirectPath,
      },
      { status: 200 }
    );

    response.cookies.set(cookieName, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(`[auth/${endpoint}]`, error);

    return NextResponse.json(
      {
        error:
          "Service d'authentification indisponible",
      },
      { status: 502 }
    );
  }
}
