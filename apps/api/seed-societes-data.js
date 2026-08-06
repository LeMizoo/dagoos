const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSocietes() {
  console.log('🌱 Création des sociétés, véhicules et chauffeurs...');

  // Récupérer toutes les coopératives
  const coops = await prisma.organization.findMany({
    where: { type: 'COOPERATIVE' },
  });

  const societesData = {
    'SONATRA': { zone: 'Nationale', type: 'transport_commun', adresse: 'Antananarivo', activite: 'Transport national de passagers' },
    'ANTSIRABE – TANA': { zone: 'Régionale', type: 'transport_commun', adresse: 'Antsirabe - Antananarivo', activite: 'Transport régional' },
    'KOFMAD': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'TRANS BESADY RN7': { zone: 'Régionale', type: 'marchandises', adresse: 'RN7', activite: 'Transport de marchandises' },
    'TRANS MINO': { zone: 'Régionale', type: 'transport_commun', adresse: 'Région', activite: 'Transport régional' },
    'KOFIAM': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'MADA VOYAGE': { zone: 'Nationale', type: 'transport_commun', adresse: 'Antananarivo', activite: 'Transport national de voyageurs' },
    'KOFIMANGA': { zone: 'Régionale', type: 'transport_commun', adresse: 'Antananarivo - Moramanga', activite: 'Transport régional' },
    'TRANS 47': { zone: 'Régionale', type: 'transport_commun', adresse: 'RN47', activite: 'Transport régional' },
    'KOFISA': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'FIMPIMA': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'FIFIABE': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'KOFIFI': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
    'TRANS ROUTE': { zone: 'Régionale', type: 'transport_commun', adresse: 'Madagascar', activite: 'Transport régional' },
  };

  const plaques = ['T-1234', 'T-5678', 'T-9012', 'D-3456', 'D-7890', 'F-1234', 'F-5678', 'H-9012', 'H-3456', 'M-7890'];
  const modeles = ['Toyota Coaster', 'Mercedes Sprinter', 'Hyundai H1', 'Renault Master', 'Nissan Urvan', 'Ford Transit', 'Peugeot Boxer', 'Toyota Hiace'];

  for (const coop of coops) {
    const config = societesData[coop.name];
    if (!config) continue;

    // Créer la société
    let societe = await prisma.societe.findFirst({
      where: { organizationId: coop.id, activite: config.activite },
    });

    if (!societe) {
      societe = await prisma.societe.create({
        data: {
          organizationId: coop.id,
          activite: config.activite,
          adresse: config.adresse,
        },
      });
      console.log(`  ✅ Société: ${coop.name} - ${config.zone} - ${config.activite}`);
    }

    // Créer 2-3 véhicules pour cette société
    const existingVehicles = await prisma.vehicle.count({
      where: { organizationId: coop.id },
    });

    const nbVehicles = Math.max(0, 3 - existingVehicles);
    for (let i = 0; i < nbVehicles; i++) {
      const plate = plaques[Math.floor(Math.random() * plaques.length)] + ' ' + (i + 1);
      await prisma.vehicle.create({
        data: {
          organizationId: coop.id,
          plate,
          model: modeles[Math.floor(Math.random() * modeles.length)],
          year: 2018 + Math.floor(Math.random() * 7),
          currentKm: Math.floor(Math.random() * 150000) + 20000,
          status: 'active',
          type: config.type,
        },
      });
    }
    console.log(`    🚗 ${nbVehicles} véhicules ajoutés à ${coop.name}`);
  }

  console.log('✅ Seed sociétés terminé !');
  await prisma.$disconnect();
}

seedSocietes().catch(e => { console.error(e); process.exit(1); });
