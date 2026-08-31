const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function getUserOrganizationId(req) {
  if (req.user.organizationId) {
    return req.user.organizationId;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      driver: {
        select: { organizationId: true },
      },
    },
  });

  if (user?.driver?.organizationId) {
    return user.driver.organizationId;
  }

  const org = await prisma.organization.findFirst({
    where: { email: req.user.email },
    select: { id: true },
  });

  return org?.id || null;
}

function sanitizeDriver(driver) {
if (!driver) return driver;

const { pin, user, ...safeDriver } = driver;

if (user) {
const { password, ...safeUser } = user;

return {
...safeDriver,
user: safeUser,
};
}

return safeDriver;
}

async function canAccessOrganization(req, organizationId) {
  if (PRIVILEGED_ROLES.includes(req.user.role)) {
    return true;
  }

  if (!organizationId) {
    return false;
  }

  const userOrganizationId = await getUserOrganizationId(req);
  return userOrganizationId === organizationId;
}

/*
 * GET /api/drivers
 */
router.get('/', authMiddleware, requirePermission('drivers.read'), async (req, res) => {
  try {
    let where = {};

    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      const organizationId = await getUserOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          error: 'Organisation introuvable',
        });
      }

      where = { organizationId };
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: true,
        organization: true,
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(drivers.map(sanitizeDriver));
  } catch (error) {
    console.error('GET /drivers:', error);
    res.status(500).json({
      error: 'Erreur récupération chauffeurs',
    });
  }
});

/*
 * POST /api/drivers
 */
router.post('/', authMiddleware, requirePermission('drivers.manage'), async (req, res) => {
  try {
    const {
      email,
      password,
      driverCode,
      pin,
      firstName,
      lastName,
      phone,
      organizationId: requestedOrganizationId,
      vehicleId,
      status,
      license,
    } = req.body;

    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    let organizationId = requestedOrganizationId;

    if (!PRIVILEGED_ROLES.includes(req.user.role)) {
      const ownOrganizationId = await getUserOrganizationId(req);

      if (!ownOrganizationId) {
        return res.status(403).json({
          error: 'Organisation introuvable',
        });
      }

      if (
        requestedOrganizationId &&
        requestedOrganizationId !== ownOrganizationId
      ) {
        return res.status(403).json({
          error: 'Vous ne pouvez pas créer un chauffeur dans une autre organisation',
        });
      }

      organizationId = ownOrganizationId;
    }

    if (!organizationId) {
      return res.status(400).json({
        error: 'organizationId requis',
      });
    }

    if (!email && !driverCode) {
      return res.status(400).json({
        error: 'Email ou driverCode requis',
      });
    }

    /*
     * Vérifier que le véhicule appartient à la même organisation.
     */
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          error: 'Véhicule introuvable',
        });
      }

      if (vehicle.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'Le véhicule appartient à une autre organisation',
        });
      }
    }

    const name = `${firstName || ''} ${lastName || ''}`.trim();

    const generatedEmail = email
      ? email.trim().toLowerCase()
      : `${driverCode.toLowerCase()}@driver.dagoos.mg`;

    /*
     * Le compte User du chauffeur possède lui aussi un mot de passe.
     * On le hash systématiquement.
     */
    const plainPassword = password || pin || "1234";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    const hashedPin = await bcrypt.hash(pin || "1234", 12);

    const user = await prisma.user.upsert({
      where: { email: generatedEmail },
      update: {
        name,
        role: 'DRIVER',
        phone: phone || '',
        password: hashedPassword,
      },
      create: {
        email: generatedEmail,
        name,
        password: hashedPassword,
        role: 'DRIVER',
        phone: phone || '',
      },
    });

    const driver = await prisma.driver.upsert({
      where: {
        driverCode: driverCode || `DRV-${user.id}`,
      },
      update: {
        organizationId,
        vehicleId: vehicleId || null,
        status: status || 'active',
        license: license || null,
        pin: hashedPin,
      },
      create: {
        userId: user.id,
        organizationId,
        driverCode: driverCode || `DRV-${user.id}`,
        pin: hashedPin,
        vehicleId: vehicleId || null,
        status: status || 'active',
        license: license || null,
      },
      include: {
        user: true,
        organization: true,
        vehicle: true,
      },
    });

    res.status(201).json(sanitizeDriver(driver));
  } catch (error) {
    console.error('POST /drivers:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
 * PUT /api/drivers/:id
 */
router.put('/:id', authMiddleware, requirePermission('drivers.manage'), async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    const existingDriver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!existingDriver) {
      return res.status(404).json({
        error: 'Chauffeur introuvable',
      });
    }

    if (
      !(await canAccessOrganization(
        req,
        existingDriver.organizationId
      ))
    ) {
      return res.status(403).json({
        error: 'Accès à cette organisation refusé',
      });
    }

    const {
      driverCode,
      pin,
      status,
      vehicleId,
      license,
    } = req.body;

    const data = {};

    if (driverCode !== undefined) data.driverCode = driverCode;
    if (pin !== undefined) data.pin = await bcrypt.hash(String(pin), 12);
    if (status !== undefined) data.status = status;
    if (license !== undefined) data.license = license;

    if (vehicleId !== undefined) {
      if (vehicleId === null) {
        data.vehicleId = null;
      } else {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: {
            id: true,
            organizationId: true,
          },
        });

        if (!vehicle) {
          return res.status(404).json({
            error: 'Véhicule introuvable',
          });
        }

        if (vehicle.organizationId !== existingDriver.organizationId) {
          return res.status(403).json({
            error: 'Le véhicule appartient à une autre organisation',
          });
        }

        data.vehicleId = vehicleId;
      }
    }

    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data,
      include: {
        user: true,
        organization: true,
        vehicle: true,
      },
    });

    res.json(sanitizeDriver(driver));
  } catch (error) {
    console.error('PUT /drivers/:id:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
 * DELETE /api/drivers/:id
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('drivers.manage'),
  async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Chauffeur introuvable',
      });
    }

    if (!(await canAccessOrganization(req, driver.organizationId))) {
      return res.status(403).json({
        error: 'Accès à cette organisation refusé',
      });
    }

    await prisma.driver.delete({
      where: { id: req.params.id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /drivers/:id:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
 * GET /api/drivers/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findFirst({
      where:
        req.user.role === 'DRIVER'
          ? { id: req.user.driverId }
          : { userId: req.user.id },
      include: {
        user: true,
        organization: true,
        vehicle: true,
      },
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Chauffeur non trouvé',
      });
    }

    res.json(sanitizeDriver(driver));
  } catch (error) {
    console.error('GET /drivers/me:', error);

    res.status(500).json({
      error: 'Erreur récupération chauffeur',
    });
  }
});

