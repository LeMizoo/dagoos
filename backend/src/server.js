const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
// Routes de bienvenue
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dagoo\'s API - La mobilité connectée... Chez les potes, ça roule.',
    version: '1.0.0',
    status: 'Dago ready ! 🇲🇬'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Salama Dago ! L\'API fonctionne parfaitement ✅',
    data: {
      features: ['Auth', 'Fleets', 'Drivers', 'Trips', 'Payments'],
      slogan: 'La mobilité connectée... Chez les potes, ça roule.'
    }
  });
});

// ===== IMPORTER LES MIDDLEWARES =====
const authMiddleware = require('./middleware/auth');

// ===== ROUTES D'AUTHENTIFICATION =====
const authController = require('./modules/auth/auth.controller');

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authMiddleware, authController.profile);

// ===== ROUTE POUR RÉCUPÉRER LES UTILISATEURS =====
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const requestingUser = req.user;
        let users = [];
        
        // SUPER_ADMIN et ADMIN voient tout
        if (requestingUser.role === 'SUPER_ADMIN' || requestingUser.role === 'ADMIN') {
            users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        // FLEET_MANAGER voit ses chauffeurs et lui-même
        else if (requestingUser.role === 'FLEET_MANAGER') {
            users = await prisma.user.findMany({
                where: {
                    OR: [
                        { id: requestingUser.id },
                        { role: 'DRIVER' }
                    ]
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        // COOPERATIVE voit ses membres
        else if (requestingUser.role === 'COOPERATIVE') {
            users = await prisma.user.findMany({
                where: {
                    OR: [
                        { id: requestingUser.id },
                        { cooperativeId: requestingUser.id }
                    ]
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        // DRIVER ne voit que lui-même
        else {
            users = await prisma.user.findMany({
                where: { id: requestingUser.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        
        res.json(users);
    } catch (error) {
        console.error('Erreur /api/users:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ROUTES DE GESTION DES CHAUFFEURS =====
const fleetController = require('./modules/fleet/fleet.controller');

app.post('/api/fleet/drivers', authMiddleware, fleetController.addDriver);
app.get('/api/fleet/drivers', authMiddleware, fleetController.getDrivers);
app.get('/api/fleet/drivers/:id', authMiddleware, fleetController.getDriver);
app.put('/api/fleet/drivers/:id', authMiddleware, fleetController.updateDriver);
app.delete('/api/fleet/drivers/:id', authMiddleware, fleetController.deleteDriver);

// ===== DÉMARRAGE =====
app.listen(port, () => {
  console.log(`✅ Dagoo's API lancée sur http://localhost:${port}`);
  console.log(`🏷️  Slogan : La mobilité connectée... Chez les potes, ça roule.`);
  console.log(`🇲🇬  Salama Dago !`);
});
