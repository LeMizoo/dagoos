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

// ===== ROUTES DRIVERS (protégé) =====
app.get('/api/drivers', authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const drivers = await prisma.driver.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                organization: { select: { id: true, name: true, code: true, type: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROUTES LOGS =====
app.get("/api/logs", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const logs = await prisma.log.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROUTES MESSAGES =====
app.get("/api/messages", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const messages = await prisma.message.findMany({
            include: { organization: { select: { name: true, code: true, type: true, logo: true } } },
            orderBy: { createdAt: "desc" },
            take: 100
        });
        res.json(messages);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/api/messages/unread-count", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const count = await prisma.message.count({ where: { read: false } });
        res.json({ count });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/messages/:id/read", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        await prisma.message.update({ where: { id: req.params.id }, data: { read: true } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/messages", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { organizationId, subject, content, type } = req.body;
        const message = await prisma.message.create({
            data: { organizationId, subject, content, type: type || "info" }
        });
        res.status(201).json(message);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== DÉMARRAGE =====
app.listen(port, () => {
  console.log(`✅ Dagoo's API lancée sur http://localhost:${port}`);
  console.log(`🇲🇬  Salama Dago !`);
});
