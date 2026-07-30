import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', {
      headers: { 'Authorization': `Bearer ${process.env.API_TOKEN || 'dagoos-public'}` }
    });
    if (!res.ok) throw new Error('API erreur');
    const orgs = await res.json();
    const premium = orgs.filter((o: any) => o.plan === 'Premium' || o.plan === 'Standard');
    return NextResponse.json(premium);
  } catch {
    return NextResponse.json([]);
  }
}
