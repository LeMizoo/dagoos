import { NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || 'https://dagoos-api.onrender.com').replace(/\/$/, '');

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/organizations`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({ error: 'Réponse API invalide' }));
    if (!res.ok) {
      console.error('[api/organizations] upstream error', { status: res.status, error: data.error });
      return NextResponse.json({ error: data.error || 'Impossible de charger les organisations' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/organizations] request failed', error);
    return NextResponse.json({ error: 'API indisponible' }, { status: 502 });
  }
}
