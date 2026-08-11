const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Si SUPER_ADMIN ou ADMIN, voir tous les chauffeurs
    // Sinon, filtrer par l'organisation de l'utilisateur
    let where = {};
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      // Récupérer l'organisation de l'utilisateur
      const userWithOrg = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { driver: { select: { organizationId: true } } }
      });
      if (userWithOrg?.driver?.organizationId) {
        where = { organizationId: userWithOrg.driver.organizationId };
      } else {
        // Pour FLEET_MANAGER / COOPERATIVE, chercher par email
        const org = await prisma.organization.findFirst({
          where: { email: req.user.email }
        });
        if (org) {
          where = { organizationId: org.id };
        }
      }
    }
    const drivers = await prisma.driver.findMany({
      where,
      include: { user: true, organization: true, vehicle: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { email, password, driverCode, pin, firstName, lastName, phone, organizationId, vehicleId, status, license } = req.body;
    
    // Créer ou récupérer le User associé
    let user;
    if (email) {
      user = await prisma.user.upsert({
        where: { email },
        update: { name: `${firstName || ''} ${lastName || ''}`.trim(), role: 'DRIVER' },
        create: {
          email,
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          password: password || pin || '1234',
          role: 'DRIVER',
          phone: phone || '',
        },
      });
    } else if (driverCode) {
      // Générer un email basé sur le code
      const generatedEmail = `${driverCode.toLowerCase()}@driver.dagoos.mg`;
      user = await prisma.user.upsert({
        where: { email: generatedEmail },
        update: { name: `${firstName || ''} ${lastName || ''}`.trim(), role: 'DRIVER' },
        create: {
          email: generatedEmail,
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          password: password || pin || '1234',
          role: 'DRIVER',
          phone: phone || '',
        },
      });
    } else {
      return res.status(400).json({ error: 'Email ou driverCode requis' });
    }
    
    // Créer le Driver
    const driver = await prisma.driver.upsert({
      where: { driverCode: driverCode || `DRV-${user.id}` },
      update: { organizationId, vehicleId, status, license, pin: pin || '1234' },
      create: {
        userId: user.id,
        organizationId,
        driverCode: driverCode || `DRV-${user.id}`,
        pin: pin || '1234',
        vehicleId: vehicleId || null,
        status: status || 'active',
        license: license || null,
      },
    });
    
    res.status(201).json(driver);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { driverCode, pin, status, vehicleId } = req.body;
    const data = {};
    if (driverCode !== undefined) data.driverCode = driverCode;
    if (pin !== undefined) data.pin = pin;
    if (status !== undefined) data.status = status;
    if (vehicleId !== undefined) data.vehicleId = vehicleId;

    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data,
      include: { user: true, organization: true, vehicle: true }
    });
    res.json(driver);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
