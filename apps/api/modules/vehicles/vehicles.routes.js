const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      // Chercher d'abord via driver
      const userWithOrg = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { driver: { select: { organizationId: true } } }
      });
      if (userWithOrg?.driver?.organizationId) {
        where = { organizationId: userWithOrg.driver.organizationId };
      } else {
        // Sinon, chercher via l'email de l'organisation (FLEET_MANAGER / COOPERATIVE)
        const org = await prisma.organization.findFirst({
          where: { email: req.user.email }
        });
        if (org) {
          where = { organizationId: org.id };
        }
      }
    }
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { organization: true, proprietaire: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
