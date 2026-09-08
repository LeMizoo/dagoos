// Seed des chauffeurs LONG_HAUL pour SONATRA
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedLongHaulDrivers() {
  console.log('🌱 Création des chauffeurs LONG_HAUL pour SONATRA...\n');

  const SONATRA_ORG_ID = 'cmsd2sqzo0003b16co8qif9ay';
  const PIN = '1234';
  const hashedPin = await bcrypt.hash(PIN, 12);

  const drivers = [
    {
      driverCode: 'CO-SON-FRG-001',
      name: 'Chauffeur Fourgon SONATRA',
      vehiclePlate: '4821 THF',
      vehicleModel: 'Renault Master',
      vehicleType: 'FOURGON',
    },
    {
      driverCode: 'CO-SON-CAM-001',
      name: 'Chauffeur Camion SONATRA',
      vehiclePlate: '6742 TCG',
      vehicleModel: 'DAF LF',
      vehicleType: 'CAMION',
    },
    {
      driverCode: 'CO-SON-SEMI-001',
      name: 'Chauffeur Semi-remorque SONATRA',
      vehiclePlate: '9013 TSG',
      vehicleModel: 'DAF XF',
      vehicleType: 'SEMI_REMORQUE',
    },
    {
      driverCode: 'CO-SON-FRIGO-001',
      name: 'Chauffeur Camion frigo SONATRA',
      vehiclePlate: '3458 TFG',
      vehicleModel: 'Iveco Daily Frigo',
      vehicleType: 'CAMION_FRIGO',
    },
    {
      driverCode: 'CO-SON-DEP-001',
      name: 'Chauffeur Dépannage SONATRA',
      vehiclePlate: '5679 TDP',
      vehicleModel: 'Renault Dépannage',
      vehicleType: 'DEPANNEUSE',
    },
  ];

  for (const d of drivers) {
    try {
      // 1. Créer le véhicule
      let vehicle = await prisma.vehicle.findUnique({
        where: { plate: d.vehiclePlate }
      });

      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            organizationId: SONATRA_ORG_ID,
            plate: d.vehiclePlate,
            model: d.vehicleModel,
            type: d.vehicleType,
            status: 'active',
          }
        });
        console.log(`  ✅ Véhicule créé: ${d.vehiclePlate} (${d.vehicleType})`);
      }

      // 2. Créer le User
      const userEmail = d.driverCode.toLowerCase() + '@driver.dagoos.mg';
      let user = await prisma.user.findUnique({ where: { email: userEmail } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: d.name,
            email: userEmail,
            password: hashedPin,
            role: 'DRIVER',
          }
        });
        console.log(`  ✅ User créé: ${userEmail}`);
      }

      // 3. Créer le Driver
      let driver = await prisma.driver.findUnique({
        where: { driverCode: d.driverCode }
      });

      if (!driver) {
        driver = await prisma.driver.create({
          data: {
            userId: user.id,
            organizationId: SONATRA_ORG_ID,
            driverCode: d.driverCode,
            pin: hashedPin,
            vehicleId: vehicle.id,
            status: 'AVAILABLE',
            accountStatus: 'active',
          }
        });
        console.log(`  ✅ Chauffeur créé: ${d.driverCode}`);
      }

      console.log(`     PIN: ${PIN}\n`);
    } catch (e) {
      console.error(`  ❌ Erreur ${d.driverCode}: ${e.message}`);
    }
  }

  console.log('✅ Seed terminé !');
}

seedLongHaulDrivers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
