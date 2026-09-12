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
// GET /api/organizations/:id/landing
// Configuration publique/personnalisation du landing
//
// SUPER_ADMIN    : toutes les organisations
// FLEET_MANAGER  : sa propre organisation
// COOP_MANAGER   : sa propre organisation
// =========================================================

router.get(
  '/:id/landing',
  authMiddleware,
  requirePermission('landing.manage'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;

      if (!['SUPER_ADMIN', 'FLEET_MANAGER', 'COOP_MANAGER'].includes(req.user?.role)) {
        return res.status(403).json({
          error: 'Accès interdit',
        });
      }

      if (!canAccessOrganization(req, organizationId)) {
        return res.status(403).json({
          error: 'Accès interdit à cette organisation',
        });
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          plan: true,
          logo: true,
          description: true,

          slogan: true,
          coverImage: true,
          primaryColor: true,
          secondaryColor: true,
          landingEnabled: true,
          landingTemplate: true,
          address: true,
          facebook: true,
          whatsapp: true,
          landingConfig: true,
        },
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organisation introuvable',
        });
      }

      res.json(organization);
    } catch (error) {
      console.error('GET /organizations/:id/landing:', error);

      res.status(500).json({
        error: 'Erreur serveur',
      });
    }
  }
);

// =========================================================
// PUT /api/organizations/:id/landing
// Modifier uniquement la personnalisation du landing
//
// SUPER_ADMIN    : toutes les organisations
// FLEET_MANAGER  : sa propre organisation
// COOP_MANAGER   : sa propre organisation
//
// IMPORTANT : aucune donnée administrative/sensible ne peut
// être modifiée depuis cet endpoint.
// =========================================================

router.put(
  '/:id/landing',
  authMiddleware,
  requirePermission('landing.manage'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;

      if (!['SUPER_ADMIN', 'FLEET_MANAGER', 'COOP_MANAGER'].includes(req.user?.role)) {
        return res.status(403).json({
          error: 'Accès interdit',
        });
      }

      if (!canAccessOrganization(req, organizationId)) {
        return res.status(403).json({
          error: 'Accès interdit à cette organisation',
        });
      }

      const {
        slogan,
        coverImage,
        primaryColor,
        secondaryColor,
        landingEnabled,
        landingTemplate,
        address,
        facebook,
        whatsapp,
        landingConfig,
      } = req.body || {};

      const data = {};

      // -------------------------------------------------------
      // Validation simple des champs texte
      // -------------------------------------------------------

      if (slogan !== undefined) {
        if (slogan !== null && typeof slogan !== 'string') {
          return res.status(400).json({
            error: 'slogan doit être une chaîne de caractères ou null',
          });
        }

        if (typeof slogan === 'string' && slogan.length > 255) {
          return res.status(400).json({
            error: 'slogan trop long',
          });
        }

        data.slogan = slogan;
      }

      if (coverImage !== undefined) {
        if (coverImage !== null && typeof coverImage !== 'string') {
          return res.status(400).json({
            error: 'coverImage doit être une chaîne de caractères ou null',
          });
        }

        if (typeof coverImage === 'string' && coverImage.length > 2000) {
          return res.status(400).json({
            error: 'coverImage trop longue',
          });
        }

        data.coverImage = coverImage;
      }

      if (address !== undefined) {
        if (address !== null && typeof address !== 'string') {
          return res.status(400).json({
            error: 'address doit être une chaîne de caractères ou null',
          });
        }

        if (typeof address === 'string' && address.length > 500) {
          return res.status(400).json({
            error: 'address trop longue',
          });
        }

        data.address = address;
      }

      if (facebook !== undefined) {
        if (facebook !== null && typeof facebook !== 'string') {
          return res.status(400).json({
            error: 'facebook doit être une chaîne de caractères ou null',
          });
        }

        if (typeof facebook === 'string' && facebook.length > 500) {
          return res.status(400).json({
            error: 'facebook trop longue',
          });
        }

        data.facebook = facebook;
      }

      if (whatsapp !== undefined) {
        if (whatsapp !== null && typeof whatsapp !== 'string') {
          return res.status(400).json({
            error: 'whatsapp doit être une chaîne de caractères ou null',
          });
        }

        if (typeof whatsapp === 'string' && whatsapp.length > 50) {
          return res.status(400).json({
            error: 'whatsapp trop long',
          });
        }

        data.whatsapp = whatsapp;
      }

      // -------------------------------------------------------
      // Couleurs
      // -------------------------------------------------------

      const colorPattern = /^#[0-9A-Fa-f]{6}$/;

      if (primaryColor !== undefined) {
        if (
          primaryColor !== null &&
          (
            typeof primaryColor !== 'string' ||
            !colorPattern.test(primaryColor)
          )
        ) {
          return res.status(400).json({
            error: 'primaryColor doit être une couleur hexadécimale valide (#RRGGBB)',
          });
        }

        data.primaryColor = primaryColor;
      }

      if (secondaryColor !== undefined) {
        if (
          secondaryColor !== null &&
          (
            typeof secondaryColor !== 'string' ||
            !colorPattern.test(secondaryColor)
          )
        ) {
          return res.status(400).json({
            error: 'secondaryColor doit être une couleur hexadécimale valide (#RRGGBB)',
          });
        }

        data.secondaryColor = secondaryColor;
      }

      // -------------------------------------------------------
      // Activation du landing
      // -------------------------------------------------------

      if (landingEnabled !== undefined) {
        if (typeof landingEnabled !== 'boolean') {
          return res.status(400).json({
            error: 'landingEnabled doit être un booléen',
          });
        }

        data.landingEnabled = landingEnabled;
      }

      // -------------------------------------------------------
      // Template
      // -------------------------------------------------------

      if (landingTemplate !== undefined) {
        if (
          landingTemplate !== null &&
          typeof landingTemplate !== 'string'
        ) {
          return res.status(400).json({
            error: 'landingTemplate doit être une chaîne de caractères ou null',
          });
        }

        if (
          typeof landingTemplate === 'string' &&
          landingTemplate.length > 100
        ) {
          return res.status(400).json({
            error: 'landingTemplate trop long',
          });
        }

        data.landingTemplate = landingTemplate;
      }

      // -------------------------------------------------------
      // Configuration JSON extensible
      // -------------------------------------------------------

      if (landingConfig !== undefined) {
        if (
          landingConfig !== null &&
          (
            typeof landingConfig !== 'object' ||
            Array.isArray(landingConfig)
          )
        ) {
          return res.status(400).json({
            error: 'landingConfig doit être un objet JSON ou null',
          });
        }

        if (landingConfig !== null) {
          let serialized;

          try {
            serialized = JSON.stringify(landingConfig);
          } catch {
            return res.status(400).json({
              error: 'landingConfig invalide',
            });
          }

          if (serialized.length > 100000) {
            return res.status(400).json({
              error: 'landingConfig trop volumineux',
            });
          }
        }

        data.landingConfig = landingConfig;
      }

      // -------------------------------------------------------
      // Rien à modifier
      // -------------------------------------------------------

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: 'Aucune donnée de landing à modifier',
        });
      }

      const organization = await prisma.organization.update({
        where: {
          id: organizationId,
        },
        data,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          plan: true,
          logo: true,
          description: true,

          slogan: true,
          coverImage: true,
          primaryColor: true,
          secondaryColor: true,
          landingEnabled: true,
          landingTemplate: true,
          address: true,
          facebook: true,
          whatsapp: true,
          landingConfig: true,
        },
      });

      res.json(organization);
    } catch (error) {
      console.error('PUT /organizations/:id/landing:', error);

      res.status(500).json({
        error: 'Erreur serveur',
      });
    }
  }
);

