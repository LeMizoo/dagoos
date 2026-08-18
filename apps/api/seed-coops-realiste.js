const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Distances et durées réalistes
const TRAJETS = {
  'Antananarivo-Toamasina': { distanceKm: 350, dureeEstimee: '9h' },
  'Antananarivo-Mahajanga': { distanceKm: 570, dureeEstimee: '13h' },
  'Antananarivo-Fianarantsoa': { distanceKm: 410, dureeEstimee: '11h' },
  'Antananarivo-Toliara': { distanceKm: 930, dureeEstimee: '24h' },
  'Antananarivo-Antsiranana': { distanceKm: 1100, dureeEstimee: '30h' },
  'Toamasina-Mahajanga': { distanceKm: 800, dureeEstimee: '18h' },
  'Toamasina-Fianarantsoa': { distanceKm: 700, dureeEstimee: '16h' },
  'Toamasina-Toliara': { distanceKm: 1200, dureeEstimee: '30h' },
  'Toamasina-Antsiranana': { distanceKm: 900, dureeEstimee: '22h' },
  'Mahajanga-Fianarantsoa': { distanceKm: 900, dureeEstimee: '20h' },
  'Mahajanga-Toliara': { distanceKm: 1100, dureeEstimee: '26h' },
  'Mahajanga-Antsiranana': { distanceKm: 700, dureeEstimee: '18h' },
  'Fianarantsoa-Toliara': { distanceKm: 520, dureeEstimee: '14h' },
  'Fianarantsoa-Antsiranana': { distanceKm: 1300, dureeEstimee: '32h' },
  'Toliara-Antsiranana': { distanceKm: 1600, dureeEstimee: '40h' },
};

const PROVINCES = ['Antananarivo', 'Toamasina', 'Mahajanga', 'Fianarantsoa', 'Toliara', 'Antsiranana'];

async function seed() {
  console.log('🌱 Seed réaliste avec distances et durées...\n');

  const coops = await prisma.organization.findMany({
    where: { type: 'COOPERATIVE' },
    select: { id: true, name: true },
  });

  console.log(`${coops.length} coopératives\n`);

  for (let idx = 0; idx < coops.length; idx++) {
    const coop = coops[idx];
    console.log(`\n🏢 ${coop.name}`);

    // 2 véhicules par coopérative
    const vehicles = [];
    for (let i = 0; i < 2; i++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          organization: { connect: { id: coop.id } },
          plate: `${String(1000 + Math.floor(Math.random() * 9000))} ${['T','D','M','A','F','U'][Math.floor(Math.random() * 6)]}${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]}${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]}`,
          model: 'Sprinter 28 places',
          placesTotal: 26,
          status: 'active',
        },
      });
      vehicles.push(vehicle);
    }

    // 4 départs par coopérative avec itinéraires variés
    for (let i = 0; i < 4; i++) {
      const departProvince = PROVINCES[i % PROVINCES.length];
      const destProvince = PROVINCES[(i + 1) % PROVINCES.length];
      const trajetKey = `${departProvince}-${destProvince}`;
      const trajet = TRAJETS[trajetKey] || { distanceKm: 300, dureeEstimee: '8h' };

      const prixBase = 10000 + idx * 5000 + i * 3000;
      const prixKm = Math.round(trajet.distanceKm * 30);
      const prixFinal = Math.max(prixBase, prixKm);

      await prisma.depart.create({
        data: {
          organization: { connect: { id: coop.id } },
          pointDepart: departProvince,
          destination: destProvince,
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          heure: `${String(6 + i * 2).padStart(2, '0')}:00`,
          prix: prixFinal,
          vehicle: { connect: { id: vehicles[i % vehicles.length].id } },
          placesTotal: 26,
          distanceKm: trajet.distanceKm,
          dureeEstimee: trajet.dureeEstimee,
          statut: 'PUBLISHED',
        },
      });
      console.log(`  🚌 ${departProvince} → ${destProvince} (${trajet.distanceKm} km, ${trajet.dureeEstimee}) : ${prixFinal} Ar`);
    }
  }

  console.log('\n✅ Seed réaliste terminé !');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
