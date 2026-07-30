const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlugs() {
  try {
    // Vérifier les flottes
    const fleets = await prisma.organization.findMany({
      where: { type: 'FLEET' },
      select: { slug: true, name: true, type: true }
    });
    
    // Vérifier les coopératives
    const coops = await prisma.organization.findMany({
      where: { type: 'COOP' },
      select: { slug: true, name: true, type: true }
    });
    
    console.log('🚛 Flottes:', fleets);
    console.log('🏢 Coopératives:', coops);
    
    console.log('\n📋 URLs à tester:');
    fleets.forEach(f => console.log(`http://localhost:5001/fleet/${f.slug}`));
    coops.forEach(c => console.log(`http://localhost:5001/coop/${c.slug}`));
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlugs();
