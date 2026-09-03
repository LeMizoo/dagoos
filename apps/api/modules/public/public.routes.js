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

// =========================================================
// GÉOCODAGE ET CALCUL DE DISTANCE
// =========================================================

/**
 * Calcule la distance haversine entre deux points GPS (en km)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Géocode une adresse via Nominatim (OpenStreetMap)
 * Retourne { lat, lng } ou null
 */
async function geocodeAdresse(adresse) {
  if (!adresse) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse + ', Antananarivo, Madagascar')}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DAGOOS/1.0' }
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch(e) {
    console.warn('Géocodage échoué:', e.message);
    return null;
  }
}

/**
 * Génère un code de suivi unique (ex: DG-8F3K)
 */
function genererCodeSuivi() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'DG-' + code;
}

/**
 * Calcule la distance entre deux adresses
 * Retourne la distance en km, ou 0 si géocodage impossible
 */
async function calculerDistance(depart, arrivee) {
  if (!depart || !arrivee) return 0;

  const coordDepart = await geocodeAdresse(depart);
  const coordArrivee = await geocodeAdresse(arrivee);

  if (!coordDepart || !coordArrivee) return 0;

  const distance = haversineDistance(
    coordDepart.lat, coordDepart.lng,
    coordArrivee.lat, coordArrivee.lng
  );

  // Facteur de correction pour routes réelles (vs vol d'oiseau)
  const FACTEUR_ROUTE = 1.35;
  return Math.round(distance * FACTEUR_ROUTE * 10) / 10;
}

/**
 * Arrondit un prix à un montant commercial
 * - Multiple de 500 Ar si prix < 10000
 * - Multiple de 1000 Ar si prix >= 10000
 */
function arrondirPrix(prix) {
  if (prix <= 0) return 0;

  if (prix < 10000) {
    // Arrondir au multiple de 500 supérieur
    return Math.ceil(prix / 500) * 500;
  } else {
    // Arrondir au multiple de 1000 supérieur
    return Math.ceil(prix / 1000) * 1000;
  }
}

