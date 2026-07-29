import { NextRequest } from 'next/server';
import db from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError('Non authentifié', 401);
    
    const user = await db.select().from(users).where(eq(users.id, session.id as string)).get();
    if (!user) return apiError('Utilisateur introuvable', 404);
    
    return apiSuccess({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e: any) { return apiError(e.message); }
}
