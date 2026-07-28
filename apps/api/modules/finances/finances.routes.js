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
    const { driverId, vehicleId, type, distanceKm, price, commission } = req.body;
    const course = await prisma.course.create({
      data: { driverId, vehicleId, type, distanceKm, price, commission }
    });
    res.status(201).json(course);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
