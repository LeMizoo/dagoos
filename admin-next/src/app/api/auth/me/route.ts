import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { getSessionToken } from '@/lib/session/registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionId = request.headers.get('x-session-id');
    const space = request.headers.get('x-auth-space') || 'admin';

    let token: string | null = null;

    /*
     * Priorité à la session serveur si elle existe.
     */
    if (sessionId) {
      token = getSessionToken(sessionId);
    }

    /*
     * Sinon, utiliser le cookie correspondant à l'espace.
     */
    if (!token) {
      if (space === 'fleet') {
        token =
          cookieStore.get('dagoos_fleet_token')?.value ?? null;
      } else if (space === 'coop') {
        token =
          cookieStore.get('dagoos_coop_token')?.value ?? null;
      } else {
        token =
          cookieStore.get('dagoos_admin_token')?.value ?? null;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/auth/me`,
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
        error:
          "Service d'authentification indisponible",
      },
      { status: 502 }
    );
  }
}