/*
 * GET /api/drivers/me/status
 */
router.get('/me/status', authMiddleware, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { status: true },
    });

    return res.json({
      status: driver ? driver.status : 'OFFLINE',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erreur serveur',
    });
  }
});

/*
 * POST /api/drivers/shift/start
 */
router.post('/shift/start', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({
        error: 'Accès réservé aux chauffeurs',
      });
    }

    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'active' },
    });

    return res.json({
      success: true,
      status: 'active',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur démarrage service',
    });
  }
});

/*
 * POST /api/drivers/shift/pause
 */
router.post('/shift/pause', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({
        error: 'Accès réservé aux chauffeurs',
      });
    }

    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'pause' },
    });

    return res.json({
      success: true,
      status: 'pause',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur pause',
    });
  }
});

/*
 * POST /api/drivers/shift/end
 */
router.post('/shift/end', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({
        error: 'Accès réservé aux chauffeurs',
      });
    }

    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: 'inactive' },
    });

    return res.json({
      success: true,
      status: 'inactive',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur fin de service',
    });
  }
});

// PUT /api/drivers/me/status - Chauffeur change son propre statut
router.put('/me/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ error: 'Réservé aux chauffeurs' });
    }

    if (!req.user.driverId) {
      return res.status(400).json({ error: 'Chauffeur non associé' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Statut requis' });
    }

    const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const driver = await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status },
    });

    res.json(driver);
  } catch (error) {
    console.error('PUT /drivers/me/status:', error);
    res.status(500).json({ error: 'Erreur mise à jour statut' });
  }
});

// ========================================
// POINTAGE CHAUFFEUR
// ========================================

// GET /api/drivers/me/pointage - Statut du pointage aujourd'hui
router.get('/me/pointage', authMiddleware, async (req, res) => {
  try {
    if (!req.user.driverId) {
      return res.status(400).json({ error: 'Chauffeur non associé' });
    }

    const today = new Date().toISOString().split('T')[0];

    const pointage = await prisma.pointage.findFirst({
      where: {
        driverId: req.user.driverId,
        date: today
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      pointage: pointage || null,
      statut: pointage ? pointage.statut : 'NON_DEBUTE'
    });
  } catch (error) {
    console.error('GET /drivers/me/pointage:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/drivers/pointage - Pointer (debut/standby/reprise/fin)
router.post('/pointage', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ error: 'Réservé aux chauffeurs' });
    }

    if (!req.user.driverId) {
      return res.status(400).json({ error: 'Chauffeur non associé' });
    }

    const { type } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!['arrivee', 'pause', 'reprise', 'depart'].includes(type)) {
      return res.status(400).json({ error: 'Type de pointage invalide' });
    }

    // Vérifier le pointage actuel
    const pointageActuel = await prisma.pointage.findFirst({
      where: {
        driverId: req.user.driverId,
        date: today
      },
      orderBy: { createdAt: 'desc' }
    });

    let statut = '';
    if (type === 'arrivee') statut = 'PRESENT';
    if (type === 'pause') statut = 'PAUSE';
    if (type === 'reprise') statut = 'PRESENT';
    if (type === 'depart') statut = 'PARTI';

    // Créer le pointage
    const pointage = await prisma.pointage.create({
      data: {
        driverId: req.user.driverId,
        date: today,
        type,
        statut,
        heure: new Date()
      }
    });

    // Mettre à jour le statut du driver
    const driverStatus = statut === 'PRESENT' ? 'AVAILABLE' : 
                         statut === 'PAUSE' ? 'ON_BREAK' : 'OFFLINE';

    await prisma.driver.update({
      where: { id: req.user.driverId },
      data: { status: driverStatus }
    });

    res.json({
      success: true,
      pointage,
      statut
    });
  } catch (error) {
    console.error('POST /drivers/pointage:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
