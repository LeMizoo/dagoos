const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

/**
 * Résout l'organisation de l'utilisateur côté serveur.
 *
 * Pour les rôles métier, organizationId doit provenir
 * du contexte authentifié et non du body de la requête.
 */
async function getUserOrganizationId(req) {
  if (req.user?.organizationId) {
    return req.user.organizationId;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      driver: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (user?.driver?.organizationId) {
    return user.driver.organizationId;
  }

  const organization = await prisma.organization.findFirst({
    where: {
      email: req.user.email,
    },
    select: {
      id: true,
    },
  });

  return organization?.id || null;
}

/**
 * GET /api/proprietaires
 *
 * SUPER_ADMIN / ADMIN :
 *   accès global.
 *
 * FLEET_MANAGER / COOPERATIVE :
 *   accès uniquement à leur organisation.
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('proprietaires.read'),
  async (req, res) => {
    try {
      const where = {};

      if (!GLOBAL_ROLES.includes(req.user?.role)) {
        const organizationId = await getUserOrganizationId(req);

        if (!organizationId) {
          return res.status(403).json({
            error: 'Organisation introuvable',
          });
        }

        where.organizationId = organizationId;
      }

      const data = await prisma.proprietaire.findMany({
        where,
        include: {
          vehicles: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(data);
    } catch (error) {
      console.error('GET /proprietaires:', error);

      return res.status(500).json({
        error: 'Erreur récupération propriétaires',
      });
    }
  }
);

/**
 * POST /api/proprietaires
 *
 * SUPER_ADMIN / ADMIN :
 *   peuvent cibler explicitement une organisation.
 *
 * FLEET_MANAGER / COOPERATIVE :
 *   organizationId du body est ignoré.
 *   L'organisation est imposée par le contexte serveur.
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('proprietaires.manage'),
  async (req, res) => {
    try {
      const { organizationId: requestedOrganizationId, ...data } = req.body;

      let targetOrganizationId = requestedOrganizationId;

      if (!GLOBAL_ROLES.includes(req.user?.role)) {
        targetOrganizationId = await getUserOrganizationId(req);

        if (!targetOrganizationId) {
          return res.status(403).json({
            error: 'Organisation introuvable',
          });
        }
      }

      if (!targetOrganizationId) {
        return res.status(400).json({
          error: 'organizationId requis',
        });
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: targetOrganizationId,
        },
        select: {
          id: true,
        },
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organisation introuvable',
        });
      }

      const proprietaire = await prisma.proprietaire.create({
        data: {
          ...data,
          organizationId: targetOrganizationId,
        },
      });

      return res.status(201).json(proprietaire);
    } catch (error) {
      console.error('POST /proprietaires:', error);

      return res.status(500).json({
        error: 'Erreur création propriétaire',
      });
    }
  }
);

module.exports = router;
