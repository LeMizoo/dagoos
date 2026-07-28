const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { user: true, organization: true, vehicle: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
