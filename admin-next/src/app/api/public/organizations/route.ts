import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = cookies().get('dagoos_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/organizations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({
      error: 'Réponse invalide du serveur API',
    }));

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    const organizations = Array.isArray(data)
      ? data.filter(
          (organization: any) =>
            organization.plan === 'Premium' ||
            organization.plan === 'Standard'
        )
      : [];

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('[api/public/organizations]', error);

    return NextResponse.json(
      { error: 'API indisponible' },
      { status: 502 }
    );
  }
}
