const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

// Courses
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
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

module.exports = router;
