const express = require('express');
const prisma = require('../../lib/prisma');
const { authMiddleware } = require('../../middleware/auth');
const { requirePermission } = require('../../security/require-permission');

const router = express.Router();

const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADMIN'];

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

// GET /api/departs - Liste des départs de l'organisation
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Auto-archiver les départs partis
    const departsExpires = await prisma.depart.findMany({
      where: { statut: 'PUBLISHED', date: { lt: new Date() } },
      select: { id: true, date: true, heure: true },
    });
    for (const d of departsExpires) {
      const [h, m] = (d.heure || '').split(':').map(Number);
      const dt = new Date(d.date);
      dt.setHours(h, m, 0, 0);
      if (dt.getTime() <= Date.now()) {
        await prisma.depart.update({
          where: { id: d.id },
          data: { statut: 'LEFT' },
        }).catch(() => {});
      }
    }

    const where = {};
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
      where.organizationId = orgId;
    } else if (req.query.organizationId) {
      where.organizationId = req.query.organizationId;
    }
    
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const [departs, total] = await Promise.all([
      prisma.depart.findMany({
        where,
        include: {
          vehicle: { select: { id: true, plate: true, model: true } },
          reservations: { select: { id: true, place: true, passagerNom: true, statut: true } },
        },
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      prisma.depart.count({ where }),
    ]);
    
    res.json({
      data: departs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /departs:', error);
    res.status(500).json({ error: 'Erreur récupération départs' });
  }
});

// POST /api/departs - Créer un départ
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pointDepart, destination, date, heure, prix, vehiculeId, placesTotal } = req.body;
    
    if (!pointDepart || !destination || !date || !heure || !prix) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!vehiculeId) {
      return res.status(400).json({ error: 'Véhicule obligatoire pour créer un départ' });
    }
    
    let orgId;
    if (GLOBAL_ROLES.includes(req.user.role)) {
      orgId = req.body.organizationId;
      if (!orgId) return res.status(400).json({ error: 'organizationId requis' });
    } else {
      orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
    }
    
    // Vérifier que le véhicule n'a pas déjà un départ PUBLISHED
    if (vehiculeId) {
      const existingDepart = await prisma.depart.findFirst({
        where: {
          vehiculeId,
          statut: 'PUBLISHED',
          date: { gte: new Date() },
        },
      });
      
      if (existingDepart) {
        return res.status(409).json({ error: 'Ce véhicule a déjà un départ publié' });
      }
    }

    // Si placesTotal n'est pas fourni, utiliser celui du véhicule
    let finalPlacesTotal = Number(placesTotal || 0);
    if (!finalPlacesTotal && vehiculeId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehiculeId },
        select: { placesTotal: true },
      });
      finalPlacesTotal = vehicle?.placesTotal || 0;
    }
    if (!finalPlacesTotal) finalPlacesTotal = 1;

    const depart = await prisma.depart.create({
      data: {
        organizationId: orgId,
        pointDepart: String(pointDepart).trim(),
        destination: String(destination).trim(),
        date: new Date(date),
        heure: String(heure).trim(),
        prix: Number(prix),
        vehiculeId: vehiculeId || null,
        placesTotal: finalPlacesTotal,
        statut: 'PUBLISHED',
      },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
      },
    });
    
    res.status(201).json(depart);
  } catch (error) {
    console.error('POST /departs:', error);
    res.status(500).json({ error: 'Erreur création départ' });
  }
});


// GET /api/departs/mine - Départ du jour du chauffeur connecté
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER' || !req.user.driverId) {
      return res.status(403).json({ error: 'Réservé aux chauffeurs' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { vehicleId: true, organizationId: true },
    });

    if (!driver || !driver.vehicleId) {
      return res.json({ depart: null });
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const depart = await prisma.depart.findFirst({
      where: {
        vehiculeId: driver.vehicleId,
        date: { gte: today, lt: tomorrow },
        statut: { in: ['PUBLISHED', 'EMBARQUEMENT', 'TERMINÉ'] },
      },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        reservations: {
          orderBy: { place: 'asc' },
          select: {
            id: true, place: true, passagerNom: true, telephone: true,
            statut: true, paiementRef: true, paiementInfo: true,
          },
        },
      },
    });

    if (!depart) return res.json({ depart: null });

    const passagersPayes = depart.reservations.filter(r => r.statut === 'CONFIRMED').length;
    const recette = passagersPayes * depart.prix;
    const versementCoop = recette * 0.8;
    const commissionChauffeur = recette * 0.2;

    res.json({
      depart: {
        id: depart.id, pointDepart: depart.pointDepart, destination: depart.destination,
        date: depart.date, heure: depart.heure, prix: depart.prix,
        placesTotal: depart.placesTotal, statut: depart.statut,
      },
      vehicle: depart.vehicle,
      passagers: depart.reservations,
      finance: {
        tarifUnitaire: depart.prix, passagersPayes,
        passagersTotal: depart.reservations.length,
        placesRestantes: depart.placesTotal - depart.reservations.length,
        recette, versementCoop, commissionChauffeur,
      },
    });
  } catch (error) {
    console.error('GET /departs/mine:', error);
    res.status(500).json({ error: 'Erreur récupération départ' });
  }
});

