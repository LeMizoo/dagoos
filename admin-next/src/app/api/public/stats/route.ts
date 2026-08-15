import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/organizations`,
      {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          fleets: 0,
          coops: 0,
          total: 0,
          error: 'Statistiques indisponibles',
        },
        { status: response.status }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        {
          fleets: 0,
          coops: 0,
          total: 0,
          error: 'Format de données invalide',
        },
        { status: 502 }
      );
    }

    const fleets = data.filter(
      (organization: any) =>
        organization.type === 'FLEET_MANAGER'
    ).length;

    const coops = data.filter(
      (organization: any) =>
        organization.type === 'COOPERATIVE'
    ).length;

    return NextResponse.json({
      fleets,
      coops,
      total: data.length,
    });
  } catch (error) {
    console.error('[api/public/stats]', error);

    return NextResponse.json(
      {
        fleets: 0,
        coops: 0,
        total: 0,
        error: 'API indisponible',
      },
      { status: 502 }
    );
  }
}
