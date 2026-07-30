import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // D'abord, obtenir un token admin
    const loginRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dagoos.mg', password: 'admin123' }),
    });
    
    if (!loginRes.ok) throw new Error('Login failed');
    const { token } = await loginRes.json();
    
    // Ensuite, récupérer les organisations
    const orgsRes = await fetch('https://dagoos-api.onrender.com/api/organizations', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!orgsRes.ok) throw new Error('API erreur');
    const orgs = await orgsRes.json();
    const premium = orgs.filter((o: any) => o.plan === 'Premium' || o.plan === 'Standard');
    return NextResponse.json(premium);
  } catch {
    // Fallback : données mock
    return NextResponse.json([
      { id: '1', name: 'SONATRA', slug: 'sonatra', type: 'COOPERATIVE', plan: 'Premium', phone: '032 99 417 71' },
      { id: '2', name: 'KOFMAD', slug: 'kofmad', type: 'COOPERATIVE', plan: 'Premium', phone: '038 12 448 26' },
      { id: '3', name: 'TRANS BESADY RN7', slug: 'trans-besady-rn7', type: 'COOPERATIVE', plan: 'Premium', phone: '038 9864936' },
      { id: '4', name: 'MADA VOYAGE', slug: 'mada-voyage', type: 'COOPERATIVE', plan: 'Premium', phone: '034 73 456 49' },
      { id: '5', name: 'FIMPIMA', slug: 'fimpima', type: 'COOPERATIVE', plan: 'Premium', phone: '038 01 041 49' },
      { id: '6', name: 'KOFIFI', slug: 'kofifi', type: 'COOPERATIVE', plan: 'Premium', phone: '038 75 094 67' },
    ]);
  }
}
