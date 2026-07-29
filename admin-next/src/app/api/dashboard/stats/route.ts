import { NextRequest } from 'next/server';
import db from '@/db';
import { organizations, drivers, vehicles } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError('Non authentifié', 401);

    const [orgs, drv, veh] = await Promise.all([
      db.select().from(organizations).all(),
      db.select().from(drivers).all(),
      db.select().from(vehicles).all()
    ]);

    return apiSuccess({
      fleets: orgs.filter(o => o.type === 'FLEET_MANAGER').length,
      cooperatives: orgs.filter(o => o.type === 'COOPERATIVE').length,
      drivers: drv.length,
      vehicles: veh.length,
      recentOrgs: orgs.slice(0, 5)
    });
  } catch (e: any) { return apiError(e.message); }
}
