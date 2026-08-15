import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const { orgId, plan } = await req.json();
    const res = await fetch(`https://dagoos-api.onrender.com/api/organizations/${orgId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); return NextResponse.json({ error: e.error || 'Erreur API' }, { status: res.status }); }
    return NextResponse.json(await res.json());
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
