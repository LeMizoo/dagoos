import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', {
      headers: { 'Authorization': `Bearer ${process.env.API_TOKEN || 'dagoos-public'}` }
    });
    
    if (!res.ok) {
      return NextResponse.json({ fleets: 4, coops: 4, total: 8 });
    }
    
    const orgs = await res.json();
    const fleets = orgs.filter((o: any) => o.type === 'FLEET_MANAGER').length;
    const coops = orgs.filter((o: any) => o.type === 'COOPERATIVE').length;
    
    return NextResponse.json({ fleets, coops, total: orgs.length });
  } catch {
    return NextResponse.json({ fleets: 4, coops: 4, total: 8 });
  }
}
