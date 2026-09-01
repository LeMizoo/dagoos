const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

async function getUserOrganizationId(req) {
  if (!req.user?.id) {
    return null;
  }

  if (
    req.user.role === 'FLEET_MANAGER' ||
    req.user.role === 'COOP_MANAGER'
  ) {
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

  return null;
}


/*
 * GET /api/livraisons
 *
 * SUPER_ADMIN / ADMIN : accÃ¨s global.
 * Autres rÃ´les : uniquement les livraisons de leur organisation.
 */
router.get('/', authMiddleware, requirePermission('livraisons.read'), async (req, res) => {
  try {
    const where = {};

    if (!GLOBAL_ROLES.includes(req.user?.role)) {
      const organizationId = await getUserOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          error: 'Organisation introuvable',
        });
      }

      where.societe = {
        organizationId,
      };
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.livraison.findMany({
        where,
        include: {
          societe: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.livraison.count({ where }),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /livraisons:', error);

    res.status(500).json({
      error: 'Erreur rÃ©cupÃ©ration livraisons',
    });
  }
});

/*
 * POST /api/livraisons
 *
 * La sociÃ©tÃ© doit appartenir Ã  l'organisation de l'utilisateur.
 */
router.post('/', authMiddleware, requirePermission('livraisons.manage'), async (req, res) => {
  try {
    const { societeId, ...data } = req.body;

    if (!societeId) {
      return res.status(400).json({
        error: 'societeId requis',
      });
    }

    const societe = await prisma.societe.findUnique({
      where: {
        id: societeId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!societe) {
      return res.status(404).json({
        error: 'Société introuvable',
      });
    }

    if (!GLOBAL_ROLES.includes(req.user?.role)) {
      const organizationId = await getUserOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          error: 'Organisation introuvable',
        });
      }

      if (societe.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'Accès à cette organisation refusé',
        });
      }
    }

    const livraison = await prisma.livraison.create({
      data: {
        ...data,
        societeId,
      },
    });

    res.status(201).json(livraison);
  } catch (error) {
    console.error('POST /livraisons:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
