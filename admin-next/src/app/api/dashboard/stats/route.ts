import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (
      cookieStore.get('dagoos_admin_token')?.value ||
      cookieStore.get('dagoos_org_token')?.value
    );

    if (!token) {
      return NextResponse.json(
        {
          fleets: 0,
          cooperatives: 0,
          drivers: 0,
          vehicles: 0,
          messages: 0,
          recentOrgs: [],
          error: 'Non authentifié',
        },
        { status: 200 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [
      orgsRes,
      driversRes,
      vehiclesRes,
      messagesRes,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/api/organizations?limit=100`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/drivers?limit=100`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/vehicles?limit=100`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/messages?limit=100`, {
        headers,
        cache: 'no-store',
      }),
    ]);

    // Le backend peut renvoyer soit un tableau direct,
    // soit un objet paginé { data: [...], pagination: { total: N } }.
    // On extrait à la fois les items et le total pour être robuste.
    function extractArrayAndTotal(payload: unknown): {
      items: any[];
      total: number;
    } {
      if (Array.isArray(payload)) {
        return { items: payload, total: payload.length };
      }
      if (payload && typeof payload === 'object') {
        const p = payload as any;
        const items = Array.isArray(p.data) ? p.data : [];
        const total =
          typeof p.pagination?.total === 'number'
            ? p.pagination.total
            : items.length;
        return { items, total };
      }
      return { items: [], total: 0 };
    }

    const orgsData = extractArrayAndTotal(
      orgsRes.ok ? await orgsRes.json() : null
    );
    const driversData = extractArrayAndTotal(
      driversRes.ok ? await driversRes.json() : null
    );
    const vehiclesData = extractArrayAndTotal(
      vehiclesRes.ok ? await vehiclesRes.json() : null
    );
    const messagesData = extractArrayAndTotal(
      messagesRes.ok ? await messagesRes.json() : null
    );

    return NextResponse.json({
      fleets: orgsData.items.filter(
        (o: any) => o.type === 'FLEET_MANAGER'
      ).length,
      cooperatives: orgsData.items.filter(
        (o: any) => o.type === 'COOPERATIVE'
      ).length,
      drivers: driversData.total,
      vehicles: vehiclesData.total,
      messages: messagesData.items.filter((m: any) => !m.read).length,
      recentOrgs: orgsData.items.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        fleets: 0,
        cooperatives: 0,
        drivers: 0,
        vehicles: 0,
        messages: 0,
        recentOrgs: [],
        error: error?.message,
      },
      { status: 200 }
    );
  }
}
