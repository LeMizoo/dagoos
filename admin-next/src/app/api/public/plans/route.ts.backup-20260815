import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch('https://dagoos-api.onrender.com/api/plans', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error('API erreur');
    const plans = await res.json();
    return NextResponse.json(plans);
  } catch {
    // Fallback : plans par défaut
    return NextResponse.json([
      { id: 'fleets_free', type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1, landingPage: false },
      { id: 'fleets_basic', type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10, landingPage: false },
      { id: 'fleets_standard', type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50, landingPage: true },
      { id: 'fleets_premium', type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200, landingPage: true },
      { id: 'fleets_sur_devis', type: 'FLEET_MANAGER', name: 'Sur devis', price: -1, vehiclesMax: 999, driversMax: 999, landingPage: true },
      { id: 'coops_free', type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2, landingPage: false },
      { id: 'coops_basic', type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15, landingPage: false },
      { id: 'coops_standard', type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60, landingPage: true },
      { id: 'coops_premium', type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300, landingPage: true },
      { id: 'coops_sur_devis', type: 'COOPERATIVE', name: 'Sur devis', price: -1, vehiclesMax: 999, driversMax: 999, landingPage: true },
    ]);
  }
}
