import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('dagoos_token')?.value;
    if (!token) return NextResponse.json([], { status: 200 });
    const res = await fetch('https://dagoos-api.onrender.com/api/drivers', { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(await res.json());
  } catch { return NextResponse.json([]); }
}
