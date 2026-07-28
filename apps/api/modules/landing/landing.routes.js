const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [orgCount, driverCount, vehicleCount] = await Promise.all([
      prisma.organization.count(),
      prisma.driver.count(),
      prisma.vehicle.count()
    ]);
    res.json({ organizations: orgCount, drivers: driverCount, vehicles: vehicleCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/landing-content', async (req, res) => {
  try {
    const content = await prisma.landingContent.findMany({ where: { active: true } });
    res.json(content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin : modifier le contenu landing
router.put('/landing-content/:section', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, body, imageUrl, active } = req.body;
    const content = await prisma.landingContent.upsert({
      where: { section: req.params.section },
      update: { title, subtitle, body, imageUrl, active },
      create: { section: req.params.section, title, subtitle, body, imageUrl, active }
    });
    res.json(content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
