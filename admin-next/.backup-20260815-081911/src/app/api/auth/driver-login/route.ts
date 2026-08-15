import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_BASE_URL || 'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const upstream = await fetch(
      `${API_BASE_URL}/api/auth/driver-login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );

    const data = await upstream
      .json()
      .catch(() => ({ error: 'Réponse invalide' }));

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
