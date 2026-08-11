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

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: req.user.role === 'DRIVER' 
        ? { id: req.user.driverId }
        : { userId: req.user.id },
      include: { user: true, organization: true, vehicle: true }
    });
    if (!driver) return res.status(404).json({ error: 'Chauffeur non trouv�' });
    res.json(driver);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PWA Driver : Shift & Statut ---
router.get('/me/status', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { status: true }
    });
    return res.json({ status: driver ? driver.status : 'OFFLINE' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/shift/start', authMiddleware, async (req, res) => {
  try {
    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'active' }
    });
    return res.json({ success: true, status: 'active' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur d�marrage service' });
  }
});

router.post('/shift/pause', authMiddleware, async (req, res) => {
  try {
    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'pause' }
    });
    return res.json({ success: true, status: 'pause' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur pause' });
  }
});

router.post('/shift/end', authMiddleware, async (req, res) => {
  try {
    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'inactive' }
    });
    return res.json({ success: true, status: 'inactive' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur fin de service' });
  }
});

module.exports = router;
