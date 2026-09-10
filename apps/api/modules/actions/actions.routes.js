const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');
const {
  VALID_LONG_HAUL_SERVICES,
  isVehicleCompatibleWithService
} = require('../public/long-haul-matrix');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const VALID_TYPES = [
  'COURSE_REQUEST',
  'TAXI_RESERVATION',
  'PASSENGER_RESERVATION',
  'DELIVERY_REQUEST',
  'CARGO_RESERVATION',
  'CAR_RENTAL',
  'LONG_HAUL',
  'CONTACT',
];

const VALID_STATUTS = ['NEW', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

async function getUserOrganizationId(req) {
  if (req.user.organizationId) return req.user.organizationId;
  
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { driver: { select: { organizationId: true } } },
  });
  
  if (user?.driver?.organizationId) return user.driver.organizationId;
  
  const org = await prisma.organization.findFirst({
    where: { email: req.user.email },
    select: { id: true },
  });
  
  return org?.id || null;
}

// GET /api/actions - Liste des actions de l'organisation
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
      where.organizationId = orgId;
    } else if (req.query.organizationId) {
      where.organizationId = req.query.organizationId;
    }
    
    if (req.query.statut) {
      where.statut = req.query.statut;
    }
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    const actions = await prisma.leadAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    
    res.json(actions);
  } catch (error) {
    console.error('GET /actions:', error);
    res.status(500).json({ error: 'Erreur récupération actions' });
  }
});

// POST /api/actions - Créer une action (depuis le dashboard)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, clientNom, clientTel, details } = req.body;
    
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type invalide' });
    }
    
    if (!clientNom || !clientTel) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }
    
    let orgId;
    if (GLOBAL_ROLES.includes(req.user.role)) {
      orgId = req.body.organizationId;
      if (!orgId) return res.status(400).json({ error: 'organizationId requis' });
    } else {
      orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
    }
    
    const action = await prisma.leadAction.create({
      data: {
        organizationId: orgId,
        type,
        clientNom: String(clientNom).trim(),
        clientTel: String(clientTel).trim(),
        details: details || {},
        statut: 'NEW',
      },
    });
    
    res.status(201).json(action);
  } catch (error) {
    console.error('POST /actions:', error);
    res.status(500).json({ error: 'Erreur création action' });
  }
});

// GET /api/actions/:id - Détail d'une action
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const action = await prisma.leadAction.findUnique({
      where: { id: req.params.id },
    });
    
    if (!action) return res.status(404).json({ error: 'Action introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (action.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    res.json(action);
  } catch (error) {
    console.error('GET /actions/:id:', error);
    res.status(500).json({ error: 'Erreur récupération action' });
  }
});

