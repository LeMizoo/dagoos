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
      data: { email: adminEmail, password: await bcrypt.hash('ByDagoos2026!', 10), name: 'Tovoniaina RAHENDRISON', phone: '0340700405', role: 'SUPER_ADMIN' }
    });
    console.log('✅ SUPER_ADMIN créé');
  }

  // Organisations de démo
  const orgs = [
    { name: 'Flotte Alasora', code: 'AL', slug: 'flotte-alasora', type: 'FLEET_MANAGER', email: 'flotte-alasora@dagoos.mg', phone: '0340000001', logo: DEFAULT_LOGO, plan: 'Freemium' },
    { name: 'Flotte Rasoa', code: 'RA', slug: 'flotte-rasoa', type: 'FLEET_MANAGER', email: 'flotte-rasoa@dagoos.mg', phone: '0340000002', logo: DEFAULT_LOGO, plan: 'Basic' },
    { name: 'Cooperative Tana', code: 'TN', slug: 'coop-tana', type: 'COOPERATIVE', email: 'coop-tana@dagoos.mg', phone: '0340000003', logo: DEFAULT_LOGO, plan: 'Freemium' },
    { name: 'Cooperative Tamatave', code: 'TM', slug: 'coop-tamatave', type: 'COOPERATIVE', email: 'coop-tamatave@dagoos.mg', phone: '0340000004', logo: DEFAULT_LOGO, plan: 'Standard' }
  ];
  for (const org of orgs) {
    const exists = await prisma.organization.findUnique({ where: { code: org.code } });
    if (!exists) { await prisma.organization.create({ data: org }); console.log('✅ Organisation:', org.name); }
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
        const user = await prisma.user.create({ data: { email: d.code.toLowerCase() + '@driver.dagoos.mg', password: await bcrypt.hash(d.pin, 10), name: d.name, role: 'DRIVER' } });
        await prisma.driver.create({ data: { userId: user.id, organizationId: org.id, driverCode: d.code, pin: await bcrypt.hash(d.pin, 10), status: 'active' } });
        console.log('✅ Chauffeur:', d.code, d.name);
      }
    }
  }

  // Plans
  const defaultPlans = [
    { type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
    { type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
    { type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
    { type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
    { type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
    { type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
    { type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60 },
    { type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 }
  ];
  for (const p of defaultPlans) {
    const existing = await prisma.plan.findFirst({ where: { type: p.type, name: p.name } });
    if (!existing) { await prisma.plan.create({ data: p }); console.log('✅ Plan:', p.type, p.name); }
  }

  // Utilisateurs Fleet/Coop avec mot de passe
  const orgUsers = [
    { email: 'flotte-alasora@dagoos.mg', password: '123456', name: 'Gerant Alasora', role: 'FLEET_MANAGER' },
    { email: 'flotte-rasoa@dagoos.mg', password: '123456', name: 'Gerant Rasoa', role: 'FLEET_MANAGER' },
    { email: 'coop-tana@dagoos.mg', password: '123456', name: 'Gerant Tana', role: 'COOPERATIVE' },
    { email: 'coop-tamatave@dagoos.mg', password: '123456', name: 'Gerant Tamatave', role: 'COOPERATIVE' }
  ];
  for (const u of orgUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) { await prisma.user.create({ data: { email: u.email, password: await bcrypt.hash(u.password, 10), name: u.name, role: u.role } }); console.log('✅ Utilisateur:', u.email); }
  }

  // Comptes de test par plan
  const testUsers = [
    { name: 'Fleet Freemium', email: 'fleet-freemium@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Freemium' },
    { name: 'Fleet Basic', email: 'fleet-basic@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Basic' },
    { name: 'Fleet Standard', email: 'fleet-standard@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Standard' },
    { name: 'Fleet Premium', email: 'fleet-premium@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Premium' },
    { name: 'Coop Freemium', email: 'coop-freemium@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Freemium' },
    { name: 'Coop Basic', email: 'coop-basic@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Basic' },
    { name: 'Coop Standard', email: 'coop-standard@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Standard' },
    { name: 'Coop Premium', email: 'coop-premium@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Premium' }
  ];
  for (const u of testUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      const user = await prisma.user.create({ data: { email: u.email, password: await bcrypt.hash(u.password, 10), name: u.name, role: u.role } });
      const code = u.name.substring(0, 2).toUpperCase() + Math.random().toString(36).substring(2, 4).toUpperCase();
      const slug = u.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const type = u.role === 'COOPERATIVE' ? 'COOPERATIVE' : 'FLEET_MANAGER';
      await prisma.organization.create({ data: { name: u.name, code, slug, type, email: u.email, phone: '0340000000', logo: DEFAULT_LOGO, plan: u.plan, status: 'active' } });
      console.log('✅ Test:', u.email, '-', u.plan);
    }
  }

  // Véhicules de test par plan
  const vehiclesData = [
    { orgEmail: 'fleet-freemium@test.mg', items: [
      { plate: 'FL-FR-100', model: 'YAMAHA Cygnus 100cc', year: 2023, currentKm: 12000, nextMaintenanceKm: 15000, insuranceDate: '2026-12-31' }
    ]},
    { orgEmail: 'fleet-basic@test.mg', items: [
      { plate: 'FL-BA-M100', model: 'YAMAHA Cygnus GRX 125cc', year: 2024, currentKm: 8000, nextMaintenanceKm: 11000, insuranceDate: '2027-06-30' },
      { plate: 'FL-BA-T100', model: 'TOYOTA Prius 5 places', year: 2024, currentKm: 25000, nextMaintenanceKm: 28000, insuranceDate: '2027-12-31' }
    ]},
    { orgEmail: 'fleet-standard@test.mg', items: [
      { plate: 'FL-ST-M100', model: 'YAMAHA Cygnus GRX 150cc', year: 2024, currentKm: 5000, nextMaintenanceKm: 8000, insuranceDate: '2027-12-31' },
      { plate: 'FL-ST-T100', model: 'TOYOTA Prius+ 7 places', year: 2024, currentKm: 18000, nextMaintenanceKm: 21000, insuranceDate: '2027-06-30' },
      { plate: 'FL-ST-B100', model: 'MERCEDES Sprinter 22 places', year: 2023, currentKm: 45000, nextMaintenanceKm: 50000, insuranceDate: '2027-12-31' }
    ]},
    { orgEmail: 'fleet-premium@test.mg', items: [
      { plate: 'FL-PR-M100', model: 'YAMAHA Cygnus GRX 125cc', year: 2024, currentKm: 5000, nextMaintenanceKm: 8000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-M200', model: 'YAMAHA Cygnus GRX 150cc', year: 2024, currentKm: 10000, nextMaintenanceKm: 13000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-M300', model: 'YAMAHA Cygnus Ray ZR 110cc', year: 2024, currentKm: 15000, nextMaintenanceKm: 18000, insuranceDate: '2027-06-30' },
      { plate: 'FL-PR-M400', model: 'YAMAHA Cygnus 100cc', year: 2024, currentKm: 20000, nextMaintenanceKm: 23000, insuranceDate: '2026-08-15' },
      { plate: 'FL-PR-M500', model: 'YAMAHA Cygnus GRX 125cc', year: 2024, currentKm: 25000, nextMaintenanceKm: 27800, insuranceDate: '2026-07-01' },
      { plate: 'FL-PR-T100', model: 'TOYOTA Prius 5 places', year: 2024, currentKm: 32000, nextMaintenanceKm: 37000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-T200', model: 'KIA Picanto 5 places', year: 2023, currentKm: 55000, nextMaintenanceKm: 60000, insuranceDate: '2026-09-15' },
      { plate: 'FL-PR-T300', model: 'TOYOTA Prius+ 7 places', year: 2024, currentKm: 15000, nextMaintenanceKm: 18000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-K100', model: 'BAJAJ Tricycle 3 roues', year: 2024, currentKm: 8000, nextMaintenanceKm: 11000, insuranceDate: '2027-06-30' },
      { plate: 'FL-PR-K200', model: 'BAJAJ Tricycle 3 roues', year: 2023, currentKm: 22000, nextMaintenanceKm: 25000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-B100', model: 'MERCEDES Sprinter 22 places', year: 2023, currentKm: 45000, nextMaintenanceKm: 50000, insuranceDate: '2027-12-31' },
      { plate: 'FL-PR-B200', model: 'TOYOTA Coaster 30 places', year: 2024, currentKm: 28000, nextMaintenanceKm: 33000, insuranceDate: '2027-06-30' },
      { plate: 'FL-PR-G100', model: 'HYUNDAI County 35 places', year: 2024, currentKm: 12000, nextMaintenanceKm: 15000, insuranceDate: '2027-12-31' }
    ]}
  ];
  for (const orgData of vehiclesData) {
    const org = await prisma.organization.findUnique({ where: { email: orgData.orgEmail } });
    if (org) {
      for (const v of orgData.items) {
        const exists = await prisma.vehicle.findUnique({ where: { plate: v.plate } });
        if (!exists) { await prisma.vehicle.create({ data: { ...v, organizationId: org.id } }); console.log('✅ Véhicule:', v.plate); }
      }
    }
  }

  // Chauffeurs premium
  const premiumOrg = await prisma.organization.findUnique({ where: { email: 'fleet-premium@test.mg' } });
  if (premiumOrg) {
    const chauffeurs = [
      { name: 'Rakoto Jean', email: 'chauffeur001@premium.mg', pin: '12001', code: 'FL-PREM001' },
      { name: 'Rabe Pierre', email: 'chauffeur002@premium.mg', pin: '12002', code: 'FL-PREM002' },
      { name: 'Rasoa Marie', email: 'chauffeur003@premium.mg', pin: '12003', code: 'FL-PREM003' },
      { name: 'Randria Paul', email: 'chauffeur004@premium.mg', pin: '12004', code: 'FL-PREM004' },
      { name: 'Rakotondrabe Solo', email: 'chauffeur005@premium.mg', pin: '12005', code: 'FL-PREM005' }
    ];
    for (const c of chauffeurs) {
      const userExists = await prisma.user.findUnique({ where: { email: c.email } });
      if (!userExists) {
        const user = await prisma.user.create({ data: { email: c.email, password: await bcrypt.hash(c.pin, 10), name: c.name, role: 'DRIVER' } });
        await prisma.driver.create({ data: { userId: user.id, organizationId: premiumOrg.id, driverCode: c.code, pin: await bcrypt.hash(c.pin, 10), status: 'active' } });
        console.log('✅ Chauffeur:', c.code, c.name);
      }
    }
  }

  // === PROPRIÉTAIRES DE TEST ===
  const proprietairesData = [
    { orgEmail: "fleet-premium@test.mg", name: "Rakoto Jean", cin: "123456789012", phone: "0340000001", email: "rakoto.jean@test.mg", address: "Lot 123 Anosimasina", nif: "NIF001", stat: "STAT001" },
    { orgEmail: "fleet-premium@test.mg", name: "Rabe Paul", cin: "987654321098", phone: "0340000002", email: "rabe.paul@test.mg", address: "Lot 456 Bemasoandro", nif: "NIF002", stat: "STAT002" },
    { orgEmail: "fleet-premium@test.mg", name: "Rasoa Marie", cin: "456789123456", phone: "0340000003", email: "rasoa.marie@test.mg", address: "Lot 789 Andraharo", nif: "NIF003", stat: "STAT003" },
    { orgEmail: "fleet-standard@test.mg", name: "Randria Paul", cin: "789123456789", phone: "0340000004", email: "randria.paul@test.mg", address: "Lot 012 Ambohibao", nif: "NIF004", stat: "STAT004" },
    { orgEmail: "fleet-basic@test.mg", name: "Rakotondrabe Solo", cin: "321654987012", phone: "0340000005", email: "solo@test.mg", address: "Lot 345 Ivato", nif: "NIF005", stat: "STAT005" }
  ];
  for (const p of proprietairesData) {
    const org = await prisma.organization.findUnique({ where: { email: p.orgEmail } });
    if (org) {
      const exists = await prisma.proprietaire.findFirst({ where: { email: p.email } });
      if (!exists) {
        await prisma.proprietaire.create({ data: { name: p.name, cin: p.cin, phone: p.phone, email: p.email, address: p.address, nif: p.nif, stat: p.stat, organizationId: org.id } });
        console.log("✅ Propriétaire:", p.name, "-", p.orgEmail);
      }
    }
  }

  // === CRÉER LANDING CONTENT POUR CHAQUE ORGANISATION ===
  const allOrgs = await prisma.organization.findMany();
  for (const org of allOrgs) {
    const existingContent = await prisma.landingContent.findFirst({ where: { section: "hero-" + org.slug } });
    if (!existingContent && (org.plan === "Standard" || org.plan === "Premium")) {
      const sections = ["hero", "apps", "features", "about", "cta", "footer"];
      const defaults = {
        hero: { title: org.name, subtitle: "Service de transport à Madagascar", body: "Bienvenue sur la page de " + org.name },
        apps: { title: "Nos services", subtitle: "Découvrez ce que nous proposons" },
        features: { title: "Pourquoi nous choisir", subtitle: "Qualité et confiance" },
        about: { title: "À propos de " + org.name, subtitle: "Notre histoire" },
        cta: { title: "Contactez-nous", subtitle: "Une question ?" },
        footer: { title: org.name, subtitle: "© 2026 - Tous droits réservés" }
      };
      for (const sec of sections) {
        await prisma.landingContent.create({ data: { section: sec + "-" + org.slug, title: defaults[sec].title, subtitle: defaults[sec].subtitle, body: defaults[sec].body || "", active: true } });
      }
      console.log("✅ Landing page créée pour:", org.name);
    }
  }

  // === ASSIGNER VÉHICULES AUX CHAUFFEURS ===
  const allVehicles = await prisma.vehicle.findMany();
  const allDrivers = await prisma.driver.findMany();
  
  // Assigner un véhicule à chaque chauffeur qui n'en a pas
  for (let i = 0; i < allDrivers.length; i++) {
    const driver = allDrivers[i];
    if (!driver.vehicleId && allVehicles[i % allVehicles.length]) {
      await prisma.driver.update({ where: { id: driver.id }, data: { vehicleId: allVehicles[i % allVehicles.length].id } });
      console.log("✅ Assigné:", driver.driverCode, "->", allVehicles[i % allVehicles.length].plate);
    }
  }

  console.log('✅ Seed terminé');
}

seed().catch(e => { console.error(e); process.exit(1); });
 
