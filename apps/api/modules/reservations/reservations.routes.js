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

// GET /api/reservations - Liste des réservations de l'organisation
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (!orgId) return res.status(403).json({ error: 'Organisation introuvable' });
      
      const departs = await prisma.depart.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });
      
      where.departId = { in: departs.map(d => d.id) };
    } else if (req.query.organizationId) {
      const departs = await prisma.depart.findMany({
        where: { organizationId: req.query.organizationId },
        select: { id: true },
      });
      where.departId = { in: departs.map(d => d.id) };
    }
    
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        depart: {
          select: {
            pointDepart: true,
            destination: true,
            date: true,
            heure: true,
            prix: true,
            vehicle: {
              select: { id: true, plate: true, model: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(reservations);
  } catch (error) {
    console.error('GET /reservations:', error);
    res.status(500).json({ error: 'Erreur récupération réservations' });
  }
});

// POST /api/reservations - Créer une réservation avec vérification de place
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { departId, passagerNom, telephone, place } = req.body;
    
    if (!departId || !passagerNom || !telephone || !place) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Vérifier que le départ existe
    const depart = await prisma.depart.findUnique({
      where: { id: departId },
      include: {
        reservations: { select: { place: true, statut: true } },
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    // Vérifier l'isolation organisationnelle
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    // Vérifier que la place n'est pas déjà réservée
    const existingReservation = depart.reservations.find(
      r => r.place === place && r.statut === 'CONFIRMED'
    );
    
    if (existingReservation) {
      return res.status(409).json({ error: 'Place déjà réservée' });
    }
    
    // Créer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        departId,
        passagerNom: String(passagerNom).trim(),
        telephone: String(telephone).trim(),
        place: String(place).trim(),
        statut: 'CONFIRMED',
      },
      include: {
        depart: {
          select: {
            pointDepart: true,
            destination: true,
            date: true,
            heure: true,
            prix: true,
            vehicle: {
              select: { id: true, plate: true, model: true },
            },
          },
        },
      },
    });
    
    res.status(201).json(reservation);
  } catch (error) {
    console.error('POST /reservations:', error);
    res.status(500).json({ error: 'Erreur création réservation' });
  }
});

// GET /api/reservations/mine - Réservations du véhicule du chauffeur connecté
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER' || !req.user.driverId) {
      return res.status(403).json({ error: 'Réservé aux chauffeurs' });
    }

    // Trouver le chauffeur et son véhicule
    const driver = await prisma.driver.findUnique({
      where: { id: req.user.driverId },
      select: { vehicleId: true, organizationId: true },
    });

    if (!driver || !driver.vehicleId) {
      return res.json([]);
    }

    // Trouver les départs du véhicule
    const departs = await prisma.depart.findMany({
      where: {
        vehiculeId: driver.vehicleId,
        statut: { in: ['PUBLISHED', 'LEFT'] },
      },
      select: { id: true },
    });

    const departIds = departs.map(d => d.id);

    if (departIds.length === 0) {
      return res.json([]);
    }

    // Trouver les réservations pour ces départs
    const reservations = await prisma.reservation.findMany({
      where: {
        departId: { in: departIds },
        statut: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        depart: {
          select: {
            pointDepart: true,
            destination: true,
            date: true,
            heure: true,
          },
        },
      },
      orderBy: [{ place: 'asc' }],
    });

    res.json(reservations);
  } catch (error) {
    console.error('GET /reservations/mine:', error);
    res.status(500).json({ error: 'Erreur manifest' });
  }
});


// GET /api/reservations/:id - Détail d'une réservation
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { depart: true },
    });
    
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    
    res.json(reservation);
  } catch (error) {
    console.error('GET /reservations/:id:', error);
    res.status(500).json({ error: 'Erreur récupération réservation' });
  }
});

// PUT /api/reservations/:id - Modifier statut
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    
    if (!statut) return res.status(400).json({ error: 'Statut requis' });
    
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { depart: true },
    });
    
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (reservation.depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { statut: String(statut) },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('PUT /reservations/:id:', error);
    res.status(500).json({ error: 'Erreur modification réservation' });
  }
});

// DELETE /api/reservations/:id - Annuler une réservation
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { depart: true },
    });
    
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    
    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      if (reservation.depart.organizationId !== orgId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    await prisma.reservation.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /reservations/:id:', error);
    res.status(500).json({ error: 'Erreur suppression réservation' });
  }
});

module.exports = router;
