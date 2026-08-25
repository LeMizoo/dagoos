import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  try {
    const cookieStore = cookies();

    const space =
      request.headers.get(
        'x-auth-space'
      ) || 'admin';

    let token: string | null = null;

    if (space === 'admin' || space === 'dashboard') {
      token = cookieStore.get('dagoos_admin_token')?.value ?? null;
    } else if (space === 'urbain') {
      token = cookieStore.get('dagoos_urbain_token')?.value ?? null;
    } else if (space === 'interurbain') {
      token = cookieStore.get('dagoos_interurbain_token')?.value ?? null;
    } else if (space === 'flotte') {
      token = cookieStore.get('dagoos_urbain_token')?.value ??
        cookieStore.get('dagoos_interurbain_token')?.value ?? null;
    }

    if (!token) {
      return NextResponse.json(
        {
          error:
            'Non authentifié',
        },
        {
          status: 401,
        }
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/auth/me`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
          },
          cache: 'no-store',
        }
      );

    const text =
      await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error:
          'Réponse invalide',
      };
    }

    return NextResponse.json(
      data,
      {
        status:
          response.status,
      }
    );
  } catch (error) {
    console.error(
      '[auth/me]',
      error
    );

    return NextResponse.json(
      {
        error:
          "Service d'authentification indisponible",
      },
      {
        status: 502,
      }
    );
  }
}
