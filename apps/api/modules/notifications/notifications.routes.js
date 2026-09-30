const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const { buildNotificationScope } = require('./notifications.scope');

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

/*
 * GET /api/notifications
 * Liste les notifications visibles par l'utilisateur connecté.
 *
 * Isolation :
 *   - DRIVER                        → userId
 *   - FLEET_MANAGER / COOP_MANAGER  → organizationId
 *   - ADMIN / SUPER_ADMIN           → global
 *   - autre                         → 403 (via buildNotificationScope)
 */
router.get('/', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try {
    const scope = buildNotificationScope(req.user);

    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const where = { ...scope.where };

    if (req.query.read === 'true') {
      where.read = true;
    } else if (req.query.read === 'false') {
      where.read = false;
    }

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

/*
 * GET /api/notifications/unread-count
 * Compteur des notifications non lues pour l'utilisateur connecté.
 * Même périmètre d'isolation que GET /.
 */
router.get('/unread-count', authMiddleware, requirePermission('notifications.read'), async (req, res) => {
  try {
    const scope = buildNotificationScope(req.user);

    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const count = await prisma.notification.count({
      where: {
        ...scope.where,
        read: false
      }
    });

    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/*
 * GET /api/notifications/:id
 * Détail d'une notification, sous réserve d'appartenance au périmètre.
 * 404 si introuvable, 403 si hors périmètre.
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const scope = buildNotificationScope(req.user);

    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    const isAllowed = Object.entries(scope.where).every(
      ([key, value]) => notification[key] === value
    );

    if (!isAllowed) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(notification);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/*
 * PUT /api/notifications/:id/read
 * Marque une notification comme lue, sous réserve d'appartenance.
 * 404 si introuvable, 403 si hors périmètre. Aucun update si refusé.
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const scope = buildNotificationScope(req.user);

    if (!scope.ok) {
      return res.status(scope.status).json({ error: scope.error });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    const isAllowed = Object.entries(scope.where).every(
      ([key, value]) => notification[key] === value
    );

    if (!isAllowed) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
