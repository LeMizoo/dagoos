const express = require('express');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const { logAction } = require('../../lib/log-action');

const router = express.Router();

// Note : cloudinary.config() est appelé dans
// apps/api/modules/public/upload.routes.js (monté en premier dans server.js).
// Le module cloudinary étant un singleton, la configuration est partagée.

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
          paymentStatus: true,
          paymentAmount: true,
          paymentRef: true,
          subscriptionEnd: true,
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
// POST /api/organizations/:id/upload
// Upload une image Cloudinary, retourne son URL
//
// SUPER_ADMIN    : toute organisation
// FLEET_MANAGER  : sa propre organisation
// COOP_MANAGER   : sa propre organisation
//
// Note : la config Cloudinary est déjà faite dans
// modules/public/upload.routes.js (singleton).
// =========================================================

router.post(
  '/:id/upload',
  authMiddleware,
  requirePermission('landing.manage'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;
      const { image } = req.body || {};

      // 1. Contrôle rôle
      if (!['SUPER_ADMIN', 'FLEET_MANAGER', 'COOP_MANAGER'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Accès interdit' });
      }

      // 2. Contrôle accès organisation (isolation multi-tenant)
      if (!canAccessOrganization(req, organizationId)) {
        return res.status(403).json({
          error: 'Accès interdit à cette organisation',
        });
      }

      // Vérification de la configuration Cloudinary
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        console.error('[UPLOAD-ORG] Cloudinary non configuré');

        return res.status(503).json({
          error: 'Cloudinary non configuré',
        });
      }

      // 3. Validation image
      if (!image || typeof image !== 'string') {
        return res.status(400).json({
          error: 'Image manquante (data URI base64 requis)',
        });
      }

      if (!image.startsWith('data:image/')) {
        return res.status(400).json({
          error: 'Format invalide : data URI attendu',
        });
      }

      const formatMatch = image.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
      if (!formatMatch) {
        return res.status(400).json({ error: 'Format data URI malformé' });
      }

      const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];
      const format = formatMatch[1].toLowerCase();
      if (!ALLOWED_FORMATS.includes(format)) {
        return res.status(400).json({
          error: `Format non supporté : ${format}`,
        });
      }

      const base64Data = image.split(',')[1];
      if (!base64Data) {
        return res.status(400).json({ error: 'Données base64 manquantes' });
      }

      const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (estimatedBytes > MAX_FILE_SIZE) {
        return res.status(413).json({
          error: `Image trop volumineuse (${Math.round(estimatedBytes / 1024)} KB). Max 5 MB`,
        });
      }

      // 4. Génération du dossier et publicId
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const folder = `dagoos/organizations/${organizationId}/hero/${yearMonth}`;
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const publicId = `hero-${timestamp}-${random}`;

      console.log(
        `[UPLOAD-ORG] ${organizationId} → ${folder}/${publicId} ` +
        `(${format}, ~${Math.round(estimatedBytes / 1024)} KB)`
      );

      // 5. Upload Cloudinary
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
            width: 1920,
            crop: 'limit',
          },
        ],
        overwrite: false,
        invalidate: true,
      });

      console.log(`[UPLOAD-ORG] ✅ ${uploadResult.secure_url}`);

      // 6. Réponse
      return res.status(201).json({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
      });
    } catch (error) {
      console.error('[UPLOAD-ORG] Erreur Cloudinary :', error);

      if (error.http_code) {
        return res.status(error.http_code).json({
          error: `Cloudinary : ${error.message}`,
        });
      }

      return res.status(500).json({
        error: "Erreur lors de l'upload",
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
// =========================================================
// PUT /api/organizations/:id/slug
// Modifier uniquement le slug public de l'organisation
//
// SUPER_ADMIN    : toute organisation
// FLEET_MANAGER  : sa propre organisation
// COOP_MANAGER   : sa propre organisation
// =========================================================

router.put(
  '/:id/slug',
  authMiddleware,
  requirePermission('landing.manage'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;
      const { slug } = req.body || {};

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

      if (
        typeof slug !== 'string' ||
        !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)
      ) {
        return res.status(400).json({
          error: 'Slug invalide. Utilisez a-z, 0-9 et tirets (pas en début/fin).',
        });
      }

      if (slug.length < 3 || slug.length > 48) {
        return res.status(400).json({
          error: 'Le slug doit contenir entre 3 et 48 caractères.',
        });
      }

      const RESERVED_SLUGS = [
        'dashboard', 'flotte', 'admin', 'login', 'register',
        'api', 'public', 'fleet', 'coop', 'suivi',
        'urbain-login', 'interurbain-login', 'fleet-login', 'coop-login',
      ];

      if (RESERVED_SLUGS.includes(slug)) {
        return res.status(400).json({
          error: 'Ce slug est réservé par le système.',
        });
      }

      const existing = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing && existing.id !== organizationId) {
        return res.status(409).json({
          error: 'Ce slug est déjà utilisé par une autre organisation.',
        });
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          landingEnabled: true,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('PUT /organizations/:id/slug:', error);
      res.status(500).json({ error: error.message });
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

      if (!['SUPER_ADMIN', 'FLEET_MANAGER', 'COOP_MANAGER'].includes(req.user?.role)) {
        return res.status(403).json({
          error: 'Accès réservé aux responsables d’organisation',
        });
      }

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
    if (plan !== undefined) {
      if (typeof plan !== 'string' || !plan.trim()) {
        return res.status(400).json({
          error: 'plan doit être une chaîne non vide',
        });
      }

      const currentOrg = await prisma.organization.findUnique({
        where: { id: req.params.id },
        select: { type: true },
      });

      if (!currentOrg) {
        return res.status(404).json({
          error: 'Organisation introuvable',
        });
      }

      if (currentOrg.type === 'ADMIN') {
        data.plan = plan;
      } else {
        const validPlan = await prisma.plan.findFirst({
          where: {
            name: plan,
            type: currentOrg.type,
            active: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (!validPlan) {
          return res.status(400).json({
            error: `Plan "${plan}" invalide pour une organisation de type ${currentOrg.type}`,
          });
        }

        data.plan = validPlan.name;
      }
    }
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

    const changedFields = Object.keys(data);

    await logAction({
      userId: req.user.id,
      action: 'org.update',
      details: `orgId=${req.params.id}; fields=[${changedFields.join(',')}]; role=${req.user.role}`,
      req,
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

    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      select: { name: true },
    });

    await prisma.organization.delete({
      where: {
        id: req.params.id,
      },
    });

    await logAction({
      userId: req.user.id,
      action: 'org.delete',
      details: `orgId=${req.params.id}; name=${org?.name || 'unknown'}; role=${req.user.role}`,
      req,
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