// POST /api/public/estimate - Estimer distance et prix
router.post('/estimate', async (req, res) => {
  try {
    const { organizationSlug, depart, arrivee, typeVehicule } = req.body;

    if (!organizationSlug || !depart || !arrivee) {
      return res.status(400).json({ error: 'Départ et arrivée requis' });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true }
    });

    if (!org) return res.status(404).json({ error: 'Organisation introuvable' });

    // Calculer la distance
    const distanceKm = await calculerDistance(depart, arrivee);

    // Récupérer le tarif
    const VEHICLE_TYPE_MAP = {
      'moto': 'moto',
      'voiture': 'voiture',
      'taxi': 'voiture',
      'bus': 'bus',
      'minivan': 'minivan',
      'tricycle': 'tricycle'
    };
    const cleTarif = VEHICLE_TYPE_MAP[typeVehicule] || 'moto';

    const tarif = await prisma.tarif.findUnique({
      where: { organizationId: org.id }
    }).catch(() => null);

    let prixEstime = 2000;
    let modePrestation = 'courseNormale';

    if (tarif?.vehiculeTarifs) {
      try {
        const vehiculeTarifs = JSON.parse(tarif.vehiculeTarifs);
        const tarifVehicule = vehiculeTarifs[cleTarif];

        if (tarifVehicule) {
          if (['bus', 'minivan', 'tricycle'].includes(cleTarif)) {
            prixEstime = tarifVehicule?.tarifFixe?.prixTrajet || tarif.prixBase;
            modePrestation = 'tarifFixe';
          } else if (tarifVehicule?.courseNormale) {
            const prixBase = tarifVehicule.courseNormale.prixBase || tarif.prixBase;
            const prixKm = tarifVehicule.courseNormale.prixKm || tarif.prixKm;
            prixEstime = arrondirPrix(prixBase + (distanceKm * prixKm));
            modePrestation = 'courseNormale';
          }
        }
      } catch(e) {}
    } else if (tarif) {
      prixEstime = arrondirPrix(tarif.prixBase + (distanceKm * tarif.prixKm));
    }

    res.json({
      distanceKm,
      prixEstime,
      modePrestation
    });
  } catch (error) {
    console.error('POST /public/estimate:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/public/suivi/:code - Suivre une demande par code
router.get('/suivi/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Code requis' });
    }

    // Rechercher la LeadAction avec ce code dans details
    const action = await prisma.leadAction.findFirst({
      where: {
        details: {
          path: ['codeSuivi'],
          equals: code
        }
      },
      select: {
        id: true,
        clientNom: true,
        clientTel: true,
        type: true,
        statut: true,
        details: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!action) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    res.json({
      codeSuivi: code,
      statut: action.statut,
      clientNom: action.clientNom,
      type: action.type,
      depart: action.details?.depart || '',
      arrivee: action.details?.arrivee || '',
      prixEstime: action.details?.prixEstime || 0,
      offreClient: action.details?.offreClient || null,
      contreOffreChauffeur: action.details?.contreOffreChauffeur || null,
      statutNegociation: action.details?.statutNegociation || null,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt
    });
  } catch (error) {
    console.error('GET /public/suivi/:code:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/public/estimate-location - Estimer une location
router.post('/estimate-location', async (req, res) => {
  try {
    const { organizationSlug, typeVehicule, typeTrajet, depart, arrivee, dateAller, dateRetour, carburant } = req.body;

    if (!organizationSlug || !depart || !arrivee || !typeTrajet) {
      return res.status(400).json({ error: 'Informations manquantes' });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true }
    });

    if (!org) return res.status(404).json({ error: 'Organisation introuvable' });

    // Calculer la distance
    const distanceKm = await calculerDistance(depart, arrivee);

    // Récupérer le tarif
    const tarif = await prisma.tarif.findUnique({
      where: { organizationId: org.id }
    }).catch(() => null);

    if (!tarif) {
      return res.status(404).json({ error: 'Tarif non configuré' });
    }

    // Parser vehiculeTarifs
    let vehiculeTarifs = {};
    if (tarif.vehiculeTarifs) {
      try {
        vehiculeTarifs = JSON.parse(tarif.vehiculeTarifs);
      } catch(e) {}
    }

    // Récupérer le tarif location du type de véhicule
    const typeMap = { 'bus': 'bus', 'minivan': 'minivan', 'tricycle': 'tricycle' };
    const cle = typeMap[typeVehicule] || 'bus';
    const tarifLocation = vehiculeTarifs[cle]?.location || {};

    const prixBase =
      Number(tarifLocation.prixBase) ||
      Number(tarif.prixBase) ||
      100000;

    const prixKm =
      Number(tarifLocation.prixKm) ||
      Number(tarif.prixKm) ||
      1500;

    const forfaitJournalier =
      Number(tarifLocation.forfaitJournalier) ||
      50000;

    // Calculer le nombre de jours
    let nbJours = 1;
    if (typeTrajet === 'A_B_A_MULTI' && dateAller && dateRetour) {
      const debut = new Date(dateAller);
      const fin = new Date(dateRetour);
      nbJours = Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 3600 * 24)) + 1);
    }

    let prixEstime = 0;

    switch (typeTrajet) {
      case 'A_B':
        if (carburant === 'AVEC') {
          // Tarif fixe sans km
          prixEstime = prixBase;
        } else {
          // Base + (x × prixKm) + ½ Base
          prixEstime = prixBase + (distanceKm * prixKm) + (prixBase * 0.5);
        }
        break;

      case 'A_B_A':
        // 2 × Base + (2x × prixKm)
        prixEstime = (2 * prixBase) + (2 * distanceKm * prixKm);
        break;

      case 'A_B_A_MULTI':
        // Base + (xJ1 × prixKm) + (forfait × nbJours) + (xJn × prixKm) + Base
        prixEstime = prixBase + (distanceKm * prixKm) + (forfaitJournalier * nbJours) + (distanceKm * prixKm) + prixBase;
        break;

      default:
        prixEstime = prixBase;
    }

    prixEstime = arrondirPrix(prixEstime);

    res.json({
      distanceKm,
      prixEstime,
      nbJours,
      typeTrajet,
      carburant
    });
  } catch (error) {
    console.error('POST /public/estimate-location:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/public/actions - Créer une action depuis la landing
router.post('/actions', async (req, res) => {
  try {
    const { organizationSlug, type, clientNom, clientTel, details } = req.body;

    // Normaliser les chaînes Unicode pour éviter les caractères mal encodés
    const normalize = (str) => {
      if (!str) return str;
      return String(str).normalize('NFC').trim();
    };
    const clientNomNormalized = normalize(clientNom);
    const clientTelNormalized = normalize(clientTel);
    
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
      'LONG_HAUL',
      'CONTACT',
    ];
    
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type invalide' });
    }
    
    // ========================================
    // CALCUL DU PRIX (backend uniquement)
    // ========================================
    let prixEstime = 2000;
    let modePrestation = 'courseNormale';
    // Distance calculée par le backend via géocodage
    let distanceKm = 0;
    let commissionPct = 20;
    let nbJours = 1;

    if (type === 'COURSE_REQUEST' || type === 'TAXI_RESERVATION') {
      const VEHICLE_TYPE_MAP = {
        'moto': 'moto',
        'voiture': 'voiture',
        'taxi': 'voiture',
        'bus': 'bus',
        'minivan': 'minivan',
        'tricycle': 'tricycle'
      };
      const cleTarif = VEHICLE_TYPE_MAP[details?.typeVehicule] || 'moto';

      // Calculer la distance entre départ et arrivée (géocodage backend)
      distanceKm = await calculerDistance(details?.depart, details?.arrivee);

      const tarif = await prisma.tarif.findUnique({
        where: { organizationId: org.id }
      }).catch(() => null);

      commissionPct = tarif?.commissionChauffeur ?? 20;

      if (tarif?.vehiculeTarifs) {
        try {
          const vehiculeTarifs = JSON.parse(tarif.vehiculeTarifs);
          const tarifVehicule = vehiculeTarifs[cleTarif];

          if (tarifVehicule) {
            if (['bus', 'minivan', 'tricycle'].includes(cleTarif)) {
              prixEstime = tarifVehicule?.tarifFixe?.prixTrajet || tarif.prixBase;
              modePrestation = 'tarifFixe';
            } else if (tarifVehicule?.courseNormale) {
              const prixBase = tarifVehicule.courseNormale.prixBase || tarif.prixBase;
              const prixKm = tarifVehicule.courseNormale.prixKm || tarif.prixKm;
              prixEstime = arrondirPrix(prixBase + (distanceKm * prixKm));
              modePrestation = 'courseNormale';
            } else {
              prixEstime = arrondirPrix(tarif.prixBase + (distanceKm * tarif.prixKm));
            }
          } else {
            prixEstime = arrondirPrix(tarif.prixBase + (distanceKm * tarif.prixKm));
          }
        } catch(e) {
          prixEstime = arrondirPrix(tarif.prixBase + (distanceKm * tarif.prixKm));
        }
      } else if (tarif) {
        prixEstime = arrondirPrix(tarif.prixBase + (distanceKm * tarif.prixKm));
      }

    } else if (type === 'CAR_RENTAL') {
      // ======================================================
      // LOCATION : calcul 100 % côté backend
      // ======================================================

      const typeVehicule = details?.typeVehicule || 'bus';
      const typeTrajet = details?.typeTrajet || 'A_B';
      const depart = details?.depart || '';
      const arrivee = details?.arrivee || '';
      const dateAller = details?.dateAller || null;
      const dateRetour = details?.dateRetour || null;
      const carburant = details?.carburant || 'AVEC';

      // Calcul du nombre de jours côté backend
      if (
        typeTrajet === 'A_B_A_MULTI' &&
        dateAller &&
        dateRetour
      ) {
        const debut = new Date(dateAller);
        const fin = new Date(dateRetour);

        if (
          !Number.isNaN(debut.getTime()) &&
          !Number.isNaN(fin.getTime())
        ) {
          nbJours = Math.max(
            1,
            Math.ceil(
              (fin.getTime() - debut.getTime()) /
              (1000 * 3600 * 24)
            ) + 1
          );
        }
      }

      // Distance calculée exclusivement par le backend
      distanceKm = await calculerDistance(depart, arrivee);

      // Tarif de l'organisation
      const tarifLocationOrg = await prisma.tarif.findUnique({
        where: { organizationId: org.id }
      }).catch(() => null);

      if (!tarifLocationOrg) {
        return res.status(400).json({
          error: 'Tarif non configuré pour cette organisation'
        });
      }

      commissionPct = tarifLocationOrg.commissionChauffeur ?? 20;

      // Lecture des tarifs par véhicule
      let vehiculeTarifsLocation = {};

      if (tarifLocationOrg.vehiculeTarifs) {
        try {
          vehiculeTarifsLocation = JSON.parse(
            tarifLocationOrg.vehiculeTarifs
          );
        } catch (e) {
          console.error(
            'Erreur parsing vehiculeTarifs location:',
            e
          );
        }
      }

      const typeMapLocation = {
        bus: 'bus',
        minivan: 'minivan',
        tricycle: 'tricycle'
      };

      const cleLocation =
        typeMapLocation[typeVehicule] || 'bus';

      const tarifLocation =
        vehiculeTarifsLocation[cleLocation]?.location || {};

      const prixBaseLocation =
        Number(tarifLocation.prixBase) ||
        Number(tarifLocationOrg.prixBase) ||
        100000;

      const prixKmLocation =
        Number(tarifLocation.prixKm) ||
        Number(tarifLocationOrg.prixKm) ||
        1500;

      const forfaitJournalierLocation =
        Number(tarifLocation.forfaitJournalier) ||
        50000;

      // Calcul du prix selon le trajet
      switch (typeTrajet) {
        case 'A_B':
          if (carburant === 'AVEC') {
            prixEstime = prixBaseLocation;
          } else {
            prixEstime =
              prixBaseLocation +
              (distanceKm * prixKmLocation) +
              (prixBaseLocation * 0.5);
          }
          break;

        case 'A_B_A':
          prixEstime =
            (2 * prixBaseLocation) +
            (2 * distanceKm * prixKmLocation);
          break;

        case 'A_B_A_MULTI':
          prixEstime =
            prixBaseLocation +
            (distanceKm * prixKmLocation) +
            (forfaitJournalierLocation * nbJours) +
            (distanceKm * prixKmLocation) +
            prixBaseLocation;
          break;

        default:
          prixEstime = prixBaseLocation;
      }

      prixEstime = arrondirPrix(prixEstime);
      modePrestation = 'location';

    } else if (type === 'LONG_HAUL') {
      // ======================================================
      // LONG_HAUL : transport long-courrier
      // (passagers, marchandises, déménagement, dépannage)
      // ======================================================

      const typeVehicule = details?.typeVehicule || 'bus';
      const typeService = details?.typeService || 'passagers';
      const depart = details?.depart || '';
      const arrivee = details?.arrivee || '';
      const distanceKmLong = await calculerDistance(depart, arrivee);

      // Tarif de l'organisation
      const tarifLongOrg = await prisma.tarif.findUnique({
        where: { organizationId: org.id }
      }).catch(() => null);

      if (!tarifLongOrg) {
        return res.status(400).json({
          error: 'Tarif non configuré pour cette organisation'
        });
      }

      commissionPct = tarifLongOrg.commissionChauffeur ?? 20;

      // Lecture des tarifs par véhicule
      let vehiculeTarifsLong = {};
      if (tarifLongOrg.vehiculeTarifs) {
        try {
          vehiculeTarifsLong = JSON.parse(tarifLongOrg.vehiculeTarifs);
        } catch (e) {
          console.error('Erreur parsing vehiculeTarifs LONG_HAUL:', e);
        }
      }

      const typeMapLong = {
        'bus': 'bus',
        'minivan': 'minivan',
        'fourgon': 'fourgon',
        'camion': 'camion',
        'semi_remorque': 'semi_remorque',
        'depanneuse': 'depanneuse',
        'camion_frigo': 'camion_frigo'
      };

      const cleLong = typeMapLong[typeVehicule] || 'bus';
      const tarifLong = vehiculeTarifsLong[cleLong]?.longueDistance || {};

      // Fallbacks : tarif générique puis valeurs par défaut
      const prixBaseLong =
        Number(tarifLong.prixBase) ||
        Number(tarifLongOrg.prixBase) ||
        50000;

      const prixKmLong =
        Number(tarifLong.prixKm) ||
        Number(tarifLongOrg.prixKm) ||
        1500;

      const forfaitServiceLong =
        Number(tarifLong.forfaitService) ||
        100000;


      // Calcul selon le type de service
      switch (typeService) {
        case 'passagers':
          // Tarif par passager + distance
          const nbPassagersLong = Number(details?.nbPassagers) || 1;
          prixEstime = arrondirPrix(
            (prixBaseLong * nbPassagersLong) +
            (distanceKmLong * prixKmLong)
          );
          break;

        case 'marchandises':
          // Tarif volume + distance
          const volumeLong = Number(details?.volume) || 1;
          prixEstime = arrondirPrix(
            (prixBaseLong * volumeLong) +
            (distanceKmLong * prixKmLong)
          );
          break;

        case 'demenagement':
          // Forfait + distance
          prixEstime = arrondirPrix(
            forfaitServiceLong +
            (distanceKmLong * prixKmLong)
          );
          break;

        case 'depannage':
          // Forfait + distance
          prixEstime = arrondirPrix(
            forfaitServiceLong +
            (distanceKmLong * prixKmLong * 1.5)
          );
          break;

        case 'fret':
          // Tarif au km uniquement
          prixEstime = arrondirPrix(
            distanceKmLong * prixKmLong * 2
          );
          break;

        default:
          prixEstime = arrondirPrix(
            prixBaseLong + (distanceKmLong * prixKmLong)
          );
      }

      distanceKm = distanceKmLong;
      modePrestation = 'long_haul';

    }

    // ========================================
    // CRÉATION LEAD ACTION (avec données enrichies)
    // ========================================
    const action = await prisma.leadAction.create({
      data: {
        organizationId: org.id,
        type,
        clientNom: clientNomNormalized,
        clientTel: clientTelNormalized,
        details: {
          ...(details || {}),
          distanceKm,
          prixEstime,
          modePrestation,
          commissionPct,
          nbJours: (type === 'CAR_RENTAL' || type === 'LONG_HAUL') ? nbJours : undefined,
          offreClient: details?.offreClient ? Number(details.offreClient) : null,
          codeSuivi: genererCodeSuivi(),
          statutNegociation: details?.offreClient ? 'OFFRE_CLIENT' : 'PRIX_SUGGERE'
        },
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
          leadActionId: action.id,
          type: 'lead_action',
          title: `Nouvelle demande : ${type}`,
          message: `${clientNomNormalized} - ${clientTelNormalized}`,
          read: false,
        },
      }).catch(() => {});
    }

    // Notifier les chauffeurs disponibles pour les demandes LONG_HAUL
    if (type === 'LONG_HAUL') {
      const vehicleTypeMapLong = {
        'bus': 'BUS',
        'minivan': 'MINIVAN',
        'fourgon': 'FOURGON',
        'camion': 'CAMION',
        'semi_remorque': 'SEMI_REMORQUE',
        'depanneuse': 'DEPANNEUSE',
        'camion_frigo': 'CAMION_FRIGO'
      };
      const vehicleTypeLong = vehicleTypeMapLong[details?.typeVehicule] || null;

      const driverWhereLong = {
        organizationId: org.id,
        status: { in: ['AVAILABLE', 'active'] }
      };
      if (vehicleTypeLong) {
        driverWhereLong.vehicle = { type: vehicleTypeLong };
      }

      const driversLong = await prisma.driver.findMany({
        where: driverWhereLong,
        select: { userId: true, driverCode: true }
      });

      const messageLong = [
        `Client: ${clientNomNormalized}`,
        `Départ: ${details?.depart || ''}`,
        `Arrivée: ${details?.arrivee || ''}`,
        `Prix suggéré: ${prixEstime} Ar`,
        `Distance: ${distanceKm} km`,
        `Mode: ${modePrestation}`,
        `Commission: ${commissionPct}%`
      ].filter(Boolean).join(' | ');

      for (const driver of driversLong) {
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            organizationId: org.id,
            leadActionId: action.id,
            type: 'long_haul',
            title: 'Nouvelle demande long-courrier',
            message: messageLong,
            read: false,
          },
        }).catch(() => {});
      }
    }

    // Notifier les chauffeurs disponibles pour les demandes de course
    if (type === 'COURSE_REQUEST' || type === 'TAXI_RESERVATION') {
      // Trouver les chauffeurs disponibles avec le bon type de véhicule
      const vehicleTypeMap = {
        'moto': 'MOTO',
        'voiture': 'VOITURE',
        'taxi': 'VOITURE',
        'bus': 'BUS',
        'minivan': 'MINIVAN',
        'tricycle': 'TRICYCLE'
      };
      const vehicleType = vehicleTypeMap[details?.typeVehicule] || null;

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

      // Message enrichi avec les données structurées
      const offreClient = details?.offreClient ? Number(details.offreClient) : null;

      const messageCourse = [
        `Client: ${clientNomNormalized}`,
        `Départ: ${details?.depart || ''}`,
        `Arrivée: ${details?.arrivee || ''}`,
        `Prix suggéré: ${prixEstime} Ar`,
        offreClient ? `Offre client: ${offreClient} Ar` : null,
        `Distance: ${distanceKm} km`,
        `Mode: ${modePrestation}`,
        `Commission: ${commissionPct}%`
      ].filter(Boolean).join(' | ');

      for (const driver of drivers) {
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            organizationId: org.id,
            leadActionId: action.id,
            type: 'course_request',
            title: 'Nouvelle course disponible',
            message: messageCourse,
            read: false,
          },
        }).catch(() => {});
      }
    }

    res.status(201).json({
      ok: true,
      actionId: action.id,
      codeSuivi: action.details?.codeSuivi || null
    });
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
