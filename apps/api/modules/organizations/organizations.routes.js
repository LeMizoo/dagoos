const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

// =========================================================
// ORGANIZATION ACCESS CONTROL
// =========================================================

function isSuperAdmin(req) {
  return req.user?.role === 'SUPER_ADMIN';
}

function getOrganizationId(req) {
  return req.user?.organizationId || null;
}

function canAccessOrganization(req, organizationId) {
  if (isSuperAdmin(req)) {
    return true;
  }

  return Boolean(
    organizationId &&
    getOrganizationId(req) &&
    getOrganizationId(req) === organizationId
  );
}

// =========================================================
// GET /api/organizations
// SUPER_ADMIN : toutes les organisations
// Autres utilisateurs : uniquement leur organisation
// =========================================================

router.get(
  '/',
  authMiddleware,
  requirePermission('organizations.read'),
  async (req, res) => {
  try {
    const where = {};

    if (!isSuperAdmin(req)) {
      const organizationId = getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          error: 'Organisation non associée au compte',
        });
      }

      where.id = organizationId;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          type: true,
          email: true,
          phone: true,
          plan: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              drivers: true,
              vehicles: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /organizations:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// GET /api/organizations/fleet/:slug
// Landing publique d'une flotte
// =========================================================

router.get('/fleet/:slug', async (req, res) => {
  try {
    const fleet = await prisma.organization.findFirst({
      where: {
        slug: req.params.slug,
        type: 'FLEET_MANAGER',
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        type: true,
        email: true,
        phone: true,
        logo: true,
        description: true,
        plan: true,
        status: true,
        createdAt: true,
        vehicles: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            plate: true,
            model: true,
            year: true,
            status: true,
          },
          take: 6,
        },
        drivers: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            driverCode: true,
            status: true,
            user: {
              select: {
                name: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                plate: true,
                model: true,
              },
            },
          },
          take: 6,
        },
        _count: {
          select: {
            vehicles: true,
            drivers: true,
          },
        },
      },
    });

    if (!fleet) {
      return res.status(404).json({
        error: 'Flotte introuvable',
      });
    }

    res.json(fleet);
  } catch (error) {
    console.error('GET /organizations/fleet/:slug:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// GET /api/organizations/coop/:slug
// Landing publique d'une coopérative
// =========================================================

router.get('/coop/:slug', async (req, res) => {
  try {
    const coop = await prisma.organization.findFirst({
      where: {
        slug: req.params.slug,
        type: 'COOPERATIVE',
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        type: true,
        email: true,
        phone: true,
        logo: true,
        description: true,
        plan: true,
        status: true,
        createdAt: true,
        vehicles: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            plate: true,
            model: true,
            year: true,
            status: true,
          },
          take: 6,
        },
        drivers: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            driverCode: true,
            status: true,
            user: {
              select: {
                name: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                plate: true,
                model: true,
              },
            },
          },
          take: 6,
        },
        _count: {
          select: {
            vehicles: true,
            drivers: true,
          },
        },
      },
    });

    if (!coop) {
      return res.status(404).json({
        error: 'Coopérative introuvable',
      });
    }

    res.json(coop);
  } catch (error) {
    console.error('GET /organizations/coop/:slug:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// GET /api/organizations/:id
// SUPER_ADMIN : toute organisation
// Autres utilisateurs : uniquement leur organisation
// =========================================================

router.get(
  '/:id',
  authMiddleware,
  requirePermission('organizations.read'),
  async (req, res) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        type: true,
        email: true,
        phone: true,
        logo: true,
        description: true,
        plan: true,
        paymentStatus: true,
        paymentRef: true,
        paymentAmount: true,
        subscriptionEnd: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            drivers: true,
            vehicles: true,
            societes: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({
        error: 'Organisation introuvable',
      });
    }

    if (!canAccessOrganization(req, organization.id)) {
      return res.status(403).json({
        error: 'Accès interdit à cette organisation',
      });
    }

    res.json(organization);
  } catch (error) {
    console.error('GET /organizations/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// PUT /api/organizations/:id
// SUPER_ADMIN uniquement pour modifier une organisation
// =========================================================

router.put(
  '/:id',
  authMiddleware,
  requirePermission('organizations.update'),
  async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Réservé aux super-administrateurs',
      });
    }

    const {
      name,
      email,
      phone,
      logo,
      description,
      plan,
      status,
      type,
      paymentStatus,
      paymentRef,
      paymentAmount,
      subscriptionEnd,
    } = req.body;

    const data = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (logo !== undefined) data.logo = logo;
    if (description !== undefined) data.description = description;
    if (plan !== undefined) data.plan = plan;
    if (status !== undefined) data.status = status;
    if (type !== undefined) data.type = type;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (paymentRef !== undefined) data.paymentRef = paymentRef;
    if (paymentAmount !== undefined) data.paymentAmount = paymentAmount;

    if (subscriptionEnd !== undefined) {
      data.subscriptionEnd = subscriptionEnd
        ? new Date(subscriptionEnd)
        : null;
    }

    const organization = await prisma.organization.update({
      where: {
        id: req.params.id,
      },
      data,
    });

    res.json(organization);
  } catch (error) {
    console.error('PUT /organizations/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// DELETE /api/organizations/:id
// SUPER_ADMIN uniquement
// =========================================================

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Réservé aux super-administrateurs',
      });
    }

    await prisma.organization.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      ok: true,
      message: 'Organisation supprimée',
    });
  } catch (error) {
    console.error('DELETE /organizations/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
