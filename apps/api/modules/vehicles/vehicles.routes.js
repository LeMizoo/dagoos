const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { organization: true, proprietaire: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
