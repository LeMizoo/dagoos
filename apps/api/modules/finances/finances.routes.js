const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

// Courses
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.query.driverId) {
      where.driverId = req.query.driverId;
    } else if (req.user.role === 'DRIVER' && req.user.driverId) {
      where.driverId = req.user.driverId;
    }
    const courses = await prisma.course.findMany({
      where,
      include: { driver: true, vehicle: true },
      orderBy: { date: 'desc' }
    });
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/courses', authMiddleware, async (req, res) => {
  try {
    const course = await prisma.course.create({ data: req.body });
    res.status(201).json(course);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Transactions (tous les paiements)
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({ orderBy: { date: 'desc' }, take: 200 });
    res.json(payments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Versements
router.get('/versements', authMiddleware, async (req, res) => {
  try {
    const versements = await prisma.versement.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(versements);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PWA Driver : Dépenses & Stats ---
router.post('/expenses', authMiddleware, async (req, res) => {
  try {
    const { category, amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }
    // Stocker dans une table ou log
    res.json({ success: true, category, amount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur dépense' });
  }
});

router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const courses = await prisma.course.findMany({
      where: { driverId: req.user.driverId, date: { gte: today } }
    });
    const count = courses.length;
    const ca = courses.reduce((s, c) => s + (c.price || 0), 0);
    const com = courses.reduce((s, c) => s + (c.commission || 0), 0);
    res.json({ today: { count, ca, com, net: ca - com }, week: { count, ca, com, net: ca - com } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats' });
  }
});

module.exports = router;
