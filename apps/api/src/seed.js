const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_LOGO = 'https://dago-mobility.pages.dev/assets/logo/b-trans.png';

async function seed() {
  console.log('🌱 Seed: initialisation...');

  // SUPER_ADMIN
  const adminEmail = 'tovoniaina.rahendrison@gmail.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash('ByDagoos2026!', 10),
        name: 'Tovoniaina RAHENDRISON',
        phone: '0340700405',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('✅ SUPER_ADMIN créé');
  }

  // Organisations de démo avec logo par défaut
  const orgs = [
    { name: "Flotte Alasora", code: "AL", slug: "flotte-alasora", type: 'FLEET_MANAGER', email: 'flotte-alasora@dagoos.mg', phone: '0340000001', logo: DEFAULT_LOGO, plan: 'Freemium' },
    { name: "Flotte Rasoa", code: "RA", slug: "flotte-rasoa", type: 'FLEET_MANAGER', email: 'flotte-rasoa@dagoos.mg', phone: '0340000002', logo: DEFAULT_LOGO, plan: 'Basic' },
    { name: "Cooperative Tana", code: "TN", slug: "coop-tana", type: 'COOPERATIVE', email: 'coop-tana@dagoos.mg', phone: '0340000003', logo: DEFAULT_LOGO, plan: 'Freemium' },
    { name: "Cooperative Tamatave", code: "TM", slug: "coop-tamatave", type: 'COOPERATIVE', email: 'coop-tamatave@dagoos.mg', phone: '0340000004', logo: DEFAULT_LOGO, plan: 'Standard' }
  ];

  for (const org of orgs) {
    const exists = await prisma.organization.findUnique({ where: { code: org.code } });
    if (!exists) {
      await prisma.organization.create({ data: org });
      console.log('✅ Organisation:', org.name, '- Plan:', org.plan);
    }
  }

  // Chauffeurs de démo
  const demoDrivers = [
    { name: 'Rakoto Jean', code: 'FL-AL001', pin: '1234', orgCode: 'AL' },
    { name: 'Rabe Pierre', code: 'FL-AL002', pin: '5678', orgCode: 'AL' },
    { name: 'Rasoanaivo', code: 'CO-TN001', pin: '4321', orgCode: 'TN' }
  ];

  for (const d of demoDrivers) {
    const exists = await prisma.driver.findUnique({ where: { driverCode: d.code } });
    if (!exists) {
      const org = await prisma.organization.findUnique({ where: { code: d.orgCode } });
      if (org) {
        const user = await prisma.user.create({
          data: {
            email: `${d.code.toLowerCase()}@driver.dagoos.mg`,
            password: await bcrypt.hash(d.pin, 10),
            name: d.name,
            role: 'DRIVER'
          }
        });
        await prisma.driver.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            driverCode: d.code,
            pin: await bcrypt.hash(d.pin, 10),
            status: 'active'
          }
        });
        console.log('✅ Chauffeur:', d.code, d.name);
      }
    }
  }

  await prisma.$disconnect();
  // Plans par défaut
  const defaultPlans = [
    { type: "FLEET_MANAGER", name: "Freemium", price: 0, vehiclesMax: 1, driversMax: 1 },
    { type: "FLEET_MANAGER", name: "Basic", price: 15000, vehiclesMax: 5, driversMax: 10 },
    { type: "FLEET_MANAGER", name: "Standard", price: 35000, vehiclesMax: 20, driversMax: 50 },
    { type: "FLEET_MANAGER", name: "Premium", price: 75000, vehiclesMax: 100, driversMax: 200 },
    { type: "COOPERATIVE", name: "Freemium", price: 0, vehiclesMax: 1, driversMax: 2 },
    { type: "COOPERATIVE", name: "Basic", price: 20000, vehiclesMax: 5, driversMax: 15 },
    { type: "COOPERATIVE", name: "Standard", price: 45000, vehiclesMax: 20, driversMax: 60 },
    { type: "COOPERATIVE", name: "Premium", price: 90000, vehiclesMax: 100, driversMax: 300 }
  ];
  for (const p of defaultPlans) {
    const existing = await prisma.plan.findFirst({ where: { type: p.type, name: p.name } });
    if (!existing) { await prisma.plan.create({ data: p }); console.log("✅ Plan:", p.type, p.name); }
  }

  console.log('✅ Seed terminé');
}

seed().catch(e => { console.error(e); process.exit(1); });
