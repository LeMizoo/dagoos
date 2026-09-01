const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');
const { authMiddleware } = require('./middleware/auth');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5001,https://dago-mobility.vercel.app,https://dago-driver.pages.dev,https://dago-coop-driver.pages.dev,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origine non autorisée par CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Space"],
  maxAge: 86400,
}));
app.use(express.json({ 
  limit: "100kb",
  type: ['application/json', 'application/json; charset=utf-8']
}));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// =========================================================
// ROUTES API
// =========================================================

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/organizations', require('./modules/organizations/organizations.routes'));
app.use('/api/drivers', require('./modules/drivers/drivers.routes'));
app.use('/api/drivers', require('./modules/drivers/dossier.routes'));
app.use('/api/vehicles', require('./modules/vehicles/vehicles.routes'));
app.use('/api/maintenance', require('./modules/maintenance/maintenance.routes'));
app.use('/api/proprietaires', require('./modules/proprietaires/proprietaires.routes'));
app.use('/api/societes', require('./modules/societes/societes.routes'));
app.use('/api/contrats', require('./modules/contrats/contrats.routes'));
app.use('/api/livraisons', require('./modules/livraisons/livraisons.routes'));
app.use('/api/plans', require('./modules/plans/plans.routes'));
app.use('/api/tarifs', require('./modules/tarifs/tarifs.routes'));
app.use('/api/messages', require('./modules/messages/messages.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/logs', require('./modules/logs.routes'));
app.use('/api/finances', require('./modules/finances/finances.routes'));
app.use('/api', require('./modules/landing/landing.routes'));
app.use('/api/departs', require('./modules/departs/departs.routes'));
app.use('/api/reservations', require('./modules/reservations/reservations.routes'));
app.use('/api/actions', require('./modules/actions/actions.routes'));
app.use('/api/public', require('./modules/public/public.routes'));
app.use('/api/sessions', require('./modules/sessions/sessions.routes'));

// =========================================================
// HEALTH
// =========================================================

app.get('/api', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      message: "Dagoo's API - La mobilité connectée",
      status: 'online',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      message: "Dagoo's API - La mobilité connectée",
      status: 'degraded',
      database: 'disconnected',
      error: error.message
    });
  }
});

// =========================================================
// ROUTES PUBLIQUES DRIVER
// =========================================================

// Informations publiques d'un chauffeur
app.get('/api/public/driver/:id', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        vehicle: true,
        organization: true
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Chauffeur introuvable'
      });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Véhicule affecté à un chauffeur
app.get('/api/public/vehicles/:driverId', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.driverId },
      include: {
        vehicle: true
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Chauffeur introuvable'
      });
    }

    res.json(driver.vehicle ? [driver.vehicle] : []);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Organisations publiques
app.get('/api/public/organizations', async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(organizations);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Courses d'un chauffeur

app.get('/api/public/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });
    res.json(plans);
  } catch (e) {
    console.error('Erreur plans publics:', e);
    res.status(500).json({ error: e.message });
  }
});
app.get('/api/public/trips/:driverId', authMiddleware, async (req, res) => {
  try {
    const where = {
      driverId: req.params.driverId
    };

    if (req.query.date) {
      const date = new Date(req.query.date);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Date invalide'
        });
      }

      where.createdAt = {
        gte: date
      };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(trips);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =========================================================
// ERROR HANDLER
// =========================================================

app.use((err, req, res, next) => {
  console.error('API ERROR:', err);

  res.status(500).json({
    error: 'Erreur interne du serveur'
  });
});

// =========================================================
// START
// =========================================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
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
