const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const email = 'tovoniaina.rahendrison@gmail.com';
  const password = 'ByGagoos@2024!';
  
  const hashed = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role: 'SUPER_ADMIN', name: 'Tovoniaina' }
    });
    console.log('✅ Compte mis à jour :', email);
    console.log('   Mot de passe :', password);
    console.log('   Rôle : SUPER_ADMIN');
  } else {
    await prisma.user.create({
      data: { name: 'Tovoniaina', email, password: hashed, role: 'SUPER_ADMIN' }
    });
    console.log('✅ Compte créé :', email);
    console.log('   Mot de passe :', password);
  }
}

reset().catch(console.error).finally(() => prisma.$disconnect());
