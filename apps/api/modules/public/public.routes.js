const express = require('express');
const prisma = require('../../lib/prisma');

const router = express.Router();

// =========================================================
// ORGANISATION PUBLIQUE
// =========================================================

// GET /api/public/organizations - Liste publique des organisations
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        phone: true,
        logo: true,
        plan: true,
        createdAt: true,
      },
    });
    res.json(organizations);
  } catch (error) {
    console.error('GET /public/organizations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/organizations/:slug - Infos publiques de l'organisation
router.get('/organizations/:slug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        phone: true,
        logo: true,
        description: true,
        plan: true,
        createdAt: true,
      },
    });
    
    if (!org) return res.status(404).json({ error: 'Organisation introuvable' });
    
    if (org.status && org.status !== 'active') {
      return res.status(404).json({ error: 'Organisation indisponible' });
    }
    
    res.json(org);
  } catch (error) {
    console.error('GET /public/organizations/:slug:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/departs/:slug - Départs publiés d'une organisation
router.get('/departs/:slug', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    
    if (!org) return res.status(404).json({ error: 'Organisation introuvable' });
    
    const departs = await prisma.depart.findMany({
      where: {
        organizationId: org.id,
        statut: 'PUBLISHED',
        date: { gte: new Date() },
      },
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        reservations: {
          where: { statut: 'CONFIRMED' },
          select: { place: true },
        },
      },
      orderBy: [{ date: 'asc' }, { heure: 'asc' }],
    });
    
    res.json(departs);
  } catch (error) {
    console.error('GET /public/departs/:slug:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =========================================================
// ACTION PUBLIQUE
// =========================================================

// POST /api/public/actions - Créer une action depuis la landing
router.post('/actions', async (req, res) => {
  try {
    const { organizationSlug, type, clientNom, clientTel, details } = req.body;
    
    if (!organizationSlug || !type || !clientNom || !clientTel) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true },
    });
    
    if (!org) return res.status(404).json({ error: 'Organisation introuvable' });
    
    const VALID_TYPES = [
      'COURSE_REQUEST',
      'TAXI_RESERVATION',
      'PASSENGER_RESERVATION',
      'DELIVERY_REQUEST',
      'CARGO_RESERVATION',
      'CAR_RENTAL',
      'CONTACT',
    ];
    
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type invalide' });
    }
    
    const action = await prisma.leadAction.create({
      data: {
        organizationId: org.id,
        type,
        clientNom: String(clientNom).trim(),
        clientTel: String(clientTel).trim(),
        details: details || {},
        statut: 'NEW',
      },
    });
    
    // Créer une notification pour l'organisation
    await prisma.notification.create({
      data: {
        userId: req.body.userId || '',
        organizationId: org.id,
        type: 'lead_action',
        title: `Nouvelle action : ${type}`,
        message: `${clientNom} - ${clientTel}`,
        read: false,
      },
    }).catch(() => {
      // Ne pas bloquer si la notification échoue
    });
    
    res.status(201).json({ ok: true, actionId: action.id });
  } catch (error) {
    console.error('POST /public/actions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =========================================================
// RÉSERVATION PUBLIQUE
// =========================================================

// POST /api/public/reservations - Créer une réservation depuis la landing
router.post('/reservations', async (req, res) => {
  try {
    const { departId, passagerNom, telephone, place } = req.body;
    
    if (!departId || !passagerNom || !telephone || !place) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const depart = await prisma.depart.findUnique({
      where: { id: departId },
      include: {
        reservations: {
          where: { statut: 'CONFIRMED' },
          select: { place: true },
        },
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (depart.statut !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Départ non disponible' });
    }
    
    // Vérifier la place
    const placeReservee = depart.reservations.find(r => r.place === place);
    if (placeReservee) {
      return res.status(409).json({ error: 'Place déjà réservée' });
    }
    
    const reservation = await prisma.reservation.create({
      data: {
        departId,
        passagerNom: String(passagerNom).trim(),
        telephone: String(telephone).trim(),
        place: String(place).trim(),
        statut: 'CONFIRMED',
      },
    });
    
    res.status(201).json({ ok: true, reservationId: reservation.id });
  } catch (error) {
    console.error('POST /public/reservations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/reservations/batch - Réservation multiple
router.post('/reservations/batch', async (req, res) => {
  try {
    const { departId, telephone, passagers } = req.body;
    
    if (!departId || !telephone || !Array.isArray(passagers) || passagers.length === 0) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const depart = await prisma.depart.findUnique({
      where: { id: departId },
      include: {
        reservations: {
          where: { statut: 'CONFIRMED' },
          select: { place: true },
        },
      },
    });
    
    if (!depart) return res.status(404).json({ error: 'Départ introuvable' });
    
    if (depart.statut !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Départ non disponible' });
    }
    
    // Vérifier que toutes les places sont disponibles
    const placesReservees = depart.reservations.map(r => r.place);
    const placesDemandees = passagers.map(p => p.place);
    
    const placesEnConflit = placesDemandees.filter(p => placesReservees.includes(p));
    if (placesEnConflit.length > 0) {
      return res.status(409).json({
        error: 'Places déjà réservées',
        places: placesEnConflit,
      });
    }
    
    // Vérifier les doublons dans la demande
    const uniquePlaces = new Set(placesDemandees);
    if (uniquePlaces.size !== placesDemandees.length) {
      return res.status(400).json({ error: 'Places en double dans la demande' });
    }
    
    // Créer une réservation par passager
    const reservations = [];
    for (const passager of passagers) {
      const reservation = await prisma.reservation.create({
        data: {
          departId,
          passagerNom: String(passager.passagerNom).trim(),
          telephone: String(telephone).trim(),
          place: String(passager.place).trim(),
          statut: 'CONFIRMED',
        },
      });
      reservations.push(reservation);
    }
    
    res.status(201).json({
      ok: true,
      reservations,
    });
  } catch (error) {
    console.error('POST /public/reservations/batch:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
