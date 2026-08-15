import { NextResponse } from 'next/server';

const API_BASE = (
  process.env.API_BASE_URL ||
  'https://dagoos-api.onrender.com'
).replace(/\/$/, '');

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_BASE}/api/plans`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API erreur: ${res.status}`);
    }

    const plans = await res.json();

    return NextResponse.json(plans);
  } catch (error) {
    console.error('[public/plans]', error);

    // En cas d'indisponibilité de l'API, on renvoie un tableau vide
    // plutôt que des prix potentiellement obsolètes.
    return NextResponse.json([]);
  }
}
