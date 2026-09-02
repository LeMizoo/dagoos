const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

/*
 * POST /api/notifications/vehicle-assignment-request
 * Un chauffeur demande à son responsable une assignation de véhicule.
 * Le chauffeur ne peut jamais modifier lui-même son vehicleId.
 */
router.post('/vehicle-assignment-request', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({
        error: 'Accès réservé aux chauffeurs'
      });
    }

    const driverId = req.user.driverId;

    if (!driverId) {
      return res.status(403).json({
        error: 'Compte chauffeur introuvable'
      });
    }

    const reason = String(req.body?.reason || '').trim().slice(0, 300);

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            type: true
          }
        }
      }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Chauffeur introuvable'
      });
    }

    /*
     * Une seule demande non traitée à la fois pour un chauffeur.
     */
    const existingRequest = await prisma.notification.findFirst({
      where: {
        organizationId: driver.organizationId,
        type: 'VEHICLE_ASSIGNMENT_REQUEST',
        read: false,
        message: {
          contains: `[driver:${driver.id}]`
        }
      },
      select: {
        id: true
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        error: 'Une demande d’assignation de véhicule est déjà en attente'
      });
    }

    /*
     * Trouver les responsables de l'organisation.
     * On conserve aussi la recherche par email pour rester compatible
     * avec les comptes managers existants.
     */
    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: ['FLEET_MANAGER', 'COOPERATIVE', 'COOP_MANAGER']
        },
        OR: [
          {
            organizationId: driver.organizationId
          },
          ...(driver.organization?.email
            ? [{ email: driver.organization.email }]
            : [])
        ]
      },
      select: {
        id: true
      }
    });

    if (!managers.length) {
      return res.status(404).json({
        error: 'Administrateur de l’organisation introuvable'
      });
    }

    const driverName = driver.user?.name || driver.driverCode;

    const currentVehicle = driver.vehicle
      ? `${driver.vehicle.plate}${driver.vehicle.model ? ` (${driver.vehicle.model})` : ''}`
      : 'Aucun véhicule actuellement';

    const message = [
      `[driver:${driver.id}]`,
      `Chauffeur : ${driverName}`,
      `Code : ${driver.driverCode}`,
      `Téléphone : ${driver.user?.phone || '-'}`,
      `Véhicule actuel : ${currentVehicle}`,
      reason ? `Motif : ${reason}` : null
    ].filter(Boolean).join(' | ');

    await prisma.$transaction(
      managers.map((manager) =>
        prisma.notification.create({
          data: {
            userId: manager.id,
            organizationId: driver.organizationId,
            type: 'VEHICLE_ASSIGNMENT_REQUEST',
            title: '🚗 Demande d’assignation de véhicule',
            message,
            read: false
          }
        })
      )
    );

    return res.json({
      ok: true,
      message: 'Demande envoyée à l’administrateur'
    });

  } catch (e) {
    console.error(
      'POST /notifications/vehicle-assignment-request:',
      e
    );

    return res.status(500).json({
      error: 'Erreur envoi demande d’assignation'
    });
  }
});

router.get('/', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try {
    // Pour DRIVER : filtrer par userId
    const where = {};

    if (req.user.role === 'DRIVER') {
      where.userId = req.user.id;
    }

    // Filtrer par read si query param présent
    if (req.query.read === 'true') {
      where.read = true;
    } else if (req.query.read === 'false') {
      where.read = false;
    }

    // Filtrer par type si présent
    if (req.query.type) {
      where.type = req.query.type;
    }

    const data = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/unread-count', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    // Pour DRIVER : vérifier que la notification lui appartient
    if (req.user.role === 'DRIVER' && notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(notification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try { await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
