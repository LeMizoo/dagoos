import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...\n');

  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@dagoos.mg')).get();
  
  if (existingAdmin) {
    console.log('⚠️  Admin existe déjà :');
    console.log(`   Email    : ${existingAdmin.email}`);
    console.log(`   Rôle     : ${existingAdmin.role}`);
    console.log('\n✅ Aucune modification nécessaire.\n');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await db.insert(users).values({
    id: uuidv4(),
    name: 'Super Admin',
    email: 'admin@dagoos.mg',
    password: hashedPassword,
    role: 'ADMIN',
    phone: '+261 00 000 00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Admin créé avec succès !\n');
  console.log('   📧 Email    : admin@dagoos.mg');
  console.log('   🔑 Password : admin123');
  console.log('   👤 Rôle     : ADMIN\n');
}

seed()
  .then(() => { console.log('🎉 Seed terminé.\n'); process.exit(0); })
  .catch((err) => { console.error('❌ Erreur :', err); process.exit(1); });