// =========================================================
// GET /api/organizations/:id/config
// Configuration V2 complète (BusinessActivity → Services → Tariffs)
//
// SUPER_ADMIN    : toutes les organisations
// FLEET_MANAGER  : sa propre organisation
// COOP_MANAGER   : sa propre organisation
// =========================================================

router.get(
  '/:id/config',
  authMiddleware,
  // P8-B : la sécurité est assurée par canAccessOrganization() (SUPER_ADMIN = toutes, managers = la leur).
  // On n'utilise pas requirePermission('organizations.read') car cette permission est
  // réservée aux administrateurs plateforme, alors que cette route doit aussi être
  // accessible aux FLEET_MANAGER / COOP_MANAGER pour leur propre organisation.
  async (req, res) => {
    try {
      const organizationId = req.params.id;

      if (!canAccessOrganization(req, organizationId)) {
        return res.status(403).json({
          error: 'Accès interdit à cette organisation',
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          type: true,
          logo: true,
          plan: true,

          businessActivities: {
            where: { active: true },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              type: true,
              zone: true,

              services: {
                where: { active: true },
                orderBy: { code: 'asc' },
                select: {
                  id: true,
                  code: true,
                  label: true,
                  category: true,

                  tariffs: {
                    where: { active: true },
                    select: {
                      id: true,
                      pricingModel: true,
                      basePrice: true,
                      unitPrice: true,
                      minimumPrice: true,
                      commissionPct: true,
                      currency: true,
                      configuration: true,

                      vehicleCategory: {
                        select: {
                          id: true,
                          code: true,
                          label: true,
                          vehicleType: true,
                          capacity: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organisation introuvable',
        });
      }

      res.json(organization);
    } catch (error) {
      console.error('GET /organizations/:id/config:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

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
