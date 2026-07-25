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
    message: '<i class="fas fa-rocket"></i> Dagoo\'s API - La mobilité connectée... Chez les potes, ça roule.',
    version: '1.0.0',
    status: 'Dago ready ! <i class="fas fa-flag"></i>'
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
app.put("/api/organizations/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, email, plan, status } = req.body;
        const org = await prisma.organization.update({ where: { id: req.params.id }, data: { name, email, plan, status } });
        res.json(org);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch("/api/organizations/:id/status", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { status } = req.body;
        const org = await prisma.organization.update({ where: { id: req.params.id }, data: { status } });
        res.json(org);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

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

// ===== ROUTE PUBLIQUE STATS (landing page) =====
app.get("/api/stats", async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const [orgs, drivers] = await Promise.all([
            prisma.organization.findMany({ select: { type: true } }),
            prisma.driver.findMany({ select: { id: true } })
        ]);
        res.json({
            fleets: orgs.filter(o => o.type === "FLEET_MANAGER").length,
            coops: orgs.filter(o => o.type === "COOPERATIVE").length,
            drivers: drivers.length
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/drivers", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const bcrypt = require("bcryptjs");
        const prisma = new PrismaClient();
        const { name, driverCode, pin, organizationId } = req.body;
        const hashedPin = await bcrypt.hash(pin, 10);
        const user = await prisma.user.create({ data: { name, email: driverCode + "@driver.dagoos.mg", password: hashedPin, role: "DRIVER" } });
        const driver = await prisma.driver.create({ data: { userId: user.id, organizationId, driverCode, pin: hashedPin, status: "active" } });
        res.status(201).json(driver);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/vehicles", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const vehicles = await prisma.vehicle.findMany({ orderBy: { plate: "asc" } });
        res.json(vehicles);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/vehicles", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { plate, model, year, currentKm, nextMaintenanceKm } = req.body;
        const vehicle = await prisma.vehicle.create({ data: { plate, model, year: parseInt(year), currentKm: parseInt(currentKm), nextMaintenanceKm: parseInt(nextMaintenanceKm) } });
        res.status(201).json(vehicle);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/vehicles/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { currentKm, nextMaintenanceKm, insuranceDate, vignetteDate, status } = req.body;
        const data = {};
        if (currentKm !== undefined) data.currentKm = parseInt(currentKm);
        if (nextMaintenanceKm !== undefined) data.nextMaintenanceKm = parseInt(nextMaintenanceKm);
        if (insuranceDate !== undefined) data.insuranceDate = insuranceDate;
        if (vignetteDate !== undefined) data.vignetteDate = vignetteDate;
        if (status) data.status = status;
        const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
        res.json(vehicle);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/drivers/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { status } = req.body;
        const driver = await prisma.driver.update({ where: { id: req.params.id }, data: { status } });
        res.json(driver);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== ROUTES DRIVERS (publique) =====
app.get("/api/drivers", async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const drivers = await prisma.driver.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                organization: { select: { id: true, name: true, code: true, type: true, email: true } }
            },
            orderBy: { createdAt: "desc" }
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

app.put("/api/messages/:id/reply", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { reply } = req.body;
        const updated = await prisma.message.update({
            where: { id: req.params.id },
            data: { reply, replied: true, repliedAt: new Date(), repliedBy: req.user.email, read: true }
        });
        res.json(updated);
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

// ===== ROUTES PLANS =====
app.get("/api/plans", async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } });
        res.json(plans);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put("/api/plans", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { plans } = req.body;
        for (const plan of plans) {
            await prisma.plan.upsert({
                where: { id: plan.id || "new" },
                update: { name: plan.name, price: plan.price, vehiclesMax: plan.vehiclesMax, driversMax: plan.driversMax, active: plan.active },
                create: { type: plan.type, name: plan.name, price: plan.price, vehiclesMax: plan.vehiclesMax, driversMax: plan.driversMax, active: plan.active }
            });
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== LANDING CONTENT =====
app.get("/api/landing-content", async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const content = await prisma.landingContent.findMany({ where: { active: true } });
        res.json(content);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/landing-content", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { sections } = req.body;
        for (const s of sections) {
            await prisma.landingContent.upsert({
                where: { section: s.section },
                update: { title: s.title, subtitle: s.subtitle, body: s.body, imageUrl: s.imageUrl },
                create: { section: s.section, title: s.title, subtitle: s.subtitle, body: s.body, imageUrl: s.imageUrl }
            });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== LANDING CONTENT =====
app.get("/api/landing-content", async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const content = await prisma.landingContent.findMany({ where: { active: true } });
        res.json(content);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/landing-content", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { sections } = req.body;
        for (const s of sections) {
            await prisma.landingContent.upsert({
                where: { section: s.section },
                update: { title: s.title, subtitle: s.subtitle, body: s.body, imageUrl: s.imageUrl },
                create: { section: s.section, title: s.title, subtitle: s.subtitle, body: s.body, imageUrl: s.imageUrl }
            });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== TRANSACTIONS =====
app.get("/api/transactions", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const transactions = await prisma.log.findMany({
            where: { action: { startsWith: "PAYMENT_" } },
            orderBy: { createdAt: "desc" },
            take: 50
        });
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/transactions", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { type, montant, organisation, methode, details } = req.body;
        const log = await prisma.log.create({
            data: {
                userId: req.user.id,
                action: "PAYMENT_" + type,
                details: JSON.stringify({ montant, organisation, methode, details })
            }
        });
        res.status(201).json(log);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== PROPRIETAIRES =====
app.get("/api/proprietaires", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const props = await prisma.proprietaire.findMany({ include: { vehicles: { select: { plate: true, model: true } } }, orderBy: { name: "asc" } });
        res.json(props);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post("/api/proprietaires", authMiddleware, async (req, res) => {
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
    try {
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
        const { PrismaClient } = require("@prisma/client");
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
        const prisma = new PrismaClient();
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
        const { name, cin, phone, email, address, organizationId } = req.body;
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
        const p = await prisma.proprietaire.create({ data: { name, cin, phone, email, address, organizationId } });
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
        res.status(201).json(p);
app.put("/api/proprietaires/:id", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { name, cin, phone, email, address, status } = req.body;
        const p = await prisma.proprietaire.update({ where: { id: req.params.id }, data: { name, cin, phone, email, address, status } });
        res.json(p);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/finances/stats", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const today = new Date().toISOString().split("T")[0];
        const caJour = await prisma.course.aggregate({ _sum: { price: true }, where: { date: { gte: new Date(today) } } });
        const caSemaine = await prisma.course.aggregate({ _sum: { price: true }, where: { date: { gte: new Date(Date.now() - 7*24*60*60*1000) } } });
        const caMois = await prisma.course.aggregate({ _sum: { price: true }, where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });
        const nbCoursesJour = await prisma.course.count({ where: { date: { gte: new Date(today) } } });
        const commissionsJour = await prisma.course.aggregate({ _sum: { commission: true }, where: { date: { gte: new Date(today) } } });
        res.json({ caJour: caJour._sum.price || 0, caSemaine: caSemaine._sum.price || 0, caMois: caMois._sum.price || 0, nbCoursesJour, commissionsJour: commissionsJour._sum.commission || 0 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== COURSES =====
app.get("/api/courses", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const courses = await prisma.course.findMany({ orderBy: { date: "desc" }, take: 100 });
        res.json(courses);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post("/api/courses", authMiddleware, async (req, res) => {
    try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        const { driverId, vehicleId, distanceKm, price, commission } = req.body;
        const course = await prisma.course.create({ data: { driverId, vehicleId, distanceKm: parseFloat(distanceKm), price: parseFloat(price), commission: parseFloat(commission || 0) } });
        res.status(201).json(course);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== DÉMARRAGE =====
app.listen(port, () => {
  console.log(`<i class="fas fa-check-circle"></i> Dagoo's API lancée sur http://localhost:${port}`);
  console.log(`<i class="fas fa-flag"></i>  Salama Dago !`);
}); 
 
