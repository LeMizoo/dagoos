const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const { canAccessOrganization } = require('../../security/authorization');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

/*
 * Retourne l'organisation associée à l'utilisateur.
 *
 * FLEET_MANAGER / COOPERATIVE :
 * résolution via l'email du compte utilisateur.
 *
 * DRIVER :
 * résolution via la relation Driver → Organization.
 *
 * Aucun organizationId n'est lu directement depuis User,
 * car ce champ n'existe pas dans le modèle Prisma actuel.
 */
async function getUserOrganizationId(req) {
  if (!req.user?.id) {
    return null;
  }

  /*
   * FLEET_MANAGER / COOPERATIVE :
   * l'organisation est actuellement liée au compte par son email.
   *
   * On ne lit volontairement PAS user.organizationId :
   * ce champ n'existe pas dans le modèle Prisma User actuel.
   */
  if (
    req.user.role === 'FLEET_MANAGER' ||
    req.user.role === 'COOPERATIVE'
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

  /*
   * DRIVER :
   * le lien organisationnel passe par Driver.
   */
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      driver: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  return user?.driver?.organizationId || null;
}

/*
 * Vérifie qu'une société appartient à une organisation donnée.
 */
async function getSocieteWithOrganization(societeId) {
  if (!societeId) {
    return null;
  }

  return prisma.societe.findUnique({
    where: { id: societeId },
    select: {
      id: true,
      organizationId: true,
      activite: true,
      adresse: true,
    },
  });
}

/*
 * GET /api/contrats
 *
 * SUPER_ADMIN / ADMIN :
 *   accès global selon leur permission.
 *
 * FLEET_MANAGER / COOPERATIVE :
 *   uniquement les contrats de leur organisation.
 */
router.get(
  '/',
  authMiddleware,
  requirePermission('contracts.read'),
  async (req, res) => {
    try {
      const where = {};

      if (!GLOBAL_ROLES.includes(req.user.role)) {
        const organizationId = await getUserOrganizationId(req);

        if (!organizationId) {
          return res.status(403).json({
            error: 'Organisation introuvable',
          });
        }

        /*
         * Le Contrat n'a pas organizationId directement.
         * Le périmètre est appliqué via :
         *
         * Contrat → Societe → Organization
         */
        where.societe = {
          organizationId,
        };
      }

      const contrats = await prisma.contrat.findMany({
        where,
        include: {
          societe: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(contrats);
    } catch (error) {
      console.error('GET /contrats:', error);

      return res.status(500).json({
        error: 'Erreur récupération contrats',
      });
    }
  }
);

/*
 * POST /api/contrats
 *
 * Création autorisée uniquement avec contracts.manage.
 *
 * FLEET_MANAGER / COOPERATIVE :
 *   la société doit appartenir à leur organisation.
 *
 * SUPER_ADMIN :
 *   peut créer pour n'importe quelle organisation.
 *
 * ADMIN :
 *   ne possède volontairement pas contracts.manage.
 */
router.post(
  '/',
  authMiddleware,
  requirePermission('contracts.manage'),
  async (req, res) => {
    try {
      const {
        societeId,
        client,
        dateDebut,
        dateFin,
        montant,
        statut,
      } = req.body;

      if (!societeId) {
        return res.status(400).json({
          error: 'societeId requis',
        });
      }

      if (!client || !String(client).trim()) {
        return res.status(400).json({
          error: 'Client requis',
        });
      }

      if (!dateDebut) {
        return res.status(400).json({
          error: 'dateDebut requise',
        });
      }

      if (!dateFin) {
        return res.status(400).json({
          error: 'dateFin requise',
        });
      }

      const societe = await getSocieteWithOrganization(societeId);

      if (!societe) {
        return res.status(404).json({
          error: 'Société introuvable',
        });
      }

      /*
       * Contrôle d'isolation organisationnelle.
       *
       * SUPER_ADMIN / ADMIN sont GLOBAL selon scopes.js,
       * mais ADMIN n'arrive normalement jamais ici car il ne possède
       * pas contracts.manage.
       */
      if (!GLOBAL_ROLES.includes(req.user.role)) {
        const organizationId = await getUserOrganizationId(req);

        if (!organizationId) {
          return res.status(403).json({
            error: 'Organisation introuvable',
          });
        }

        if (!canAccessOrganization(req.user, societe.organizationId)) {
          return res.status(403).json({
            error: 'Vous ne pouvez pas créer un contrat dans une autre organisation',
          });
        }
      }

      const numericMontant =
        montant === undefined || montant === null || montant === ''
          ? 0
          : Number(montant);

      if (!Number.isFinite(numericMontant) || numericMontant < 0) {
        return res.status(400).json({
          error: 'Montant invalide',
        });
      }

      const contrat = await prisma.contrat.create({
        data: {
          societeId,
          client: String(client).trim(),
          dateDebut: String(dateDebut).trim(),
          dateFin: String(dateFin).trim(),
          montant: numericMontant,
          statut: statut
            ? String(statut).trim()
            : 'actif',
        },
        include: {
          societe: true,
        },
      });

      return res.status(201).json(contrat);
    } catch (error) {
      console.error('POST /contrats:', error);

      return res.status(500).json({
        error: 'Erreur création contrat',
      });
    }
  }
);

module.exports = router;
