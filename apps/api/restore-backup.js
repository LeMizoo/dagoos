const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const backupPath = path.join(__dirname, 'prisma', 'dagoos-backup.sql');

async function restoreIfNeeded() {
  // Si la BDD existe déjà, ne rien faire
  if (fs.existsSync(dbPath)) {
    console.log('✅ BDD existante, pas de restauration nécessaire');
    return;
  }

  console.log('🔄 BDD absente, création et restauration...');
  
  // Créer la BDD via prisma db push
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'pipe', timeout: 60000 });
    console.log('✅ Schéma créé');
  } catch (e) {
    console.error('❌ Erreur db push:', e.message);
    return;
  }

  // Restaurer les données depuis le backup SQL
  if (fs.existsSync(backupPath)) {
    try {
      execSync(`sqlite3 ${dbPath} < ${backupPath}`, { stdio: 'pipe', timeout: 60000 });
      console.log('✅ Données restaurées depuis le backup');
    } catch (e) {
      console.error('❌ Erreur restauration:', e.message);
    }
  } else {
    console.log('⚠️ Pas de backup trouvé, BDD vide');
  }
}

restoreIfNeeded();
