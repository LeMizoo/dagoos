const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed démarré...');

  // Plans
  const plans = [
    { type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
    { type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
    { type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
    { type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
    { type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
    { type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
    { type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60 },
    { type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 },
  ];

  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { type: p.type, name: p.name } });
    if (!existing) { await prisma.plan.create({ data: p }); console.log('✅ Plan:', p.type, p.name); }
  }

  // Organisations
  const orgs = [
    { name: 'Flotte Alasora', code: 'AL', slug: 'flotte-alasora', type: 'FLEET_MANAGER', email: 'flotte-alasora@dagoos.mg', phone: '0340000001', plan: 'Freemium' },
    { name: 'Flotte Rasoa', code: 'RA', slug: 'flotte-rasoa', type: 'FLEET_MANAGER', email: 'flotte-rasoa@dagoos.mg', phone: '0340000002', plan: 'Basic' },
    { name: 'Cooperative Tana', code: 'TN', slug: 'coop-tana', type: 'COOPERATIVE', email: 'coop-tana@dagoos.mg', phone: '0340000003', plan: 'Freemium' },
    { name: 'Cooperative Tamatave', code: 'TM', slug: 'coop-tamatave', type: 'COOPERATIVE', email: 'coop-tamatave@dagoos.mg', phone: '0340000004', plan: 'Standard' },
  ];

  for (const o of orgs) {
    const existing = await prisma.organization.findUnique({ where: { email: o.email } });
    if (!existing) { await prisma.organization.create({ data: o }); console.log('✅ Organisation:', o.name); }
  }

  // Utilisateurs
  const users = [
    { name: 'Fleet Freemium', email: 'fleet-freemium@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Freemium' },
    { name: 'Fleet Basic', email: 'fleet-basic@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Basic' },
    { name: 'Fleet Standard', email: 'fleet-standard@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Standard' },
    { name: 'Fleet Premium', email: 'fleet-premium@test.mg', password: '123456', role: 'FLEET_MANAGER', plan: 'Premium' },
    { name: 'Coop Freemium', email: 'coop-freemium@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Freemium' },
    { name: 'Coop Basic', email: 'coop-basic@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Basic' },
    { name: 'Coop Standard', email: 'coop-standard@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Standard' },
    { name: 'Coop Premium', email: 'coop-premium@test.mg', password: '123456', role: 'COOPERATIVE', plan: 'Premium' },
    { name: 'Super Admin', email: 'admin@dagoos.mg', password: 'admin123', role: 'SUPER_ADMIN' },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const user = await prisma.user.create({ data: { name: u.name, email: u.email, password: u.password, role: u.role } });
      console.log('✅ Utilisateur:', u.email);
      
      // Créer l'organisation automatiquement pour les comptes test
      if (u.role === 'FLEET_MANAGER' || u.role === 'COOPERATIVE') {
        const code = u.role === 'FLEET_MANAGER' ? 'FL-' + u.name.substring(0,4).toUpperCase().replace(/ /g,'') : 'CO-' + u.name.substring(0,4).toUpperCase().replace(/ /g,'');
        const orgExists = await prisma.organization.findUnique({ where: { email: u.email } });
        if (!orgExists) {
          await prisma.organization.create({
            data: {
              name: u.name,
              code: code,
              slug: u.name.toLowerCase().replace(/ /g,'-'),
              type: u.role,
              email: u.email,
              plan: u.plan || 'Freemium',
              status: 'active'
            }
          });
          console.log('✅ Organisation test:', u.name);
        }
      }
    }
  }

  console.log('✅ Seed terminé !');
}

main().catch(console.error).finally(() => prisma.$disconnect());
