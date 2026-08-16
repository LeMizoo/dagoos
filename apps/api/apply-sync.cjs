const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sql = fs.readFileSync(
  'prisma/sync-supabase.sql',
  'utf8'
);

// Supprime les commentaires SQL
const cleaned = sql.replace(/--.*$/gm, '');

// Le script actuel ne contient pas de ';' dans les valeurs texte.
// On peut donc découper proprement les instructions.
const statements = cleaned
  .split(';')
  .map(s => s.trim())
  .filter(Boolean)
  .filter(s => s !== 'BEGIN')
  .filter(s => s !== 'COMMIT');

(async () => {
  let success = 0;

  try {
    console.log('==============================================');
    console.log(' SYNCHRONISATION SUPABASE VIA POOLER');
    console.log('==============================================');
    console.log(`Instructions SQL : ${statements.length}`);
    console.log('');

    // Connexion initiale
    await prisma.$connect();

    console.log('Connexion Prisma : OK');
    console.log('');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      const firstLine =
        statement
          .split('\n')
          .map(line => line.trim())
          .find(Boolean) || '';

      console.log(`[${i + 1}/${statements.length}] ${firstLine}`);

      try {
        await prisma.$executeRawUnsafe(statement);

        success++;
        console.log('    OK');
      } catch (error) {
        console.error('');
        console.error(`    ECHEC A L'INSTRUCTION ${i + 1}`);
        console.error(`    ${error.message}`);
        console.error('');
        console.error('==============================================');
        console.error(`SYNC INTERROMPUE : ${success}/${statements.length}`);
        console.error('==============================================');

        process.exitCode = 1;
        return;
      }
    }

    console.log('');
    console.log('==============================================');
    console.log(' SYNC SUPABASE : OK');
    console.log('==============================================');
    console.log(`Instructions exécutées : ${success}/${statements.length}`);
  } catch (error) {
    console.error('');
    console.error('==============================================');
    console.error(' ERREUR DE CONNEXION / EXECUTION');
    console.error('==============================================');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
