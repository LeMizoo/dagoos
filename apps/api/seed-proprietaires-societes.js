const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Création des propriétaires et sociétés...');

  // 1. Créer un Proprietaire pour chaque utilisateur Fleet
  const fleetUsers = await prisma.user.findMany({
    where: { role: 'FLEET_MANAGER' },
    include: { driver: true },
  });

  for (const user of fleetUsers) {
    // Trouver l'organisation de ce fleet manager
    const org = await prisma.organization.findFirst({
      where: { email: user.email },
    });

    if (!org) {
      console.log(`  ⚠️ Pas d'organisation pour ${user.email}`);
      continue;
    }

    // Créer le propriétaire
    let proprietaire = await prisma.proprietaire.findFirst({
      where: { email: user.email },
    });

    if (!proprietaire) {
      proprietaire = await prisma.proprietaire.create({
        data: {
          name: user.name || org.name,
          email: user.email,
          phone: user.phone || org.phone,
        },
      });
      console.log(`  ✅ Propriétaire: ${proprietaire.name}`);
    }

    // Rattacher les véhicules de cette organisation au propriétaire
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: org.id, proprietaireId: null },
    });

    for (const v of vehicles) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: { proprietaireId: proprietaire.id },
      });
    }
    if (vehicles.length > 0) {
      console.log(`    🚗 ${vehicles.length} véhicules rattachés à ${proprietaire.name}`);
    }
  }

  // 2. Créer une Societe pour chaque utilisateur Coop
  const coopUsers = await prisma.user.findMany({
    where: { role: 'COOPERATIVE' },
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

  for (const user of coopUsers) {
    const org = await prisma.organization.findFirst({
      where: { email: user.email },
    });

    if (!org) {
      console.log(`  ⚠️ Pas d'organisation pour ${user.email}`);
      continue;
    }

    const config = societesData[org.name] || { activite: 'Transport', adresse: 'Madagascar' };

    let societe = await prisma.societe.findFirst({
      where: { organizationId: org.id },
    });

    if (!societe) {
      societe = await prisma.societe.create({
        data: {
          organizationId: org.id,
          activite: config.activite,
          adresse: config.adresse,
        },
      });
      console.log(`  ✅ Société: ${org.name} - ${config.activite}`);
    }

    // Rattacher les véhicules de cette organisation à la société
    // (Note: Vehicle n'a pas de societeId dans le schéma actuel, on utilise organizationId)
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: org.id },
    });

    if (vehicles.length > 0) {
      console.log(`    🚗 ${vehicles.length} véhicules pour ${org.name}`);
    } else {
      // Créer 2 véhicules pour cette société
      const plaques = ['T-1234', 'T-5678', 'D-3456', 'F-1234', 'H-9012', 'M-7890', 'B-1111', 'C-2222'];
      for (let i = 0; i < 2; i++) {
        const plate = plaques[Math.floor(Math.random() * plaques.length)] + ' ' + (i + 1) + '-' + org.code;
        try {
          await prisma.vehicle.upsert({
            where: { plate },
            update: { organizationId: org.id, status: 'active' },
            create: {
              organizationId: org.id,
              plate,
              model: ['Toyota Coaster', 'Mercedes Sprinter', 'Hyundai H1'][i],
              year: 2020 + i,
              currentKm: Math.floor(Math.random() * 100000),
              status: 'active',
            },
          });
        } catch (e) {
          console.log(`    ⚠️ Véhicule ignoré: ${e.message}`);
        }
      }
      console.log(`    🚗 2 véhicules créés pour ${org.name}`);
    }
  }

  console.log('✅ Seed terminé !');
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
