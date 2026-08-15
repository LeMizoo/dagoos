import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();

    timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    const res = await fetch(
      `${API_BASE_URL}/api/plans`,
      {
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`API erreur: ${res.status}`);
    }

    const plans = await res.json();

    return NextResponse.json(plans);
  } catch (error) {
    console.error('[public/plans]', error);

    return NextResponse.json([]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
