import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;

    // Login admin pour obtenir un token si pas déjà connecté
    let authToken = token;
    if (!authToken) {
      const loginRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@dagoos.mg', password: 'admin123' }),
      });
      if (loginRes.ok) {
        const { token: t } = await loginRes.json();
        authToken = t;
      }
    }

    if (!authToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les données depuis l'API Render
    const [orgsRes, driversRes, vehiclesRes, messagesRes] = await Promise.all([
      fetch('https://dagoos-api.onrender.com/api/organizations', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      fetch('https://dagoos-api.onrender.com/api/drivers', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      fetch('https://dagoos-api.onrender.com/api/vehicles', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
      fetch('https://dagoos-api.onrender.com/api/messages', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }),
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
