// =========================================================
// DAGOO'S API — SERVER BOOTSTRAP
// =========================================================

const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

// =========================================================
// SHUTDOWN PROPRE
// =========================================================

async function shutdown(signal) {
  console.log(`${signal} reçu. Arrêt de l'API...`);

  server.close(async () => {
    await prisma.$disconnect();
    console.log('Prisma déconnecté.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
