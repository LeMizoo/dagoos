const express = require('express');
const prisma = require('../../lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();

// Matrice LONG_HAUL - Source de vérité unique
const {
  LONG_HAUL_MAPPING,
  VALID_LONG_HAUL_SERVICES,
  isVehicleCompatibleWithService
} = require('./long-haul-matrix');

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
        organizationServices: {
          where: { active: true },
          select: { service: true },
        },
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
// GET /api/public/organizations/:slug - Infos publiques de l'organisation
router.get('/organizations/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        error: 'slug requis',
      });
    }

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        email: true,
        phone: true,
        logo: true,
        description: true,
        plan: true,
        status: true,
        mvolaNumber: true,
        orangeNumber: true,
        airtelNumber: true,

        // Branding public de la landing Premium
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

        organizationServices: {
          where: { active: true },
          select: { service: true },
        },

        createdAt: true,
      },
    });

    if (!org || org.status !== 'active') {
      return res.status(404).json({
        error: 'Organisation introuvable',
      });
    }

    return res.json(org);
  } catch (error) {
    console.error('GET /public/organizations/:slug:', error);

    return res.status(500).json({
      error: 'Erreur serveur',
    });
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
      },
      orderBy: [{ date: 'asc' }, { heure: 'asc' }],
      include: {
        vehicle: { select: { id: true, plate: true, model: true } },
        reservations: {
          where: { statut: { in: ['CONFIRMED', 'PENDING'] } },
          select: { place: true },
        },
      },
    });

    // Filtrer les départs dont la date+heure est encore dans le futur
    const now = new Date();
    const departsValides = departs.filter(d => {
      const [h, m] = (d.heure || '00:00').split(':').map(Number);
      const dt = new Date(d.date);
      dt.setHours(h, m, 0, 0);
      return dt.getTime() > now.getTime();
    });
    
    res.json(departsValides);
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
    // Essayer d'abord avec Madagascar uniquement (meilleur pour les villes)
    // Vérifier si l'adresse contient déjà une virgule (adresse complète)
    const aDejaVirgule = adresse.includes(',');

    const query = aDejaVirgule
      ? `${adresse}, Madagascar`
      : `${adresse}, Madagascar`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=mg`;
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
    const {
      organizationSlug,
      depart,
      arrivee,
      typeVehicule
    } = req.body;

    if (!organizationSlug || !depart || !arrivee) {
      return res.status(400).json({
        error: 'Départ et arrivée requis'
      });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true }
    });

    if (!org) {
      return res.status(404).json({
        error: 'Organisation introuvable'
      });
    }

    const distanceKm = await calculerDistance(depart, arrivee);

    /*
     * ========================================================
     * MOTEUR TARIFAIRE V2
     * ========================================================
     *
     * Contrat HTTP conservé :
     * {
     *   organizationSlug,
     *   depart,
     *   arrivee,
     *   typeVehicule
     * }
     *
     * La source tarifaire est désormais :
     *
     * Organization
     *   -> BusinessActivity (URBAN)
     *   -> Service
     *   -> VehicleCategory
     *   -> ServiceTariff
     *
     * Aucun fallback V1.
     */

    const VEHICLE_CONFIG = {
      moto: {
        serviceCode: 'TAXI',
        categoryCode: 'MOTO',
        pricingModel: 'PER_KM',
        modePrestation: 'courseNormale'
      },

      voiture: {
        serviceCode: 'TAXI',
        categoryCode: 'VOITURE',
        pricingModel: 'PER_KM',
        modePrestation: 'courseNormale'
      },

      taxi: {
        serviceCode: 'TAXI',
        categoryCode: 'VOITURE',
        pricingModel: 'PER_KM',
        modePrestation: 'courseNormale'
      },

      bus: {
        serviceCode: 'LOCATION_URBAINE',
        categoryCode: 'BUS',
        pricingModel: 'FIXED',
        modePrestation: 'tarifFixe'
      },

      minivan: {
        serviceCode: 'LOCATION_URBAINE',
        categoryCode: 'MINIVAN',
        pricingModel: 'FIXED',
        modePrestation: 'tarifFixe'
      },

      tricycle: {
        serviceCode: 'LOCATION_URBAINE',
        categoryCode: 'TRICYCLE',
        pricingModel: 'FIXED',
        modePrestation: 'tarifFixe'
      }
    };

    const vehicleConfig = VEHICLE_CONFIG[typeVehicule];

    if (!vehicleConfig) {
      return res.status(400).json({
        error: `Type de véhicule invalide: ${typeVehicule}`
      });
    }

    /*
     * 1. Activité URBAN
     */
    const activity = await prisma.businessActivity.findFirst({
      where: {
        organizationId: org.id,
        type: 'URBAN',
        active: true
      },
      select: {
        id: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        error: 'Activité urbaine non configurée'
      });
    }

    /*
     * 2. Service V2
     */
    const service = await prisma.service.findFirst({
      where: {
        businessActivityId: activity.id,
        code: vehicleConfig.serviceCode,
        active: true
      },
      select: {
        id: true,
        code: true
      }
    });

    if (!service) {
      return res.status(404).json({
        error: `Service ${vehicleConfig.serviceCode} non configuré`
      });
    }

    /*
     * 3. Catégorie véhicule V2
     */
    const category = await prisma.vehicleCategory.findUnique({
      where: {
        code: vehicleConfig.categoryCode
      },
      select: {
        id: true,
        code: true
      }
    });

    if (!category) {
      return res.status(404).json({
        error: `Catégorie véhicule ${vehicleConfig.categoryCode} introuvable`
      });
    }

    /*
     * 4. Tarif V2
     */
    const tariff = await prisma.serviceTariff.findFirst({
      where: {
        serviceId: service.id,
        vehicleCategoryId: category.id,
        pricingModel: vehicleConfig.pricingModel,
        active: true
      },
      select: {
        id: true,
        pricingModel: true,
        basePrice: true,
        unitPrice: true
      }
    });

    if (!tariff) {
      return res.status(404).json({
        error:
          `Tarif V2 non configuré pour ${vehicleConfig.categoryCode} ` +
          `sur ${vehicleConfig.serviceCode}`
      });
    }

    /*
     * 5. Calcul V2
     */
    let prixEstime;

    if (tariff.pricingModel === 'PER_KM') {
      if (
        typeof tariff.basePrice !== 'number' ||
        typeof tariff.unitPrice !== 'number'
      ) {
        return res.status(500).json({
          error: 'Configuration tarifaire V2 invalide'
        });
      }

      prixEstime = arrondirPrix(
        tariff.basePrice +
        (distanceKm * tariff.unitPrice)
      );
    } else if (tariff.pricingModel === 'FIXED') {
      if (typeof tariff.basePrice !== 'number') {
        return res.status(500).json({
          error: 'Configuration tarifaire fixe V2 invalide'
        });
      }

      prixEstime = tariff.basePrice;
    } else {
      return res.status(500).json({
        error:
          `Modèle tarifaire V2 non supporté: ${tariff.pricingModel}`
      });
    }

    /*
     * 6. Contrat HTTP historique conservé
     */
    return res.json({
      distanceKm,
      prixEstime,
      modePrestation: vehicleConfig.modePrestation
    });

  } catch (error) {
    console.error('POST /public/estimate:', error);

    return res.status(500).json({
      error: error.message
    });
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

    // V2 : exposer les nouveaux champs tarifaires
    const details = action.details || {};
    const pricingModel = details.pricingModel || null;
    const status = details.status || (details.prixEstime ? 'ESTIMATED' : null);
    const price = details.price !== undefined 
      ? details.price 
      : (details.prixEstime || null);

    res.json({
      codeSuivi: code,
      statut: action.statut,
      clientNom: action.clientNom,
      type: action.type,
      typeService: details.typeService || null,
      typeVehicule: details.typeVehicule || null,
      depart: details.depart || '',
      arrivee: details.arrivee || '',
      // V2 champs
      pricingModel,
      status,
      price,
      estimated: details.estimated !== undefined 
        ? details.estimated 
        : (details.prixEstime ? true : false),
      negotiation: details.negotiation || null,
      // Legacy (compatibilité)
      prixEstime: details.prixEstime || null,
      offreClient: details.offreClient || null,
      contreOffreChauffeur: details.contreOffreChauffeur || null,
      statutNegociation: details.statutNegociation || null,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt
    });
  } catch (error) {
    console.error('GET /public/suivi/:code:', error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================================
// RÉPONSE CLIENT — NÉGOCIATION LONG_HAUL
// POST /api/public/actions/respond
//
// Authentification publique :
//   codeSuivi + clientTel
//
// Le client ne fournit JAMAIS le prix.
// Le prix de référence est negotiation.proposedPrice.
// =========================================================

router.post('/actions/respond', async (req, res) => {
  try {
    const { codeSuivi, clientTel, decision } = req.body || {};

    // -------------------------------------------------------
    // 1. Validation du body
    // -------------------------------------------------------

    if (
      typeof codeSuivi !== 'string' ||
      !codeSuivi.trim() ||
      typeof clientTel !== 'string' ||
      !clientTel.trim() ||
      typeof decision !== 'string'
    ) {
      return res.status(400).json({
        error: 'codeSuivi, clientTel et decision sont obligatoires'
      });
    }

    const normalizedCodeSuivi = codeSuivi.trim();
    const normalizedClientTel = clientTel.trim();
    const normalizedDecision = decision.trim().toUpperCase();

    if (!['ACCEPTEE', 'REFUSEE'].includes(normalizedDecision)) {
      return res.status(400).json({
        error: 'decision doit être ACCEPTEE ou REFUSEE'
      });
    }

    // -------------------------------------------------------
    // 2. Retrouver la LeadAction par codeSuivi
    // -------------------------------------------------------

    const candidates = await prisma.leadAction.findMany({
      where: {
        type: 'LONG_HAUL'
      },
      select: {
        id: true,
        organizationId: true,
        type: true,
        clientNom: true,
        clientTel: true,
        details: true,
        statut: true,
        updatedAt: true
      }
    });

    const action = candidates.find((item) => {
      return item.details?.codeSuivi === normalizedCodeSuivi;
    });

    if (!action) {
      return res.status(404).json({
        error: 'Demande introuvable'
      });
    }

    // -------------------------------------------------------
    // 3. Second facteur : clientTel exact
    // -------------------------------------------------------

    if (action.clientTel !== normalizedClientTel) {
      return res.status(403).json({
        error: 'Accès refusé'
      });
    }

    // -------------------------------------------------------
    // 4. Vérifier LONG_HAUL + NEGOTIATED
    // -------------------------------------------------------

    const details = action.details || {};
    const pricingModel = details.pricingModel;

    if (action.type !== 'LONG_HAUL') {
      return res.status(400).json({
        error: 'Cette demande ne concerne pas une prestation long-courrier'
      });
    }

    if (pricingModel !== 'NEGOTIATED') {
      return res.status(400).json({
        error: 'Cette demande ne nécessite pas de négociation'
      });
    }

    // -------------------------------------------------------
    // 5. Vérifier l'état de négociation
    // -------------------------------------------------------

    const negotiation = details.negotiation;

    if (
      !negotiation ||
      negotiation.status !== 'PROPOSITION_EN_ATTENTE_CLIENT'
    ) {
      return res.status(409).json({
        error: 'Cette proposition n’est plus en attente de réponse'
      });
    }

    // -------------------------------------------------------
    // 6. Vérifier les données enregistrées par /propose
    // -------------------------------------------------------

    const proposerDriverId = negotiation.driverId;
    const proposerVehicleId = negotiation.vehicleId;
    const proposedPrice = Number(negotiation.proposedPrice);

    if (
      typeof proposerDriverId !== 'string' ||
      !proposerDriverId ||
      typeof proposerVehicleId !== 'string' ||
      !proposerVehicleId ||
      !Number.isFinite(proposedPrice) ||
      proposedPrice <= 0
    ) {
      return res.status(409).json({
        error: 'Proposition de négociation invalide ou incomplète'
      });
    }

    // -------------------------------------------------------
    // 7. Revalidation chauffeur -> organisation -> véhicule
    // -------------------------------------------------------

    const driver = await prisma.driver.findUnique({
      where: { id: proposerDriverId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        vehicleId: true,
        accountStatus: true,
        vehicle: {
          select: {
            id: true,
            organizationId: true,
            type: true,
            vehicleCategory: {
              select: {
                code: true
              }
            }
          }
        }
      }
    });

    if (!driver) {
      return res.status(403).json({
        error: 'Le chauffeur ayant proposé le prix est introuvable'
      });
    }

    // Le chauffeur doit toujours être rattaché à la même organisation.
    if (
      action.organizationId &&
      action.organizationId !== driver.organizationId
    ) {
      return res.status(403).json({
        error: 'Organisation du chauffeur invalide'
      });
    }

    // Le compte chauffeur doit toujours être actif.
    if (
      driver.accountStatus &&
      String(driver.accountStatus).toLowerCase() !== 'active'
    ) {
      return res.status(403).json({
        error: 'Le chauffeur n’est plus actif'
      });
    }

    // Le véhicule utilisé pour la proposition doit toujours être
    // le véhicule actuellement affecté au chauffeur.
    if (driver.vehicleId !== proposerVehicleId) {
      return res.status(409).json({
        error: 'Le véhicule utilisé pour la proposition a changé'
      });
    }

    const vehicle = driver.vehicle;

    if (!vehicle || vehicle.id !== proposerVehicleId) {
      return res.status(403).json({
        error: 'Véhicule du chauffeur introuvable'
      });
    }

    if (
      vehicle.organizationId &&
      vehicle.organizationId !== driver.organizationId
    ) {
      return res.status(403).json({
        error: 'Le véhicule n’appartient plus à l’organisation du chauffeur'
      });
    }

    // -------------------------------------------------------
    // 8. Revalidation compatibilité LONG_HAUL V2
    // -------------------------------------------------------

    const typeService = details.typeService;
    const typeVehicule = details.typeVehicule;

    if (!VALID_LONG_HAUL_SERVICES.includes(typeService)) {
      return res.status(400).json({
        error: 'Type de service LONG_HAUL invalide'
      });
    }

    if (!isVehicleCompatibleWithService(typeService, typeVehicule)) {
      return res.status(400).json({
        error: 'Véhicule incompatible avec le service demandé'
      });
    }

    const vehicleType = vehicle.type
      ? String(vehicle.type).toLowerCase()
      : null;

    if (vehicleType !== typeVehicule) {
      return res.status(400).json({
        error: 'Le type du véhicule ne correspond plus à la demande'
      });
    }

    const vehicleCategoryCode = typeVehicule
      ? String(typeVehicule).toUpperCase().replace(/-/g, '_')
      : null;

    const serviceCode = {
      passagers: 'LOCATION_INTERURBAINE',
      marchandises: 'MARCHANDISES',
      demenagement: 'MARCHANDISES',
      depannage: 'DEPANNAGE',
      fret: 'FRET'
    }[typeService];

    if (!serviceCode) {
      return res.status(400).json({
        error: 'Service LONG_HAUL non reconnu'
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
      select: {
        id: true
      }
    }).catch(() => null);

    if (!compatibleOrg) {
      return res.status(403).json({
        error: 'Organisation non compatible avec cette prestation'
      });
    }

    // -------------------------------------------------------
    // 9. Calcul serveur des montants
    // -------------------------------------------------------

    const commissionPct = Number(details.commissionPct ?? 20);

    if (
      !Number.isFinite(commissionPct) ||
      commissionPct < 0 ||
      commissionPct > 100
    ) {
      return res.status(409).json({
        error: 'Commission de la demande invalide'
      });
    }

    const partChauffeur = Math.round(
      proposedPrice * commissionPct / 100
    );

    const partOrganisation = proposedPrice - partChauffeur;

    const distanceKm = Number(details.distanceKm || 0);
    const modePrestation = details.modePrestation || 'NORMALE';

    // -------------------------------------------------------
    // 10. Transaction atomique
    // -------------------------------------------------------

    let courseCree = null;

    try {
      await prisma.$transaction(async (tx) => {
        const freshAction = await tx.leadAction.findUnique({
          where: { id: action.id }
        });

        if (!freshAction) {
          throw new Error('Demande introuvable');
        }

        const freshDetails = freshAction.details || {};
        const freshNegotiation = freshDetails.negotiation;

        // Revalidation dans la transaction pour empêcher
        // une double réponse acceptation/refus.
        if (
          freshAction.statut !== 'NEW' ||
          !freshNegotiation ||
          freshNegotiation.status !== 'PROPOSITION_EN_ATTENTE_CLIENT'
        ) {
          throw new Error('NEGOTIATION_ALREADY_PROCESSED');
        }

        if (
          freshNegotiation.driverId !== proposerDriverId ||
          freshNegotiation.vehicleId !== proposerVehicleId ||
          Number(freshNegotiation.proposedPrice) !== proposedPrice
        ) {
          throw new Error('NEGOTIATION_CHANGED');
        }

        const now = new Date().toISOString();

        const nextNegotiation = {
          ...freshNegotiation,
          status:
            normalizedDecision === 'ACCEPTEE'
              ? 'ACCEPTEE'
              : 'REFUSEE',
          respondedAt: now,
          respondedBy: 'CLIENT',
          responseChannel: 'PUBLIC_CODE'
        };

        const nextDetails = {
          ...freshDetails,
          negotiation: nextNegotiation
        };

        // ---------------------------------------------------
        // REFUS
        // ---------------------------------------------------

        if (normalizedDecision === 'REFUSEE') {
          const updated = await tx.leadAction.updateMany({
            where: {
              id: action.id,
              statut: 'NEW',
              updatedAt: freshAction.updatedAt
            },
            data: {
              statut: 'REJECTED',
              details: nextDetails
            }
          });

          if (updated.count !== 1) {
            throw new Error('NEGOTIATION_CONCURRENT_UPDATE');
          }

          return;
        }

        // ---------------------------------------------------
        // ACCEPTATION
        // ---------------------------------------------------

        const updated = await tx.leadAction.updateMany({
          where: {
            id: action.id,
            statut: 'NEW',
            updatedAt: freshAction.updatedAt
          },
          data: {
            statut: 'ACCEPTED',
            organizationId: driver.organizationId,
            details: nextDetails
          }
        });

        if (updated.count !== 1) {
          throw new Error('NEGOTIATION_CONCURRENT_UPDATE');
        }

        // Le prix vient exclusivement de negotiation.proposedPrice.
        courseCree = await tx.course.create({
          data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            leadActionId: action.id,
            type: modePrestation,
            statut: 'EN_ATTENTE',
            clientNom: freshAction.clientNom,
            clientTel: freshAction.clientTel,
            adresseDepart: freshDetails.depart || null,
            adresseArrivee: freshDetails.arrivee || null,
            distanceEstimeeKm: distanceKm,
            distanceKm,
            price: proposedPrice,
            commissionPct,
            montantChauffeur: partChauffeur,
            montantOrganisation: partOrganisation,
            commission: partOrganisation,
            acceptedAt: new Date()
          }
        });
      });
    } catch (txError) {
      if (txError.message === 'NEGOTIATION_ALREADY_PROCESSED') {
        return res.status(409).json({
          error: 'Cette négociation a déjà reçu une réponse'
        });
      }

      if (txError.message === 'NEGOTIATION_CHANGED') {
        return res.status(409).json({
          error: 'La proposition a changé, veuillez actualiser le suivi'
        });
      }

      if (txError.message === 'NEGOTIATION_CONCURRENT_UPDATE') {
        return res.status(409).json({
          error: 'Réponse concurrente détectée, veuillez actualiser le suivi'
        });
      }

      throw txError;
    }

    // -------------------------------------------------------
    // 11. Notification du chauffeur
    // -------------------------------------------------------

    const notificationMessage =
      normalizedDecision === 'ACCEPTEE'
        ? `${action.clientNom} a accepté votre proposition de ${proposedPrice} MGA.`
        : `${action.clientNom} a refusé votre proposition de ${proposedPrice} MGA.`;

    await prisma.notification.create({
      data: {
        userId: driver.userId,
        organizationId: driver.organizationId,
        leadActionId: action.id,
        type: 'negotiation_response',
        title:
          normalizedDecision === 'ACCEPTEE'
            ? 'Proposition acceptée par le client'
            : 'Proposition refusée par le client',
        message: notificationMessage,
        read: false
      }
    }).catch(() => {});

    // -------------------------------------------------------
    // 12. Fermer les notifications liées à la demande
    // -------------------------------------------------------

    await prisma.notification.updateMany({
      where: {
        leadActionId: action.id,
        read: false
      },
      data: {
        read: true
      }
    }).catch(() => {});

    // -------------------------------------------------------
    // 13. Réponse API
    // -------------------------------------------------------

    if (normalizedDecision === 'ACCEPTEE') {
      return res.status(200).json({
        ok: true,
        status: 'ACCEPTEE',
        courseId: courseCree?.id || null
      });
    }

    return res.status(200).json({
      ok: true,
      status: 'REFUSEE'
    });
  } catch (error) {
    console.error('POST /public/actions/respond:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});


router.post('/estimate-location', async (req, res) => {
  try {
    const {
      organizationSlug,
      type,
      typeVehicule,
      typeTrajet,
      typeService,
      nbPassagers,
      volume,
      depart,
      arrivee,
      dateAller,
      dateRetour,
      carburant
    } = req.body;

    if (!organizationSlug || !depart || !arrivee) {
      return res.status(400).json({ error: 'Informations manquantes' });
    }

    if (type !== 'LONG_HAUL' && !typeTrajet) {
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
      where: { organizationId: org?.id }
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

    // ========================================
    // ESTIMATION LONG_HAUL - MOTEUR V2
    // ========================================
    if (type === 'LONG_HAUL') {
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

      const mapping = LONG_HAUL_MAPPING[typeService];
      if (!mapping) {
        return res.status(400).json({
          error: `Mapping V2 non trouvé pour ${typeService}`
        });
      }

      // Convertir typeVehicule V1 → VehicleCategory code V2
      const vehicleCategoryCode = typeVehicule.toUpperCase().replace(/-/g, '_');
      if (!mapping.vehicleCategories.includes(vehicleCategoryCode)) {
        return res.status(400).json({
          error: `Véhicule ${typeVehicule} non supporté en V2 pour ${typeService}`
        });
      }

      // Trouver l'activité INTERURBAN de l'organisation
      const activity = await prisma.businessActivity.findFirst({
        where: {
          organizationId: org.id,
          type: 'INTERURBAN',
          active: true
        },
        select: { id: true }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Activité interurbaine non configurée'
        });
      }

      // Trouver le service V2
      const service = await prisma.service.findFirst({
        where: {
          businessActivityId: activity.id,
          code: mapping.serviceCode,
          active: true
        },
        select: { id: true, code: true }
      });

      if (!service) {
        return res.status(404).json({
          error: `Service ${mapping.serviceCode} non configuré`
        });
      }

      // Trouver la catégorie de véhicule
      const category = await prisma.vehicleCategory.findUnique({
        where: { code: vehicleCategoryCode },
        select: { id: true, code: true }
      });

      if (!category) {
        return res.status(404).json({
          error: `Catégorie véhicule ${vehicleCategoryCode} introuvable`
        });
      }

      // Trouver le tarif V2
      const tariff = await prisma.serviceTariff.findFirst({
        where: {
          serviceId: service.id,
          vehicleCategoryId: category.id,
          active: true
        },
        select: {
          id: true,
          pricingModel: true,
          basePrice: true,
          unitPrice: true,
          configuration: true
        }
      });

      if (!tariff) {
        return res.status(404).json({
          error: `Tarif V2 non configuré pour ${mapping.serviceCode}/${vehicleCategoryCode}`
        });
      }

      // Calculer avec le moteur V2
      const pricingEngine = require('../../services/pricingEngine');
      const pricingResult = pricingEngine.calculatePrice(
        tariff,
        distanceKm,
        {
          nbPassagers: typeService === 'passagers' ? (Number(nbPassagers) || 1) : undefined,
          tonnage: typeService === 'marchandises' ? (Number(volume) || 1) : undefined
        }
      );

      // Réponse V2
      return res.json({
        distanceKm,
        ...pricingResult,
        type: 'LONG_HAUL',
        typeVehicule,
        typeService,
        nbPassagers: typeService === 'passagers'
          ? (Number(nbPassagers) || 1)
          : undefined,
        volume: typeService === 'marchandises'
          ? (Number(volume) || 1)
          : undefined
      });
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
    
    if (!type || !clientNom || !clientTel) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    let org = null;

    if (organizationSlug) {
      org = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, email: true },
      });

      if (!org) {
        return res.status(404).json({ error: 'Organisation introuvable' });
      }
    } else if (!['CONTACT', 'LONG_HAUL', 'CAR_RENTAL', 'COURSE_REQUEST', 'TAXI_RESERVATION'].includes(type)) {
      return res.status(400).json({ error: 'organisationSlug requis pour ce type' });
    }
    
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
    // MATCHING AUTOMATIQUE LONG_HAUL (sans organisation)
    // V2 : basé sur ServiceTariff + VehicleAssignment
    // ========================================
    let organizationsToNotify = [];

    if (type === 'LONG_HAUL' && !org) {
      const typeService = details?.typeService || 'passagers';
      const typeVehicule = details?.typeVehicule || 'bus';

      const mapping = LONG_HAUL_MAPPING[typeService];
      
      if (mapping) {
        const vehicleCategoryCode = typeVehicule.toUpperCase().replace(/-/g, '_');
        
        if (mapping.vehicleCategories.includes(vehicleCategoryCode)) {
          // Trouver les organisations COOPERATIVE actives avec le bon service V2
          const orgsCompatibles = await prisma.organization.findMany({
            where: {
              type: 'COOPERATIVE',
              status: 'active',
              businessActivities: {
                some: {
                  type: 'INTERURBAN',
                  active: true,
                  services: {
                    some: {
                      code: mapping.serviceCode,
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
                }
              }
            },
            select: {
              id: true,
              name: true,
              slug: true,
              email: true
            }
          }).catch((error) => {
            console.error(
              '[LONG_HAUL MATCHING] Erreur Prisma:',
              error?.message || error
            );
            return [];
          });

          console.log('[LONG_HAUL MATCHING] Résultat:', {
            typeService,
            typeVehicule,
            vehicleCategoryCode,
            serviceCode: mapping.serviceCode,
            organizations: orgsCompatibles.map(o => ({
              id: o.id,
              name: o.name,
              slug: o.slug
            }))
          });

          organizationsToNotify = orgsCompatibles;
          // NE PAS affecter org ici - attendre l'acceptation d'un chauffeur
          // org sera défini lors de l'acceptation par le premier chauffeur
        }
      }
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
        where: { organizationId: org?.id }
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
        where: { organizationId: org?.id }
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
      // LONG_HAUL : moteur V2 (ServiceTariff + pricingEngine)
      // ======================================================

      const typeVehicule = details?.typeVehicule || 'bus';
      const typeService = details?.typeService || 'passagers';
      const depart = details?.depart || '';
      const arrivee = details?.arrivee || '';
      const distanceKmLong = await calculerDistance(depart, arrivee);

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

      const mapping = LONG_HAUL_MAPPING[typeService];
      if (!mapping) {
        return res.status(400).json({
          error: `Mapping V2 non trouvé pour ${typeService}`
        });
      }

      // Convertir typeVehicule V1 → VehicleCategory code V2
      const vehicleCategoryCode = typeVehicule.toUpperCase().replace(/-/g, '_');
      if (!mapping.vehicleCategories.includes(vehicleCategoryCode)) {
        return res.status(400).json({
          error: `Véhicule ${typeVehicule} non supporté en V2 pour ${typeService}`
        });
      }

      // ======================================================
      // TARIF V2 POUR UNE DEMANDE PUBLIQUE
      // ======================================================
      // IMPORTANT :
      // - org reste NULL pour préserver le broadcast public
      // - on utilise une organisation compatible uniquement comme
      //   référence tarifaire pour l'estimation
      // - l'organisation définitive sera celle du premier chauffeur
      //   qui accepte la demande
      // ======================================================

      const pricingOrganization =
        org || organizationsToNotify[0] || null;

      if (!pricingOrganization) {
        return res.status(404).json({
          error: `Aucune organisation compatible pour ${typeService}/${vehicleCategoryCode}`
        });
      }

      // Trouver l'activité INTERURBAN de l'organisation tarifaire
      const activity = await prisma.businessActivity.findFirst({
        where: {
          organizationId: pricingOrganization.id,
          type: 'INTERURBAN',
          active: true
        },
        select: { id: true }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Activité interurbaine non configurée'
        });
      }

      // Trouver le service V2
      const service = await prisma.service.findFirst({
        where: {
          businessActivityId: activity.id,
          code: mapping.serviceCode,
          active: true
        },
        select: { id: true, code: true }
      });

      if (!service) {
        return res.status(404).json({
          error: `Service ${mapping.serviceCode} non configuré`
        });
      }

      // Trouver la catégorie
      const category = await prisma.vehicleCategory.findUnique({
        where: { code: vehicleCategoryCode },
        select: { id: true, code: true }
      });

      if (!category) {
        return res.status(404).json({
          error: `Catégorie véhicule ${vehicleCategoryCode} introuvable`
        });
      }

      // Trouver le tarif V2 de référence
      const tariff = await prisma.serviceTariff.findFirst({
        where: {
          serviceId: service.id,
          vehicleCategoryId: category.id,
          active: true
        },
        select: {
          id: true,
          pricingModel: true,
          basePrice: true,
          unitPrice: true,
          configuration: true,
          commissionPct: true
        }
      });

      if (!tariff) {
        return res.status(404).json({
          error: `Tarif V2 non configuré pour ${mapping.serviceCode}/${vehicleCategoryCode}`
        });
      }

      // Calculer avec le moteur V2
      const pricingEngine = require('../../services/pricingEngine');
      const pricingResult = pricingEngine.calculatePrice(
        tariff,
        distanceKmLong,
        {
          nbPassagers: typeService === 'passagers' ? (Number(details?.nbPassagers) || 1) : undefined,
          tonnage: typeService === 'marchandises' ? (Number(details?.volume) || 1) : undefined
        }
      );

      // Mettre à jour les variables pour la création LeadAction
      distanceKm = distanceKmLong;
      prixEstime = pricingResult.price || 0;
      modePrestation = pricingResult.pricingModel === 'NEGOTIATED' ? 'negociation' : 'long_haul';
      commissionPct = tariff.commissionPct || 20;

      // Stocker le résultat V2 dans details
      details.pricingModel = pricingResult.pricingModel;
      details.estimated = pricingResult.estimated;
      details.price = pricingResult.price;
      details.status = pricingResult.status;
      details.negotiation = pricingResult.negotiation || null;

    }

    // ========================================
    // CRÉATION LEAD ACTION (avec données enrichies)
    // ========================================
    const action = await prisma.leadAction.create({
      data: {
        organizationId: org?.id,
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
    
    // Créer une notification pour les managers uniquement
    // lorsqu'une organisation est déjà explicitement rattachée.
    // LONG_HAUL public reste sans organisation jusqu'à la première acceptation.
    if (org?.id) {
      // Créer une notification pour tous les managers de l'organisation
      // Trouver les managers par l'email de l'organisation
      const orgData = await prisma.organization.findUnique({
        where: { id: org?.id },
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
            organizationId: org?.id,
            leadActionId: action.id,
            type: 'lead_action',
            title: `Nouvelle demande : ${type}`,
            message: `${clientNomNormalized} - ${clientTelNormalized}`,
            read: false,
          },
        }).catch(() => {});
      }
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
        status: { in: ['AVAILABLE', 'active'] }
      };

      // Si des organisations compatibles ont été trouvées (matching auto)
      // ou si une organisation est spécifiée, filtrer par organizationId
      if (organizationsToNotify && organizationsToNotify.length > 0) {
        driverWhereLong.organizationId = { in: organizationsToNotify.map(o => o.id) };
      } else if (org) {
        driverWhereLong.organizationId = org.id;
      }
      if (vehicleTypeLong) {
        driverWhereLong.vehicle = { type: vehicleTypeLong };
      }

      const driversLong = await prisma.driver.findMany({
        where: driverWhereLong,
        select: { userId: true, driverCode: true, organizationId: true }
      });

      const messageLong = [
        `Client: ${clientNomNormalized}`,
        `Départ: ${details?.depart || ''}`,
        `Arrivée: ${details?.arrivee || ''}`,
        details?.pricingModel === 'NEGOTIATED' 
          ? `Tarification: à négocier`
          : `Prix suggéré: ${prixEstime} Ar`,
        `Distance: ${distanceKm} km`,
        `Mode: ${modePrestation}`,
        `Commission: ${commissionPct}%`
      ].filter(Boolean).join(' | ');

      for (const driver of driversLong) {
        // Utiliser l'organisation du chauffeur, pas org?.id (qui peut être null pour public)
        const driverOrgId = driver.organizationId || org?.id;
        
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            organizationId: driverOrgId,
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
        organizationId: org?.id,
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
            organizationId: org?.id,
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
          where: { statut: { in: ['CONFIRMED', 'PENDING'] } },
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
          where: { statut: { in: ['CONFIRMED', 'PENDING'] } },
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
      message: `Réservation en attente. Code OTP : ${otpCode}`,
      reservations,
    });
  } catch (error) {
    // Gérer la violation de contrainte unique (place déjà réservée)
    if (error.code === 'P2002') {
      console.warn('Tentative de double réservation détectée');
      return res.status(409).json({
        error: 'Places déjà réservées',
        message: 'Une ou plusieurs places viennent d\'être réservées par un autre passager'
      });
    }
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
