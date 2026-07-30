import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dagoos-api.onrender.com/api/plans');
    if (!res.ok) throw new Error('API erreur');
    const plans = await res.json();
    return NextResponse.json(plans);
  } catch {
    // Fallback : plans par défaut
    return NextResponse.json([
      { type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
      { type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
      { type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
      { type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
      { type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
      { type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
      { type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60 },
      { type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 },
    ]);
  }
}
