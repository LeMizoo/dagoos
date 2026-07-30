const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllOrgs() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        status: true,
        plan: true
      }
    });
    
    console.log('\n📋 Toutes les organisations:\n');
    console.log('='.repeat(80));
    console.log('ID | Nom | Slug | Type | Statut | Plan');
    console.log('-'.repeat(80));
    
    orgs.forEach(o => {
      console.log(`${o.id.substring(0,8)} | ${o.name.padEnd(20)} | ${o.slug.padEnd(15)} | ${o.type.padEnd(6)} | ${o.status.padEnd(8)} | ${o.plan}`);
    });
    
    console.log('='.repeat(80));
    console.log(`\n📝 Total: ${orgs.length} organisations`);
    
    // Afficher les types présents
    const types = [...new Set(orgs.map(o => o.type))];
    console.log(`\n🏷️ Types présents: ${types.join(', ')}`);
    
    // Vérifier si des organisations ont un slug null
    const nullSlugs = orgs.filter(o => !o.slug);
    if (nullSlugs.length > 0) {
      console.log(`\n⚠️ ${nullSlugs.length} organisation(s) sans slug:`, nullSlugs.map(o => o.name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listAllOrgs();
