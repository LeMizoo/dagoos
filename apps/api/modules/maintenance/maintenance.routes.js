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
 * GET /api/maintenance
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('maintenance.read'),
  async (req, res) => {
    try {
      const where = {};

      if (!PRIVILEGED_ROLES.includes(req.user.role)) {
        const organizationId = await getUserOrganizationId(req);

        if (!organizationId) {
          return res.status(403).json({
            error: 'Organisation introuvable',
          });
        }

        where.vehicle = {
          organizationId,
        };
      }

      const data = await prisma.maintenance.findMany({
        where,
        include: {
          vehicle: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      res.json(data);
    } catch (error) {
      console.error('GET /maintenance:', error);

      res.status(500).json({
        error: 'Erreur récupération maintenances',
      });
    }
  }
);

/*
 * POST /api/maintenance
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('maintenance.manage'),
  async (req, res) => {
    try {
      const { vehicleId } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          error: 'vehicleId requis',
        });
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
        },
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

      const data = {
        ...req.body,
        vehicleId,
      };

      const maintenance = await prisma.maintenance.create({
        data,
      });

      res.status(201).json(maintenance);
    } catch (error) {
      console.error('POST /maintenance:', error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
 * PUT /api/maintenance/:id
 */
router.put(
  '/:id',
  authMiddleware,
  requirePermission('maintenance.manage'),
  async (req, res) => {
    try {
      const maintenance = await prisma.maintenance.findUnique({
        where: {
          id: req.params.id,
        },
        select: {
          id: true,
          vehicleId: true,
          vehicle: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      if (!maintenance) {
        return res.status(404).json({
          error: 'Maintenance introuvable',
        });
      }

      if (
        !(await canAccessOrganization(
          req,
          maintenance.vehicle.organizationId
        ))
      ) {
        return res.status(403).json({
          error: 'Accès à cette organisation refusé',
        });
      }

      const data = {
        ...req.body,
      };

      delete data.id;
      delete data.createdAt;

      const updated = await prisma.maintenance.update({
        where: {
          id: req.params.id,
        },
        data,
      });

      res.json(updated);
    } catch (error) {
      console.error('PUT /maintenance/:id:', error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
 * DELETE /api/maintenance/:id
 */
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('maintenance.manage'),
  async (req, res) => {
    try {
      const maintenance = await prisma.maintenance.findUnique({
        where: {
          id: req.params.id,
        },
        select: {
          id: true,
          vehicle: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      if (!maintenance) {
        return res.status(404).json({
          error: 'Maintenance introuvable',
        });
      }

      if (
        !(await canAccessOrganization(
          req,
          maintenance.vehicle.organizationId
        ))
      ) {
        return res.status(403).json({
          error: 'Accès à cette organisation refusé',
        });
      }

      await prisma.maintenance.delete({
        where: {
          id: req.params.id,
        },
      });

      res.json({
        ok: true,
      });
    } catch (error) {
      console.error('DELETE /maintenance/:id:', error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

module.exports = router;
