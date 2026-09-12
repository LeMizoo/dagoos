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
      fetch(`${API_BASE_URL}/api/organizations`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/drivers`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/vehicles`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/messages`, {
        headers,
        cache: 'no-store',
      }),
    ]);

    // Le backend peut renvoyer soit un tableau direct,
    // soit un objet paginé { data: [...], pagination: {...} }.
    // On gère les deux cas pour être robuste.
    function extractArray(payload: unknown): any[] {
      if (Array.isArray(payload)) return payload;
      if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as any).data)
      ) {
        return (payload as any).data;
      }
      return [];
    }

    const orgs = extractArray(orgsRes.ok ? await orgsRes.json() : null);
    const drivers = extractArray(driversRes.ok ? await driversRes.json() : null);
    const vehicles = extractArray(vehiclesRes.ok ? await vehiclesRes.json() : null);
    const messages = extractArray(messagesRes.ok ? await messagesRes.json() : null);

    return NextResponse.json({
      fleets: orgs.filter((o: any) => o.type === 'FLEET_MANAGER').length,
      cooperatives: orgs.filter((o: any) => o.type === 'COOPERATIVE').length,
      drivers: drivers.length,
      vehicles: vehicles.length,
      messages: messages.filter((m: any) => !m.read).length,
      recentOrgs: orgs.slice(0, 5),
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
