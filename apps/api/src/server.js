const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dagoo\'s API - La mobilité connectée... Chez les potes, ça roule.',
    version: '1.0.0',
    status: 'Dago ready ! 🇲🇬'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ===== IMPORTS =====
const authMiddleware = require('./middleware/auth');
const authController = require('./modules/auth/auth.controller');

// ===== ROUTES AUTH =====
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/driver-login', authController.driverLogin);
app.get('/api/auth/profile', authMiddleware, authController.profile);

// ===== ROUTES ORGANISATIONS =====
app.get('/api/organizations', authController.getOrganizations);

// ===== ROUTES UTILISATEURS (protégé) =====
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== DÉMARRAGE =====
app.listen(port, () => {
  console.log(`✅ Dagoo's API lancée sur http://localhost:${port}`);
  console.log(`🇲🇬  Salama Dago !`);
});
