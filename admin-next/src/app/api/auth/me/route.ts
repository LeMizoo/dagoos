import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = (
  process.env.API_BASE_URL ||
  'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE}/api/auth/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: 'Réponse invalide du serveur API',
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[auth/me]', error);

    return NextResponse.json(
      {
        error: "Service d'authentification indisponible",
      },
      { status: 502 }
    );
  }
}
