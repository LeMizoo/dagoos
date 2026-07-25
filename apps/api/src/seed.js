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

  // Comptes utilisateurs pour les organisations
  const orgUsers = [
    { email: "flotte-alasora@dagoos.mg", password: "123456", name: "Gerant Alasora", role: "FLEET_MANAGER" },
    { email: "flotte-rasoa@dagoos.mg", password: "123456", name: "Gerant Rasoa", role: "FLEET_MANAGER" },
    { email: "coop-tana@dagoos.mg", password: "123456", name: "Gerant Tana", role: "COOPERATIVE" },
    { email: "coop-tamatave@dagoos.mg", password: "123456", name: "Gerant Tamatave", role: "COOPERATIVE" }
  ];
  for (const u of orgUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({ data: { email: u.email, password: await bcrypt.hash(u.password, 10), name: u.name, role: u.role } });
      console.log("✅ Utilisateur:", u.email);
    }
  }

  // Comptes de test pour tous les plans
  const testUsers = [
    { name: "Fleet Freemium", email: "fleet-freemium@test.mg", password: "123456", role: "FLEET_MANAGER", plan: "Freemium" },
    { name: "Fleet Basic", email: "fleet-basic@test.mg", password: "123456", role: "FLEET_MANAGER", plan: "Basic" },
    { name: "Fleet Standard", email: "fleet-standard@test.mg", password: "123456", role: "FLEET_MANAGER", plan: "Standard" },
    { name: "Fleet Premium", email: "fleet-premium@test.mg", password: "123456", role: "FLEET_MANAGER", plan: "Premium" },
    { name: "Coop Freemium", email: "coop-freemium@test.mg", password: "123456", role: "COOPERATIVE", plan: "Freemium" },
    { name: "Coop Basic", email: "coop-basic@test.mg", password: "123456", role: "COOPERATIVE", plan: "Basic" },
    { name: "Coop Standard", email: "coop-standard@test.mg", password: "123456", role: "COOPERATIVE", plan: "Standard" },
    { name: "Coop Premium", email: "coop-premium@test.mg", password: "123456", role: "COOPERATIVE", plan: "Premium" }
  ];
  for (const u of testUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      const user = await prisma.user.create({ data: { email: u.email, password: await bcrypt.hash(u.password, 10), name: u.name, role: u.role } });
      const code = u.name.substring(0,2).toUpperCase() + Math.random().toString(36).substring(2,4).toUpperCase();
      const slug = u.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const type = u.role === "COOPERATIVE" ? "COOPERATIVE" : "FLEET_MANAGER";
      await prisma.organization.create({ data: { name: u.name, code, slug, type, email: u.email, phone: "0340000000", logo: DEFAULT_LOGO, plan: u.plan, status: "active" } });
      console.log("✅ Test:", u.email, "-", u.plan);
    }
  }

  // === DONNÉES DE TEST PREMIUM (Fleet Premium Test) ===
  const premiumOrg = await prisma.organization.findUnique({ where: { email: "fleet-premium@test.mg" } });
  if (premiumOrg) {
