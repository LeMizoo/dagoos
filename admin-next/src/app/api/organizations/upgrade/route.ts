import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const token = (
      cookies().get('dagoos_admin_token')?.value ||
      cookies().get('dagoos_org_token')?.value
    );

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (
      typeof body.orgId !== 'string' ||
      !body.orgId.trim() ||
      typeof body.plan !== 'string' ||
      !body.plan.trim()
    ) {
      return NextResponse.json(
        { error: 'Organisation et plan requis' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/organizations/${encodeURIComponent(body.orgId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          plan: body.plan,
        }),
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
    console.error('[api/organizations/upgrade]', error);

    return NextResponse.json(
      { error: 'API indisponible' },
      { status: 502 }
    );
  }
}
