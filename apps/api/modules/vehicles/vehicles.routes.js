const express = require('express');
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

async function canAccessOrganization(req, organizationId) {
  if (PRIVILEGED_ROLES.includes(req.user.role)) {
    return true;
  }

  const userOrganizationId = await getUserOrganizationId(req);

  return !!organizationId && userOrganizationId === organizationId;
}

/*
 * GET /api/vehicles
 */
router.get('/', authMiddleware, requirePermission('vehicles.read'), async (req, res) => {
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

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          organization: true,
          proprietaire: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /vehicles:', error);

    res.status(500).json({
      error: 'Erreur récupération véhicules',
    });
  }
});

/*
 * POST /api/vehicles
 */
router.post('/', authMiddleware, requirePermission('vehicles.manage'), async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    const {
      organizationId: requestedOrganizationId,
      proprietaireId,
      plate,
      model,
      year,
      currentKm,
      status,
      placesTotal,
      type,
    } = req.body;

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
          error: 'Vous ne pouvez pas créer un véhicule dans une autre organisation',
        });
      }

      organizationId = ownOrganizationId;
    }

    if (!organizationId) {
      return res.status(400).json({
        error: 'organizationId requis',
      });
    }

    if (!plate || !String(plate).trim()) {
      return res.status(400).json({
        error: 'Immatriculation requise',
      });
    }

    /*
     * Si un propriétaire est fourni, vérifier qu'il existe.
     */
    if (proprietaireId) {
      const proprietaire = await prisma.proprietaire.findUnique({
        where: { id: proprietaireId },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!proprietaire) {
        return res.status(404).json({
          error: 'Propriétaire introuvable',
        });
      }

      if (proprietaire.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'Le propriétaire appartient à une autre organisation',
        });
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId,
        proprietaireId: proprietaireId || null,
        plate: String(plate).trim().toUpperCase(),
        model: model || null,
        year: year !== undefined && year !== null
          ? Number(year)
          : null,
        currentKm: currentKm !== undefined && currentKm !== null
          ? Number(currentKm)
          : 0,
        status: status || 'active',
        type: type || 'voiture',
      },
      include: {
        organization: true,
        proprietaire: true,
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('POST /vehicles:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
 * PUT /api/vehicles/:id
 */
router.put('/:id', authMiddleware, requirePermission('vehicles.manage'), async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!existingVehicle) {
      return res.status(404).json({
        error: 'Véhicule introuvable',
      });
    }

    if (
      !(await canAccessOrganization(
        req,
        existingVehicle.organizationId
      ))
    ) {
      return res.status(403).json({
        error: 'Accès à cette organisation refusé',
      });
    }

    const {
      proprietaireId,
      plate,
      model,
      year,
      currentKm,
      status,
      type,
      organizationId: requestedOrganizationId,
    } = req.body;

    /*
     * Un Fleet Manager ne peut jamais transférer le véhicule
     * vers une autre organisation.
     */
    if (
      requestedOrganizationId &&
      requestedOrganizationId !== existingVehicle.organizationId &&
      !PRIVILEGED_ROLES.includes(req.user.role)
    ) {
      return res.status(403).json({
        error: 'Vous ne pouvez pas transférer ce véhicule',
      });
    }

    if (proprietaireId) {
      const proprietaire = await prisma.proprietaire.findUnique({
        where: { id: proprietaireId },
        select: {
          id: true,
          organizationId: true,
        },
      });

      if (!proprietaire) {
        return res.status(404).json({
          error: 'Propriétaire introuvable',
        });
      }

      if (proprietaire.organizationId !== existingVehicle.organizationId) {
        return res.status(403).json({
          error: 'Le propriétaire appartient à une autre organisation',
        });
      }
    }

    const data = {};

    if (proprietaireId !== undefined) {
      data.proprietaireId = proprietaireId || null;
    }

    if (plate !== undefined) {
      data.plate = String(plate).trim().toUpperCase();
    }

    if (model !== undefined) data.model = model || null;

    if (year !== undefined) {
      data.year = year === null || year === ''
        ? null
        : Number(year);
    }

    if (currentKm !== undefined) {
      data.currentKm = Number(currentKm);
    }

    if (status !== undefined) {
      data.status = status;
    }

    if (type !== undefined) {
      data.type = type;
    }

    if (
      requestedOrganizationId &&
      PRIVILEGED_ROLES.includes(req.user.role)
    ) {
      const targetOrganization = await prisma.organization.findUnique({
        where: { id: requestedOrganizationId },
        select: { id: true },
      });

      if (!targetOrganization) {
        return res.status(404).json({
          error: 'Organisation cible introuvable',
        });
      }

      data.organizationId = requestedOrganizationId;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data,
      include: {
        organization: true,
        proprietaire: true,
      },
    });

    res.json(vehicle);
  } catch (error) {
    console.error('PUT /vehicles/:id:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
 * DELETE /api/vehicles/:id
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('vehicles.manage'),
  async (req, res) => {
  try {
    if (req.user.role === 'DRIVER') {
      return res.status(403).json({
        error: 'Accès refusé',
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
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

    if (!(await canAccessOrganization(req, vehicle.organizationId))) {
      return res.status(403).json({
        error: 'Accès à cette organisation refusé',
      });
    }

    await prisma.vehicle.delete({
      where: { id: req.params.id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /vehicles/:id:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
