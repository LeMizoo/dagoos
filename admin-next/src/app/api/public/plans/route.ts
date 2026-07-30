import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dagoos-api.onrender.com/api/plans');
    if (!res.ok) throw new Error('API erreur');
    const plans = await res.json();
    return NextResponse.json(plans);
  } catch {
    // Fallback : plans par défaut avec IDs
    return NextResponse.json([
      { id: 'fleets_free', type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
      { id: 'fleets_basic', type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
      { id: 'fleets_standard', type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
      { id: 'fleets_premium', type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
      { id: 'coops_free', type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
      { id: 'coops_basic', type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
      { id: 'coops_standard', type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60 },
      { id: 'coops_premium', type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 },
    ]);
  }
}
