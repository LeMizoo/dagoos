import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const { orgId, plan } = await req.json();
    
    const loginRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dagoos.mg', password: 'admin123' }),
    });
    
    if (!loginRes.ok) {
      return NextResponse.json({ error: 'Échec authentification admin' }, { status: 500 });
    }
    
    const { token } = await loginRes.json();
    
    const res = await fetch(`https://dagoos-api.onrender.com/api/organizations/${orgId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errData.error || 'Erreur API' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