// POST /api/actions/:id/accept - Accepter une demande de course (driver)
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const actionId = req.params.id;

    // 1. Vérifier que le chauffeur est authentifié et a un driverId
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { id: true, organizationId: true, vehicleId: true, status: true }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    // 2. Récupérer l'action
    const action = await prisma.leadAction.findUnique({
      where: { id: actionId }
    });

    if (!action) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // 3. Définir si c'est une demande LONG_HAUL publique
    const isPublicLongHaul =
      action.type === 'LONG_HAUL' &&
      !action.organizationId;

    // Vérifier que l'action appartient à l'organisation du chauffeur
    // OU que c'est une demande LONG_HAUL publique
    if (!isPublicLongHaul && action.organizationId !== driver.organizationId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Pour les demandes LONG_HAUL publiques, vérifier la compatibilité V2 complète
    if (isPublicLongHaul) {
      const typeService = action.details?.typeService;
      const typeVehicule = action.details?.typeVehicule;
      const vehicleCategoryCode = typeVehicule?.toUpperCase().replace(/-/g, '_');

      // Vérifier que le chauffeur a un véhicule
      const driverVehicle = await prisma.vehicle.findUnique({
        where: { id: driver.vehicleId },
        select: {
          id: true,
          type: true,
          organizationId: true,
          vehicleCategory: {
            select: { code: true }
          }
        }
      }).catch(() => null);

      if (!driverVehicle) {
        return res.status(400).json({ error: 'Véhicule du chauffeur introuvable' });
      }

      // Vérifier la correspondance du véhicule
      const vehicleType = driverVehicle.type
        ? String(driverVehicle.type).toLowerCase()
        : null;

      if (vehicleType !== typeVehicule) {
        return res.status(400).json({
          error: `Véhicule incompatible: ${vehicleType || 'inconnu'} vs ${typeVehicule}`
        });
      }

      // Vérifier que l'organisation du chauffeur a le service V2 compatible
      const serviceCode = {
        passagers: 'LOCATION_INTERURBAINE',
        marchandises: 'MARCHANDISES',
        demenagement: 'MARCHANDISES',
        depannage: 'DEPANNAGE',
        fret: 'FRET'
      }[typeService];

      if (!serviceCode) {
        return res.status(400).json({
          error: `Type de service non mappé V2: ${typeService}`
        });
      }

      const compatibleOrg = await prisma.businessActivity.findFirst({
        where: {
          organizationId: driver.organizationId,
          type: 'INTERURBAN',
          active: true,
          services: {
            some: {
              code: serviceCode,
              active: true,
              tariffs: {
                some: {
                  active: true,
                  vehicleCategory: {
                    code: vehicleCategoryCode
                  }
                }
              }
            }
          }
        },
        select: { id: true }
      }).catch(() => null);

      if (!compatibleOrg) {
        return res.status(403).json({
          error: `Votre organisation n'est pas compatible avec ce service ${typeService}/${typeVehicule}`
        });
      }
    }

    // 4. Vérifier que l'action est encore NEW
    if (action.statut !== 'NEW') {
      return res.status(409).json({ error: 'Cette course a déjà été traitée' });
    }

    // 5. Vérifier que le chauffeur a un véhicule
    const finalVehicleId = driver.vehicleId;
    if (!finalVehicleId) {
      return res.status(400).json({ error: 'Aucun véhicule associé au chauffeur' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: finalVehicleId },
      select: { id: true, organizationId: true, type: true }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    if (vehicle.organizationId && vehicle.organizationId !== driver.organizationId) {
      return res.status(403).json({ error: 'Véhicule non autorisé' });
    }

    // 6. Récupérer les détails calculés depuis LeadAction.details
    const details = action.details || {};

    // 6bis. Vérification métier LONG_HAUL côté serveur
    if (action.type === 'LONG_HAUL') {
      const typeService = details?.typeService;
      const typeVehicule = details?.typeVehicule;

      if (!VALID_LONG_HAUL_SERVICES.includes(typeService)) {
        return res.status(400).json({
          error: `Type de service long-courrier invalide: ${typeService}`
        });
      }

      if (!isVehicleCompatibleWithService(typeService, typeVehicule)) {
        return res.status(400).json({
          error: `Véhicule ${typeVehicule} incompatible avec le service ${typeService}`
        });
      }

      const vehicleType = vehicle.type
        ? String(vehicle.type).toLowerCase()
        : null;

      if (vehicleType !== typeVehicule) {
        return res.status(400).json({
          error: `Le véhicule du chauffeur (${vehicleType || 'inconnu'}) ne correspond pas au véhicule demandé (${typeVehicule})`
        });
      }
    }

    const prixEstime = Number(details.prixEstime || 0);
    const distanceKm = Number(details.distanceKm || 0);
    const modePrestation = details.modePrestation || 'NORMALE';
    // commissionPct = PART CHAUFFEUR (ex: 20% = le chauffeur reçoit 20%)
    const commissionPct = Number(details.commissionPct || 20);

    // Sémantique verrouillée :
    // - commissionPct = part chauffeur
    // - partChauffeur = prix × commissionPct / 100
    // - partOrganisation = prix - partChauffeur
    const partChauffeur = Math.round(prixEstime * commissionPct / 100);
    const partOrganisation = prixEstime - partChauffeur;

    // 7. Transaction atomique : réserver LeadAction + créer Course
    let courseCree = null;

    try {
      courseCree = await prisma.$transaction(async (tx) => {
        // Réserver atomiquement la LeadAction (NEW → ACCEPTED)
        // Si count === 0, un autre chauffeur a déjà accepté
        // Pour les demandes publiques, conditionner sur organizationId = null
        const reservation = await tx.leadAction.updateMany({
          where: {
            id: actionId,
            statut: 'NEW',
            ...(isPublicLongHaul
              ? { organizationId: null }
              : { organizationId: driver.organizationId })
          },
          data: {
            statut: 'ACCEPTED',
            ...(isPublicLongHaul
              ? { organizationId: driver.organizationId }
              : {})
          }
        });

        if (reservation.count === 0) {
          throw new Error('Cette course a déjà été acceptée');
        }

        // Créer la Course complète avec tous les champs métier
        const course = await tx.course.create({
          data: {
            driverId: driver.id,
            vehicleId: finalVehicleId,
            leadActionId: actionId,
            type: modePrestation,
            statut: 'EN_ATTENTE',
            // Contexte client figé
            clientNom: action.clientNom,
            clientTel: action.clientTel,
            adresseDepart: details.depart || null,
            adresseArrivee: details.arrivee || null,
            // Distances
            distanceEstimeeKm: distanceKm,
            distanceKm: distanceKm,
            // Finances figées
            price: prixEstime,
            commissionPct,
            montantChauffeur: partChauffeur,
            montantOrganisation: partOrganisation,
            // Legacy
            commission: partOrganisation,
            // Timestamps
            acceptedAt: new Date()
          }
        });

        return course;
      });
    } catch (txError) {
      if (txError.message === 'Cette course a déjà été acceptée') {
        return res.status(409).json({ error: txError.message });
      }
      throw txError;
    }

    // 8. Marquer UNIQUEMENT les notifications liées à cette action comme lues
    // Utiliser leadActionId pour cibler précisément
    const notifications = await prisma.notification.findMany({
      where: {
        leadActionId: actionId,
        read: false
      },
      select: { id: true }
    }).catch(() => []);

    for (const notif of notifications) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: { read: true }
      }).catch(() => {});
    }

    res.status(201).json(courseCree);
  } catch (error) {
    console.error('POST /actions/:id/accept:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/actions/:id/reject - Refuser une demande de course (driver)
router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const actionId = req.params.id;

    // 1. Vérifier que le chauffeur est authentifié
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: {
        id: true,
        organizationId: true
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    // 2. Récupérer l'action
    const action = await prisma.leadAction.findUnique({
      where: { id: actionId }
    });

    if (!action) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // 3. LONG_HAUL public = demande diffusée à plusieurs chauffeurs
    const isPublicLongHaul =
      action.type === 'LONG_HAUL' &&
      !action.organizationId;

    // 4. Vérification d'autorisation
    if (isPublicLongHaul) {
      // Le chauffeur doit avoir reçu cette demande.
      const notificationForDriver = await prisma.notification.findFirst({
        where: {
          leadActionId: actionId,
          userId: req.user.id
        },
        select: {
          id: true,
          read: true
        }
      });

      if (!notificationForDriver) {
        return res.status(403).json({
          error: 'Cette demande ne vous a pas été attribuée'
        });
      }
    } else {
      // Demande privée : elle doit appartenir à l'organisation.
      if (action.organizationId !== driver.organizationId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    // 5. L'action doit encore être NEW
    if (action.statut !== 'NEW') {
      return res.status(409).json({
        error: 'Cette course a déjà été traitée'
      });
    }

    // ========================================================
    // LONG_HAUL PUBLIC
    // ========================================================
    //
    // Le refus est individuel.
    // NE PAS passer LeadAction à REJECTED.
    // Les autres chauffeurs doivent encore pouvoir accepter.
    //
    if (isPublicLongHaul) {
      await prisma.notification.updateMany({
        where: {
          leadActionId: actionId,
          userId: req.user.id,
          read: false
        },
        data: {
          read: true
        }
      });

      const currentAction = await prisma.leadAction.findUnique({
        where: { id: actionId }
      });

      return res.json(currentAction);
    }

    // ========================================================
    // DEMANDE PRIVÉE / ORGANISATION
    // ========================================================

    const updated = await prisma.leadAction.updateMany({
      where: {
        id: actionId,
        statut: 'NEW',
        organizationId: driver.organizationId
      },
      data: {
        statut: 'REJECTED'
      }
    });

    if (updated.count === 0) {
      return res.status(409).json({
        error: 'Cette course a déjà été traitée'
      });
    }

    // Marquer les notifications liées à cette action comme lues.
    await prisma.notification.updateMany({
      where: {
        leadActionId: actionId,
        read: false
      },
      data: {
        read: true
      }
    }).catch(() => {});

    const rejectedAction = await prisma.leadAction.findUnique({
      where: { id: actionId }
    });

    res.json(rejectedAction);
  } catch (error) {
    console.error('POST /actions/:id/reject:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/actions/:id - Mettre à jour le statut
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    
    if (!statut || !VALID_STATUTS.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const action = await prisma.leadAction.findUnique({
      where: { id: req.params.id },
    });
    
    if (!action) return res.status(404).json({ error: 'Action introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (action.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    const updated = await prisma.leadAction.update({
      where: { id: req.params.id },
      data: { statut },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('PATCH /actions/:id:', error);
    res.status(500).json({ error: 'Erreur modification action' });
  }
});

module.exports = router;
