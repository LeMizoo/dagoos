const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listSlugs() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        slug: true,
        name: true,
        type: true,
        status: true
      },
      orderBy: {
        type: 'asc'
      }
    });
    
    console.log('\n📋 Organisations disponibles:\n');
    console.log('='.repeat(60));
    
    const fleets = orgs.filter(o => o.type === 'FLEET');
    const coops = orgs.filter(o => o.type === 'COOP');
    
    if (fleets.length > 0) {
      console.log('\n🚛 FLOTTES:');
      fleets.forEach(f => {
        console.log(`  - ${f.name} (${f.slug}) [${f.status}]`);
      });
    } else {
      console.log('\n🚛 Aucune flotte trouvée');
    }
    
    if (coops.length > 0) {
      console.log('\n🏢 COOPÉRATIVES:');
      coops.forEach(c => {
        console.log(`  - ${c.name} (${c.slug}) [${c.status}]`);
      });
    } else {
      console.log('\n🏢 Aucune coopérative trouvée');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📝 Total: ${orgs.length} organisations`);
    
    // Afficher les URLs de test
    if (fleets.length > 0) {
      console.log('\n🔗 URLs de test (Flottes):');
      fleets.forEach(f => {
        console.log(`  http://localhost:5001/fleet/${f.slug}`);
      });
    }
    
    if (coops.length > 0) {
      console.log('\n🔗 URLs de test (Coopératives):');
      coops.forEach(c => {
        console.log(`  http://localhost:5001/coop/${c.slug}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listSlugs();
