import { NextRequest } from 'next/server';
import db from '@/db';
import { vehicles } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError('Non authentifié', 401);
    const data = await db.select().from(vehicles).all();
    return apiSuccess(data);
  } catch (e: any) { return apiError(e.message); }
}
