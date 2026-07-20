const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seed: vérification SUPER_ADMIN...');
  
  const email = 'tovoniaina.rahendrison@gmail.com';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (!existing) {
    const hashedPassword = await bcrypt.hash('ByDagoos2026!', 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Tovoniaina RAHENDRISON',
        phone: '0340700405',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('✅ SUPER_ADMIN créé');
  } else {
    console.log('✅ SUPER_ADMIN existe déjà');
  }
  
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error('❌ Erreur seed:', e);
  process.exit(1);
});
