const express = require('express');
const prisma = require('../../lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
        mvolaNumber: true,
        orangeNumber: true,
        airtelNumber: true,
        logo: true,
        plan: true,
        createdAt: true,
        departs: {
          where: {
            statut: 'PUBLISHED',
            OR: [
              { date: { gt: new Date() } },
              {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            ],
          },
          orderBy: [{ date: 'asc' }, { heure: 'asc' }],
          select: {
            id: true,
            pointDepart: true,
            destination: true,
            date: true,
            heure: true,
            prix: true,
            placesTotal: true,
            reservations: {
              where: { statut: 'CONFIRMED' },
              select: { place: true },
            },
          },
          take: 5,
        },
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
  // Mettre à jour automatiquement les départs partis en LEFT
  try {
    const departsExpires = await prisma.depart.findMany({
      where: {
        statut: 'PUBLISHED',
        date: { lt: new Date() },
      },
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
  } catch (e) {
    console.error('Auto-archivage départs:', e.message);
  }

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
      orderBy: [{ date: 'asc' }, { heure: 'asc' }],
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
    
    // Créer une notification pour tous les managers de l'organisation
    // Trouver les managers par l'email de l'organisation
    const orgData = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { email: true },
    });
    
    const managers = orgData?.email ? await prisma.user.findMany({
      where: {
        role: { in: ['FLEET_MANAGER', 'COOPERATIVE', 'COOP_MANAGER'] },
        email: orgData.email,
      },
      select: { id: true },
    }).catch(() => []) : [];

    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          organizationId: org.id,
          type: 'lead_action',
          title: `Nouvelle demande : ${type}`,
          message: `${clientNom} - ${clientTel}`,
          read: false,
        },
      }).catch(() => {});
    }

    // Notifier les chauffeurs disponibles pour les demandes de course
    if (type === 'COURSE_REQUEST' || type === 'TAXI_RESERVATION') {
      // Mapping typeVehicule (formulaire public) → Vehicle.type (base)
      const VEHICLE_TYPE_MAP = {
        'moto': 'taxi_moto',
        'taxi_moto': 'taxi_moto',
        'voiture': 'voiture',
        'taxi': 'taxi',
        'minivan': 'minivan',
        'bus': 'bus',
        'tricycle': 'tricycle'
      };
      const vehicleType = VEHICLE_TYPE_MAP[details?.typeVehicule] || null;

      // Si le type est inconnu, ne pas filtrer par véhicule (tous les chauffeurs dispo)
      const driverWhere = {
        organizationId: org.id,
        status: { in: ['AVAILABLE', 'active'] }
      };
      if (vehicleType) {
        driverWhere.vehicle = { type: vehicleType };
      }

      const drivers = await prisma.driver.findMany({
        where: driverWhere,
        select: { userId: true, driverCode: true }
      });

      for (const driver of drivers) {
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            organizationId: org.id,
            type: 'course_request',
            title: 'Nouvelle course disponible',
            message: `${clientNom} - ${details?.depart || ''} → ${details?.arrivee || ''}`,
            read: false,
          },
        }).catch(() => {});
      }
    }

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
    
    // Vérifier si le départ est déjà parti
    const [h, m] = depart.heure.split(':').map(Number);
    const departTime = new Date(depart.date);
    departTime.setHours(h, m, 0, 0);
    if (departTime.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Départ déjà parti' });
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
        statut: 'PENDING',
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
    
    // Vérifier si le départ est déjà parti
    const [h, m] = depart.heure.split(':').map(Number);
    const departTime = new Date(depart.date);
    departTime.setHours(h, m, 0, 0);
    if (departTime.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Départ déjà parti' });
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
    
    // Limite : 5 places maximum par téléphone
    const existingReservations = await prisma.reservation.findMany({
      where: {
        telephone: String(telephone).trim(),
        statut: { in: ['CONFIRMED', 'PENDING'] },
        depart: { date: { gte: new Date() } },
      },
    });
    
    if (existingReservations.length + passagers.length > 5) {
      return res.status(400).json({ error: 'Limite de 5 places par téléphone' });
    }

    // Vérifier les doublons dans la demande
    const uniquePlaces = new Set(placesDemandees);
    if (uniquePlaces.size !== placesDemandees.length) {
      return res.status(400).json({ error: 'Places en double dans la demande' });
    }
    
    // Créer une réservation par passager
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otpCode, 12);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const reservations = [];
    for (const passager of passagers) {
      const reservation = await prisma.reservation.create({
        data: {
          departId,
          passagerNom: String(passager.passagerNom).trim(),
          telephone: String(telephone).trim(),
          place: String(passager.place).trim(),
          statut: 'PENDING',
          otpHash,
          otpExpiresAt,
        },
      });
      reservations.push(reservation);
    }
    
    // Notifier les managers
    const orgData = await prisma.organization.findUnique({
      where: { id: depart.organizationId },
      select: { email: true },
    });
    
    const managers = orgData?.email ? await prisma.user.findMany({
      where: {
        role: { in: ['COOPERATIVE', 'COOP_MANAGER'] },
        email: orgData.email,
      },
      select: { id: true },
    }).catch(() => []) : [];

    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          organizationId: depart.organizationId,
          type: 'reservation',
          title: 'Nouvelle réservation',
          message: `${passagers.length} place(s) réservée(s) sur ${depart.pointDepart} → ${depart.destination}`,
          read: false,
        },
      }).catch(() => {});
    }

    // Générer un code OTP pour validation
    

    res.status(201).json({
      ok: true,
      otpCode,
      message: `Code OTP simulé : ${otpCode}`,
      reservations,
    });
  } catch (error) {
    console.error('POST /public/reservations/batch:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/reservations/manage - Gérer sa réservation (annuler ou modifier)
router.post('/reservations/manage', async (req, res) => {
  try {
    const { telephone, passagerNom, otpCode, action, reservationId, nouvellePlace } = req.body;
    
    if (!telephone || !passagerNom || !otpCode) {
      return res.status(400).json({ error: 'Telephone, nom et code OTP requis' });
    }
    
    // Trouver les réservations du client
    const reservations = await prisma.reservation.findMany({
      where: {
        telephone: String(telephone).trim(),
        passagerNom: String(passagerNom).trim(),
        statut: 'PENDING',
      },
      include: { depart: true },
    });
    
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Aucune réservation trouvée avec ces informations' });
    }

    const otpValid = reservations[0].otpHash && reservations[0].otpExpiresAt && reservations[0].otpExpiresAt > new Date() && await bcrypt.compare(String(otpCode), reservations[0].otpHash);
    if (!otpValid) return res.status(403).json({ error: 'Code OTP invalide ou expire' });
    
    // Action : ANNULER
    if (action === 'cancel' && reservationId) {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Réservation introuvable' });
      }
      
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { statut: 'CANCELLED' },
      });
      
      return res.json({ ok: true, message: 'Réservation annulée' });
    }
    
    // Action : MODIFIER PLACE
    if (action === 'modify' && reservationId && nouvellePlace) {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Réservation introuvable' });
      }
      
      // Vérifier que la nouvelle place est disponible
      const depart = await prisma.depart.findUnique({
        where: { id: reservation.departId },
        include: {
          reservations: { where: { statut: { in: ['PENDING', 'CONFIRMED'] }, NOT: { id: reservationId } }, select: { place: true } },
        },
      });
      
      if (!depart) {
        return res.status(404).json({ error: 'Départ introuvable' });
      }
      
      const placesReservees = depart.reservations.map(r => r.place);
      if (placesReservees.includes(nouvellePlace)) {
        return res.status(409).json({ error: 'Place déjà réservée' });
      }
      
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { place: String(nouvellePlace) },
      });
      
      return res.json({ ok: true, message: 'Place modifiée' });
    }
    
    // Sans action : retourner les réservations du client
    return res.json({ reservations });
  } catch (error) {
    console.error('POST /public/reservations/manage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/dagoos-mobile-money - Numéros Mobile Money DAGOO'S
router.get('/dagoos-mobile-money', async (req, res) => {
  try {
    const dagooOrg = await prisma.organization.findFirst({
      where: { type: 'ADMIN' },
      select: {
        mvolaNumber: true,
        orangeNumber: true,
        airtelNumber: true,
      },
    });
    
    res.json(dagooOrg || { mvolaNumber: null, orangeNumber: null, airtelNumber: null });
  } catch (error) {
    console.error('GET /public/dagoos-mobile-money:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
