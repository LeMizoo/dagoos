import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/organizations/coop/${encodeURIComponent(params.slug)}`,
      {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({
      error: 'Réponse invalide du serveur API',
    }));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('[api/public/organizations/coop/:slug]', error);

    return NextResponse.json(
      { error: 'API indisponible' },
      { status: 502 }
    );
  }
}
