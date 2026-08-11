import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const API_BASE_URL = (process.env.API_BASE_URL || 'https://dagoos-api.onrender.com').replace(/\/$/, '');

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;
    if (!token) return NextResponse.json({ fleets: 0, cooperatives: 0, drivers: 0, vehicles: 0, messages: 0, recentOrgs: [], error: 'Non authentifié' }, { status: 200 });

    const [orgsRes, driversRes, vehiclesRes, messagesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/organizations`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/messages`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const orgs = orgsRes.ok ? await orgsRes.json() : [];
    const drivers = driversRes.ok ? await driversRes.json() : [];
    const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
    const messages = messagesRes.ok ? await messagesRes.json() : [];

    return NextResponse.json({
      fleets: Array.isArray(orgs) ? orgs.filter((o: any) => o.type === 'FLEET_MANAGER').length : 0,
      cooperatives: Array.isArray(orgs) ? orgs.filter((o: any) => o.type === 'COOPERATIVE').length : 0,
      drivers: Array.isArray(drivers) ? drivers.length : 0,
      vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
      messages: Array.isArray(messages) ? messages.filter((m: any) => !m.read).length : 0,
      recentOrgs: Array.isArray(orgs) ? orgs.slice(0, 5) : [],
    });
  } catch (e: any) {
    return NextResponse.json({ fleets: 0, cooperatives: 0, drivers: 0, vehicles: 0, messages: 0, recentOrgs: [], error: e?.message }, { status: 200 });
  }
}
