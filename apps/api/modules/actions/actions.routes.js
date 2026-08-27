const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const VALID_TYPES = [
  'COURSE_REQUEST',
  'TAXI_RESERVATION',
  'PASSENGER_RESERVATION',
  'DELIVERY_REQUEST',
  'CARGO_RESERVATION',
  'CAR_RENTAL',
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

    // 3. Vérifier que l'action appartient à l'organisation du chauffeur
    if (action.organizationId !== driver.organizationId) {
      return res.status(403).json({ error: 'Accès refusé' });
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
      select: { id: true, organizationId: true }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Véhicule introuvable' });
    }

    if (vehicle.organizationId && vehicle.organizationId !== driver.organizationId) {
      return res.status(403).json({ error: 'Véhicule non autorisé' });
    }

    // 6. Récupérer les détails calculés depuis LeadAction.details
    const details = action.details || {};
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
        const reservation = await tx.leadAction.updateMany({
          where: { id: actionId, statut: 'NEW' },
          data: { statut: 'ACCEPTED' }
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

    // Vérifier que le chauffeur est authentifié
    if (!req.user.driverId) {
      return res.status(403).json({ error: 'Chauffeur non associé' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { id: true, organizationId: true }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable' });
    }

    // Récupérer l'action
    const action = await prisma.leadAction.findUnique({
      where: { id: actionId }
    });

    if (!action) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // Vérifier l'organisation
    if (action.organizationId !== driver.organizationId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que l'action est encore NEW
    if (action.statut !== 'NEW') {
      return res.status(409).json({ error: 'Cette course a déjà été traitée' });
    }

    // Mettre à jour le statut
    const updated = await prisma.leadAction.update({
      where: { id: actionId },
      data: { statut: 'REJECTED' }
    });

    res.json(updated);
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
