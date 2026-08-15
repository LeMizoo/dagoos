import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { code, pin } = body;

    if (
      typeof code !== 'string' ||
      typeof pin !== 'string' ||
      !code.trim() ||
      !pin
    ) {
      return NextResponse.json(
        { error: 'Code chauffeur et PIN requis' },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      `${API_BASE_URL}/api/auth/driver-login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          pin,
        }),
        cache: 'no-store',
      }
    );

    const data = await upstream
      .json()
      .catch(() => ({ error: 'Réponse invalide du serveur API' }));

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error('[auth/driver-login]', error);

    return NextResponse.json(
      {
        error: "Service d'authentification indisponible",
      },
      { status: 502 }
    );
  }
}