// GET /api/departs/:id - Détail d'un départ
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        reservations: true,
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    // Vérifier l'isolation
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    res.json(depart);
  } catch (error) {
    console.error('GET /departs/:id:', error);
    res.status(500).json({ error: 'Erreur récupération départ' });
  }
});


// POST /api/departs/:id/transition - Changer le statut du départ (chauffeur)
router.post('/:id/transition', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER' || !req.user.driverId) {
      return res.status(403).json({ error: 'Réservé aux chauffeurs' });
    }
    const { action } = req.body;
    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { vehicleId: true, organizationId: true },
    });
    if (!driver || !driver.vehicleId) return res.status(403).json({ error: 'Aucun véhicule assigné' });
    const depart = await prisma.depart.findUnique({ where: { id: req.params.id } });
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    if (depart.vehiculeId !== driver.vehicleId) return res.status(403).json({ error: 'Ce départ ne vous est pas assigné' });
    if (depart.organizationId !== driver.organizationId) return res.status(403).json({ error: 'Accès refusé' });

    let nouveauStatut;
    if (action === 'start_embarquement' && depart.statut === 'PUBLISHED') nouveauStatut = 'EMBARQUEMENT';
    else if (action === 'terminer' && depart.statut === 'EMBARQUEMENT') nouveauStatut = 'TERMINÉ';
    else return res.status(400).json({ error: `Transition invalide : ${depart.statut} → ${action}` });

    const updated = await prisma.depart.update({
      where: { id: depart.id },
      data: { statut: nouveauStatut },
      include: { vehicle: { select: { id: true, plate: true, model: true } } },
    });
    res.json({ ok: true, depart: updated, message: `Départ passé à ${nouveauStatut}` });
  } catch (error) {
    console.error('POST /departs/:id/transition:', error);
    res.status(500).json({ error: 'Erreur transition' });
  }
});

// PUT /api/departs/:id - Modifier un départ
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({ where: { id: req.params.id } });
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    const { pointDepart, destination, date, heure, prix, vehiculeId, placesTotal, statut } = req.body;

    // Vérifier que le véhicule n'a pas déjà un départ PUBLISHED (hors ce départ)
    if (vehiculeId) {
      const existingDepart = await prisma.depart.findFirst({
        where: {
          vehiculeId,
          statut: 'PUBLISHED',
          date: { gte: new Date() },
          NOT: { id: req.params.id },
        },
      });
      
      if (existingDepart) {
        return res.status(409).json({ error: 'Ce véhicule a déjà un départ publié' });
      }
    }
    
    const updated = await prisma.depart.update({
      where: { id: req.params.id },
      data: {
        ...(pointDepart && { pointDepart: String(pointDepart).trim() }),
        ...(destination && { destination: String(destination).trim() }),
        ...(date && { date: new Date(date) }),
        ...(heure && { heure: String(heure).trim() }),
        ...(prix !== undefined && { prix: Number(prix) }),
        ...(vehiculeId !== undefined && { vehiculeId: vehiculeId || null }),
        ...(placesTotal !== undefined && { placesTotal: Number(placesTotal) }),
        ...(statut && { statut: String(statut) }),
      },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
      },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('PUT /departs/:id:', error);
    res.status(500).json({ error: 'Erreur modification départ' });
  }
});

// DELETE /api/departs/:id - Supprimer un départ
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({ where: { id: req.params.id } });
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    // Supprimer d'abord les réservations liées au départ
    // PostgreSQL interdit la suppression du parent tant que les enfants existent.
    await prisma.$transaction([
      prisma.reservation.deleteMany({
        where: { departId: req.params.id },
      }),
      prisma.depart.delete({
        where: { id: req.params.id },
      }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /departs/:id:', error);
    res.status(500).json({ error: 'Erreur suppression départ' });
  }
});

// GET /api/departs/:id/manifest - Manifest des passagers
router.get('/:id/manifest', authMiddleware, async (req, res) => {
  try {
    const depart = await prisma.depart.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        reservations: {
          where: { statut: { in: ['PENDING', 'CONFIRMED', 'CANCELLED'] } },
          orderBy: { place: 'asc' },
          select: {
            id: true,
            place: true,
            passagerNom: true,
            telephone: true,
            statut: true,
            paiementRef: true,
          },
        },
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    // Vérifier l'isolation
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    res.json({
      depart: {
        id: depart.id,
        pointDepart: depart.pointDepart,
        destination: depart.destination,
        date: depart.date,
        heure: depart.heure,
        prix: depart.prix,
        placesTotal: depart.placesTotal,
        statut: depart.statut,
      },
      vehicle: depart.vehicle,
      passagers: depart.reservations,
      totalConfirmes: depart.reservations.length,
      placesRestantes: depart.placesTotal - depart.reservations.length,
    });
  } catch (error) {
    console.error('GET /departs/:id/manifest:', error);
    res.status(500).json({ error: 'Erreur manifest' });
  }
});

module.exports = router;
