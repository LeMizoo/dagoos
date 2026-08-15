import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;
    if (!token) return NextResponse.json([]);
    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', { headers: { Authorization: `Bearer ${token}` } });
    const orgs = await res.json();
    return NextResponse.json(orgs.filter((o: any) => o.plan === 'Premium' || o.plan === 'Standard'));
  } catch { return NextResponse.json([]); }
}
