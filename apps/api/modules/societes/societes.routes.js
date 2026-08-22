const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

/**
 * Résout l'organisation de l'utilisateur côté serveur.
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
 * GET /api/societes
 *
 * SUPER_ADMIN / ADMIN :
 *   accès global.
 *
 * FLEET_MANAGER / COOP_MANAGER :
 *   uniquement leur organisation.
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('societes.read'),
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

      const data = await prisma.societe.findMany({
        where,
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(data);
    } catch (error) {
      console.error('GET /societes:', error);

      return res.status(500).json({
        error: 'Erreur récupération sociétés',
      });
    }
  }
);

/**
 * POST /api/societes
 *
 * L'organisation est toujours déterminée côté serveur.
 *
 * Le client ne peut pas choisir une autre organisation.
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('societes.manage'),
  async (req, res) => {
    try {
      const { activite, adresse } = req.body;

      if (!activite) {
        return res.status(400).json({
          error: 'Le champ activite est obligatoire',
        });
      }

      const organizationId = await getUserOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          error: 'Organisation introuvable',
        });
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
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

      const societe = await prisma.societe.create({
        data: {
          organizationId,
          activite,
          adresse: adresse || null,
        },
        include: {
          organization: true,
        },
      });

      return res.status(201).json(societe);
    } catch (error) {
      console.error('POST /societes:', error);

      return res.status(500).json({
        error: 'Erreur création société',
      });
    }
  }
);

module.exports = router;
