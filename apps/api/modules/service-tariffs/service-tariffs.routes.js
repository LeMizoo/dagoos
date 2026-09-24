// ============================================================
// SERVICE TARIFFS ROUTES - Administration V2
// ============================================================
//
// Administration des ServiceTariff par organisation.
//
// Permissions :
//   - serviceTariffs.read    : GET liste
//   - serviceTariffs.manage  : POST, PUT, DELETE
//
// Isolation :
//   - SUPER_ADMIN    : toutes les organisations
//   - FLEET_MANAGER  : sa propre organisation
//   - COOP_MANAGER   : sa propre organisation
//
// Reference : docs/SERVICE_TARIFF_V2_TARGET_MAP.md
// ============================================================

const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const { canAccessOrganization } = require('../../security/authorization');
const { logAction } = require('../../lib/log-action');

const router = express.Router();

// ============================================================
// HELPERS
// ============================================================

/**
 * Construit la cle d'unicite normalisee a partir des dimensions.
 * Le format est identique a celui utilise cote SQL (CONCAT_WS).
 */
function buildDimensionKey(dimensions) {
  const parts = [
    ['modePrestation', dimensions.modePrestation],
    ['zone',           dimensions.zone],
    ['mode',           dimensions.mode],
    ['categorie',      dimensions.categorie],
  ]
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`);

  return parts.join('|');
}

/**
 * Verifie qu'un ServiceTariff n'entre pas en conflit avec un autre
 * (meme cle metier : serviceId + vehicleCategoryId + pricingModel + dimensionKey).
 *
 * @param {string} serviceId
 * @param {string} vehicleCategoryId
 * @param {string} pricingModel
 * @param {string} dimensionKey
 * @param {string} [excludeId]  - ID a exclure (cas d'un update)
 * @returns {Promise<Object|null>} Tarif en conflit, ou null
 */
async function findConflict({
  serviceId,
  vehicleCategoryId,
  pricingModel,
  dimensionKey,
  excludeId,
}) {
  return prisma.serviceTariff.findFirst({
    where: {
      serviceId,
      vehicleCategoryId,
      pricingModel,
      dimensionKey,
      active: true,
      excludeFromUnique: false,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, serviceId: true, vehicleCategoryId: true, pricingModel: true, dimensionKey: true },
  });
}

// ============================================================
// GET /api/organizations/:id/service-tariffs
// Liste les ServiceTariffs actifs d'une organisation.
// ============================================================

router.get(
  '/:id/service-tariffs',
  authMiddleware,
  requirePermission('serviceTariffs.read'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;

      if (!canAccessOrganization(req.user, organizationId)) {
        return res.status(403).json({
          error: 'Acces interdit a cette organisation',
        });
      }

      // Verifier que l'organisation existe
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });

      if (!organization) {
        return res.status(404).json({
          error: 'Organisation introuvable',
        });
      }

      // Charger toutes les activites et services de l'organisation
      const activities = await prisma.businessActivity.findMany({
        where: {
          organizationId,
          active: true,
        },
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
                orderBy: [
                  { pricingModel: 'asc' },
                  { dimensionKey: 'asc' },
                ],
                select: {
                  id: true,
                  pricingModel: true,
                  modePrestation: true,
                  zone: true,
                  mode: true,
                  categorie: true,
                  dimensionKey: true,
                  excludeFromUnique: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.json({
        organizationId,
        activities,
      });
    } catch (error) {
      console.error('GET /organizations/:id/service-tariffs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================
// POST /api/organizations/:id/service-tariffs
// Cree un ServiceTariff pour une organisation.
// ============================================================

router.post(
  '/:id/service-tariffs',
  authMiddleware,
  requirePermission('serviceTariffs.manage'),
  async (req, res) => {
    try {
      const organizationId = req.params.id;

      if (!canAccessOrganization(req.user, organizationId)) {
        return res.status(403).json({
          error: 'Acces interdit a cette organisation',
        });
      }

      const {
        serviceId,
        vehicleCategoryId,
        pricingModel,
        modePrestation,
        zone,
        mode,
        categorie,
        basePrice,
        unitPrice,
        minimumPrice,
        commissionPct,
        currency,
        configuration,
      } = req.body || {};

      // Validation basique
      if (!serviceId || typeof serviceId !== 'string') {
        return res.status(400).json({ error: 'serviceId est obligatoire' });
      }
      if (!vehicleCategoryId || typeof vehicleCategoryId !== 'string') {
        return res.status(400).json({ error: 'vehicleCategoryId est obligatoire' });
      }
      if (!pricingModel || typeof pricingModel !== 'string') {
        return res.status(400).json({ error: 'pricingModel est obligatoire' });
      }

      // Verifier que le service appartient a une activite de l'organisation
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessActivity: { organizationId },
        },
        select: { id: true, businessActivityId: true },
      });

      if (!service) {
        return res.status(404).json({
          error: 'Service introuvable pour cette organisation',
        });
      }

      // Verifier que la categorie de vehicule existe
      const category = await prisma.vehicleCategory.findUnique({
        where: { id: vehicleCategoryId },
        select: { id: true, code: true },
      });

      if (!category) {
        return res.status(404).json({
          error: 'Categorie de vehicule introuvable',
        });
      }

      // Construire la cle metier
      const dimensionKey = buildDimensionKey({
        modePrestation,
        zone,
        mode,
        categorie,
      });

      // Verifier l'unicite
      const conflict = await findConflict({
        serviceId,
        vehicleCategoryId,
        pricingModel,
        dimensionKey,
      });

      if (conflict) {
        return res.status(409).json({
          error: 'Un tarif identique existe deja pour cette combinaison',
          conflictId: conflict.id,
          dimensionKey,
        });
      }

      // Creation
      const created = await prisma.serviceTariff.create({
        data: {
          serviceId,
          vehicleCategoryId,
          pricingModel,
          modePrestation: modePrestation ?? null,
          zone: zone ?? null,
          mode: mode ?? null,
          categorie: categorie ?? null,
          dimensionKey,
          excludeFromUnique: false,
          basePrice: basePrice ?? null,
          unitPrice: unitPrice ?? null,
          minimumPrice: minimumPrice ?? null,
          commissionPct: commissionPct ?? 20,
          currency: currency || 'MGA',
          configuration: configuration ?? null,
          active: true,
        },
        include: {
          vehicleCategory: {
            select: { id: true, code: true, label: true, vehicleType: true },
          },
        },
      });

      await logAction({
        userId: req.user.id,
        action: 'serviceTariff.create',
        details: {
          tariffId: created.id,
          organizationId,
          serviceId,
          dimensionKey,
        },
        level: 'info',
        req,
      });

      res.status(201).json(created);
    } catch (error) {
      console.error('POST /organizations/:id/service-tariffs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================
// PUT /api/organizations/:id/service-tariffs/:tariffId
// Modifie un ServiceTariff existant.
// ============================================================

router.put(
  '/:id/service-tariffs/:tariffId',
  authMiddleware,
  requirePermission('serviceTariffs.manage'),
  async (req, res) => {
    try {
      const { id: organizationId, tariffId } = req.params;

      if (!canAccessOrganization(req.user, organizationId)) {
        return res.status(403).json({
          error: 'Acces interdit a cette organisation',
        });
      }

      // Verifier que le tarif appartient bien a l'organisation
      const existing = await prisma.serviceTariff.findFirst({
        where: {
          id: tariffId,
          service: { businessActivity: { organizationId } },
        },
        select: {
          id: true,
          serviceId: true,
          vehicleCategoryId: true,
          pricingModel: true,
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Tarif introuvable pour cette organisation',
        });
      }

      const {
        modePrestation,
        zone,
        mode,
        categorie,
        basePrice,
        unitPrice,
        minimumPrice,
        commissionPct,
        currency,
        configuration,
        active,
      } = req.body || {};

      // Reconstruire la dimensionKey si les dimensions changent
      const newDimensions = {
        modePrestation: modePrestation !== undefined ? modePrestation : undefined,
        zone:           zone           !== undefined ? zone           : undefined,
        mode:           mode           !== undefined ? mode           : undefined,
        categorie:      categorie      !== undefined ? categorie      : undefined,
      };

      // Charger l'etat actuel pour completer les dimensions non modifiees
      const current = await prisma.serviceTariff.findUnique({
        where: { id: tariffId },
        select: {
          modePrestation: true,
          zone: true,
          mode: true,
          categorie: true,
        },
      });

      const finalDimensions = {
        modePrestation: newDimensions.modePrestation !== undefined ? newDimensions.modePrestation : current.modePrestation,
        zone:           newDimensions.zone           !== undefined ? newDimensions.zone           : current.zone,
        mode:           newDimensions.mode           !== undefined ? newDimensions.mode           : current.mode,
        categorie:      newDimensions.categorie      !== undefined ? newDimensions.categorie      : current.categorie,
      };

      const newDimensionKey = buildDimensionKey(finalDimensions);

      // Verifier l'unicite (en excluant le tarif courant)
      const conflict = await findConflict({
        serviceId: existing.serviceId,
        vehicleCategoryId: existing.vehicleCategoryId,
        pricingModel: existing.pricingModel,
        dimensionKey: newDimensionKey,
        excludeId: tariffId,
      });

      if (conflict) {
        return res.status(409).json({
          error: 'Un tarif identique existe deja pour cette combinaison',
          conflictId: conflict.id,
          dimensionKey: newDimensionKey,
        });
      }

      // Mise a jour
      const updated = await prisma.serviceTariff.update({
        where: { id: tariffId },
        data: {
          modePrestation: finalDimensions.modePrestation,
          zone:           finalDimensions.zone,
          mode:           finalDimensions.mode,
          categorie:      finalDimensions.categorie,
          dimensionKey:   newDimensionKey,
          basePrice:      basePrice      !== undefined ? basePrice      : undefined,
          unitPrice:      unitPrice      !== undefined ? unitPrice      : undefined,
          minimumPrice:   minimumPrice   !== undefined ? minimumPrice   : undefined,
          commissionPct:  commissionPct  !== undefined ? commissionPct  : undefined,
          currency:       currency       !== undefined ? currency       : undefined,
          configuration:  configuration  !== undefined ? configuration  : undefined,
          active:         active         !== undefined ? active         : undefined,
        },
        include: {
          vehicleCategory: {
            select: { id: true, code: true, label: true, vehicleType: true },
          },
        },
      });

      await logAction({
        userId: req.user.id,
        action: 'serviceTariff.update',
        details: {
          tariffId: updated.id,
          organizationId,
          dimensionKey: newDimensionKey,
        },
        level: 'info',
        req,
      });

      res.json(updated);
    } catch (error) {
      console.error('PUT /organizations/:id/service-tariffs/:tariffId:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================
// DELETE /api/organizations/:id/service-tariffs/:tariffId
// Desactive un ServiceTariff (soft delete : active = false).
// ============================================================

router.delete(
  '/:id/service-tariffs/:tariffId',
  authMiddleware,
  requirePermission('serviceTariffs.manage'),
  async (req, res) => {
    try {
      const { id: organizationId, tariffId } = req.params;

      if (!canAccessOrganization(req.user, organizationId)) {
        return res.status(403).json({
          error: 'Acces interdit a cette organisation',
        });
      }

      // Verifier que le tarif appartient bien a l'organisation
      const existing = await prisma.serviceTariff.findFirst({
        where: {
          id: tariffId,
          service: { businessActivity: { organizationId } },
        },
        select: { id: true, active: true },
      });

      if (!existing) {
        return res.status(404).json({
          error: 'Tarif introuvable pour cette organisation',
        });
      }

      if (!existing.active) {
        return res.status(409).json({
          error: 'Ce tarif est deja desactive',
        });
      }

      const updated = await prisma.serviceTariff.update({
        where: { id: tariffId },
        data: { active: false },
      });

      await logAction({
        userId: req.user.id,
        action: 'serviceTariff.deactivate',
        details: { tariffId: updated.id, organizationId },
        level: 'warning',
        req,
      });

      res.json({ success: true, tariff: updated });
    } catch (error) {
      console.error('DELETE /organizations/:id/service-tariffs/:tariffId:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
