import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const res = await fetch('https://dagoos-api.onrender.com/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
