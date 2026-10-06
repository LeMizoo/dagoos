// ============================================================
// DAGOO'S API — Timeline LeadActionEvent
// Phase 2.4.2 — 3.b.10.b
//
// IMPORTANT :
// - Migration LeadActionEvent requise avant exécution réelle.
// - Exécution activée uniquement avec RUN_TIMELINE_TESTS=true.
// - DB de test : test_2_0_d (SET search_path).
// - Auth : vrai JWT + vrai authMiddleware.
//
// Ce fichier a été réécrit après audit cohérence (3.b.10.b) :
// - resetDatabase avec search_path
// - createOrganization avec code + type
// - createVehicle avec type configurable
// - fixtures V2 (BusinessActivity / Service / VehicleCategory / ServiceTariff)
// - dimensionKey conforme à buildDimensionKey
// - payloads corrigés pour /propose, /reject, /respond
// ============================================================

require('dotenv/config');

const fs = require('fs');
const path = require('path');
const request = require('supertest');

jest.setTimeout(30000);
const { PrismaClient } = require('@prisma/client');

const { generateToken, JWT_SECRET } = require('./helpers/auth');

const RUN_TIMELINE_TESTS = process.env.RUN_TIMELINE_TESTS === 'true';

function loadTestDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  const envText = fs.readFileSync(envPath, 'utf8');

  const line = envText
    .split(/\r?\n/)
    .find((entry) => entry.startsWith('DATABASE_URL='));

  if (!line) {
    throw new Error('DATABASE_URL introuvable dans apps/api/.env');
  }

  const raw = line.slice('DATABASE_URL='.length).trim();
  const url = raw.replace(/^["']|["']$/g, '');

  if (url.includes('schema=')) {
    return url.replace(/schema=[^&]+/, 'schema=test_2_0_d');
  }

  return `${url}${url.includes('?') ? '&' : '?'}schema=test_2_0_d`;
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = loadTestDatabaseUrl();

const app = require('../app');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// ------------------------------------------------------------
// Helpers — reset DB
// ------------------------------------------------------------

async function resetDatabase() {
  // Utilise search_path pour cibler le schéma de test sans
  // préfixer chaque nom de table.
  await prisma.$executeRawUnsafe(`SET search_path = test_2_0_d`);
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "LeadActionEvent",
      "Notification",
      "Course",
      "LeadAction",
      "Driver",
      "Vehicle",
      "ServiceTariff",
      "Service",
      "BusinessActivity",
      "VehicleCategory",
      "User",
      "Organization"
    CASCADE
  `);
}

// ------------------------------------------------------------
// Helpers — fixtures
// ------------------------------------------------------------

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createOrganization(overrides = {}) {
  const suffix = uniqueSuffix();
  return prisma.organization.create({
    data: {
      name: overrides.name || `Timeline Test Org ${suffix}`,
      code: overrides.code || `TL-${suffix}`,
      slug: overrides.slug || `timeline-test-${suffix}`,
      type: overrides.type || 'FLEET_MANAGER',
      email: overrides.email || `timeline-${suffix}@test.local`,
      status: overrides.status || 'active',
      ...overrides,
    },
  });
}

async function createUser(organizationId, overrides = {}) {
  return prisma.user.create({
    data: {
      name: overrides.name || 'Timeline Driver',
      email: overrides.email || `driver-${uniqueSuffix()}@test.local`,
      password: overrides.password || 'test-password',
      role: overrides.role || 'DRIVER',
      organizationId,
      ...overrides,
    },
  });
}

async function createVehicle(organizationId, overrides = {}) {
  return prisma.vehicle.create({
    data: {
      plate: overrides.plate || `TL-${uniqueSuffix()}`,
      organizationId,
      type: overrides.type || 'VOITURE',
      status: overrides.status || 'active',
      ...overrides,
    },
  });
}

async function createDriver({
  organizationId,
  userId,
  vehicleId = null,
  overrides = {},
}) {
  return prisma.driver.create({
    data: {
      userId,
      organizationId,
      driverCode: overrides.driverCode || `DRV-${uniqueSuffix()}`,
      pin: overrides.pin || '1234',
      vehicleId,
      status: overrides.status || 'ONLINE',
      accountStatus: overrides.accountStatus || 'active',
      ...overrides,
    },
  });
}

async function createLeadAction({
  organizationId = null,
  type = 'LONG_HAUL',
  statut = 'NEW',
  details = {},
  clientNom = 'Client Timeline',
  clientTel = '0340000000',
} = {}) {
  return prisma.leadAction.create({
    data: {
      organizationId,
      type,
      statut,
      details,
      clientNom,
      clientTel,
    },
  });
}

// ------------------------------------------------------------
// Helpers — buildDimensionKey (copie locale de la logique
// de service-tariffs.routes.js)
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Helpers — fixtures V2 (BusinessActivity / Service /
// VehicleCategory / ServiceTariff)
// ------------------------------------------------------------

async function createV2Fixtures(organization) {
  // Activités
  const activityUrban = await prisma.businessActivity.create({
    data: {
      organizationId: organization.id,
      type: 'URBAN',
      zone: 'URBAN',
      active: true,
    },
  });

  const activityInterurban = await prisma.businessActivity.create({
    data: {
      organizationId: organization.id,
      type: 'INTERURBAN',
      zone: 'NATIONAL',
      active: true,
    },
  });

  // Services
  const serviceTaxi = await prisma.service.create({
    data: {
      businessActivityId: activityUrban.id,
      code: 'TAXI',
      label: 'Taxi urbain',
      active: true,
    },
  });

  const serviceLocationInterurbaine = await prisma.service.create({
    data: {
      businessActivityId: activityInterurban.id,
      code: 'LOCATION_INTERURBAINE',
      label: 'Location interurbaine',
      active: true,
    },
  });

  const serviceMarchandises = await prisma.service.create({
    data: {
      businessActivityId: activityInterurban.id,
      code: 'MARCHANDISES',
      label: 'Marchandises',
      active: true,
    },
  });

  // Catégories de véhicule
  const categoryMoto = await prisma.vehicleCategory.create({
    data: {
      code: 'MOTO',
      label: 'Moto',
      vehicleType: 'MOTO',
    },
  });

  const categoryMinivan = await prisma.vehicleCategory.create({
    data: {
      code: 'MINIVAN',
      label: 'Minivan',
      vehicleType: 'MINIVAN',
    },
  });

  const categoryCamion = await prisma.vehicleCategory.create({
    data: {
      code: 'CAMION',
      label: 'Camion',
      vehicleType: 'CAMION',
    },
  });

  // Tarifs
  // - TAXI / MOTO / PER_KM / modePrestation=normal
  await prisma.serviceTariff.create({
    data: {
      serviceId: serviceTaxi.id,
      vehicleCategoryId: categoryMoto.id,
      pricingModel: 'PER_KM',
      modePrestation: 'normal',
      zone: null,
      mode: null,
      categorie: null,
      dimensionKey: buildDimensionKey({ modePrestation: 'normal' }),
      excludeFromUnique: false,
      basePrice: 2000,
      unitPrice: 1000,
      minimumPrice: 2000,
      commissionPct: 20,
      currency: 'MGA',
      active: true,
    },
  });

  // - LOCATION_INTERURBAINE / MINIVAN / PER_KM / aucune dimension
  await prisma.serviceTariff.create({
    data: {
      serviceId: serviceLocationInterurbaine.id,
      vehicleCategoryId: categoryMinivan.id,
      pricingModel: 'PER_KM',
      modePrestation: null,
      zone: null,
      mode: null,
      categorie: null,
      dimensionKey: buildDimensionKey({}),
      excludeFromUnique: false,
      basePrice: 10000,
      unitPrice: 1000,
      minimumPrice: 10000,
      commissionPct: 20,
      currency: 'MGA',
      active: true,
    },
  });

  // - MARCHANDISES / CAMION / NEGOTIATED / aucune dimension
  await prisma.serviceTariff.create({
    data: {
      serviceId: serviceMarchandises.id,
      vehicleCategoryId: categoryCamion.id,
      pricingModel: 'NEGOTIATED',
      modePrestation: null,
      zone: null,
      mode: null,
      categorie: null,
      dimensionKey: buildDimensionKey({}),
      excludeFromUnique: false,
      basePrice: null,
      unitPrice: null,
      minimumPrice: null,
      commissionPct: 20,
      currency: 'MGA',
      active: true,
    },
  });

  return {
    activityUrban,
    activityInterurban,
    serviceTaxi,
    serviceLocationInterurbaine,
    serviceMarchandises,
    categoryMoto,
    categoryMinivan,
    categoryCamion,
  };
}

// ------------------------------------------------------------
// Helpers — JWT + lecture
// ------------------------------------------------------------

function driverToken({ userId, driverId, organizationId }) {
  return generateToken({
    id: userId,
    email: 'timeline-driver@test.local',
    role: 'DRIVER',
    organizationId,
    driverId,
  });
}

async function readEvents(leadActionId) {
  return prisma.leadActionEvent.findMany({
    where: { leadActionId },
    orderBy: [
      { occurredAt: 'asc' },
      { id: 'asc' },
    ],
  });
}

function eventTypes(events) {
  return events.map((event) => event.type);
}

function assertTimelineReady() {
  if (!RUN_TIMELINE_TESTS) {
    return false;
  }

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET absent.');
  }

  return true;
}

const describeTimeline = RUN_TIMELINE_TESTS ? describe : describe.skip;

describeTimeline('Timeline LeadActionEvent — Phase 2.4.2', () => {
  let organization;
  let user;
  let vehicle;
  let driver;
  let token;
  let fixtures;

  beforeAll(async () => {
    assertTimelineReady();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDatabase();

    organization = await createOrganization();

    fixtures = await createV2Fixtures(organization);

    user = await createUser(organization.id);

    // Le Vehicle du driver doit correspondre aux typeVehicule utilisés
    // dans Zone 2 (marchandises/camion) et Zone 5 (marchandises/camion).
    // Zone 1 (COURSE_REQUEST/moto) n'utilise pas le Vehicle du driver —
    // elle consulte VehicleCategory via vehicle-config.js.
    vehicle = await createVehicle(organization.id, {
      type: 'CAMION',
    });

    driver = await createDriver({
      organizationId: organization.id,
      userId: user.id,
      vehicleId: vehicle.id,
    });

    token = driverToken({
      userId: user.id,
      driverId: driver.id,
      organizationId: organization.id,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================================
  // ZONE 1 — POST /api/public/actions
  // ==========================================================

  describe('Zone 1 — création publique', () => {
    test('émet LEAD_CREATED et PRICE_ESTIMATED (moto, TAXI, PER_KM)', async () => {
      const response = await request(app)
        .post('/api/public/actions')
        .send({
          organizationSlug: organization.slug,
          type: 'COURSE_REQUEST',
          clientNom: 'Client Timeline',
          clientTel: '0340000000',
          details: {
            depart: 'Antananarivo',
            arrivee: 'Ambohimangakely',
            typeVehicule: 'moto',
          },
        });

      expect([200, 201]).toContain(response.status);

      const action = await prisma.leadAction.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      expect(action).toBeTruthy();

      const events = await readEvents(action.id);

      expect(events.length).toBeGreaterThanOrEqual(2);

      expect(eventTypes(events).slice(0, 2)).toEqual([
        'LEAD_CREATED',
        'PRICE_ESTIMATED',
      ]);

      const created = events[0];
      const estimated = events[1];

      expect(created.actor).toBe('CLIENT');
      expect(created.payload).toMatchObject({
        type: 'COURSE_REQUEST',
        depart: 'Antananarivo',
        arrivee: 'Ambohimangakely',
        typeVehicule: 'moto',
      });

      expect(estimated.actor).toBe('SYSTEM');
      expect(estimated.payload).toMatchObject({
        currency: 'MGA',
      });
      expect(estimated.payload.price).toEqual(expect.any(Number));
      expect(estimated.recordedAt).toBeInstanceOf(Date);
    });

    test('émet NEGOTIATION_OPENED_BY_CLIENT lorsque offreClient est fourni', async () => {
      const response = await request(app)
        .post('/api/public/actions')
        .send({
          organizationSlug: organization.slug,
          type: 'LONG_HAUL',
          clientNom: 'Client Negotiation',
          clientTel: '0340000001',
          details: {
            depart: 'Antananarivo',
            arrivee: 'Toamasina',
            typeService: 'marchandises',
            typeVehicule: 'camion',
            offreClient: 150000,
          },
        });

      expect([200, 201]).toContain(response.status);

      const action = await prisma.leadAction.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      expect(action).toBeTruthy();

      const events = await readEvents(action.id);

      const negotiation = events.find(
        (event) => event.type === 'NEGOTIATION_OPENED_BY_CLIENT'
      );

      expect(negotiation).toBeTruthy();
      expect(negotiation.actor).toBe('CLIENT');
      expect(negotiation.payload).toMatchObject({
        offreClient: 150000,
        currency: 'MGA',
        responseChannel: 'PUBLIC_CODE',
        respondedBy: 'CLIENT',
      });
    });
  });

  // ==========================================================
  // ZONE 2 — POST /api/actions/:id/propose
  // ==========================================================

  describe('Zone 2 — proposition chauffeur', () => {
    test('émet NEGOTIATION_OFFERED_TO_CLIENT', async () => {
      const action = await createLeadAction({
        organizationId: null,
        type: 'LONG_HAUL',
        details: {
          depart: 'Antananarivo',
          arrivee: 'Toamasina',
          typeService: 'marchandises',
          typeVehicule: 'camion',
          pricingModel: 'NEGOTIATED',
          negotiation: {
            status: 'EN_ATTENTE_TRANSPORTEUR',
            proposedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
        },
      });

      // Créer une notification pour ce driver (exigé par la route
      // pour les LONG_HAUL publics).
      await prisma.notification.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          leadActionId: action.id,
          title: 'Timeline test',
          message: 'Notification requise pour la proposition publique',
          type: 'info',
        },
      });

      const response = await request(app)
        .post(`/api/actions/${action.id}/propose`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 250000 });

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('NEGOTIATION_OFFERED_TO_CLIENT');
      expect(events[0].actor).toBe('SYSTEM');
      expect(events[0].payload).toMatchObject({
        proposedPrice: 250000,
        currency: 'MGA',
      });
    });
  });

  // ==========================================================
  // ZONE 3 — POST /api/actions/:id/accept
  // ==========================================================

  describe('Zone 3 — acceptation chauffeur', () => {
    test('émet LEAD_ACCEPTED avec actor DRIVER', async () => {
      const action = await createLeadAction({
        organizationId: organization.id,
        type: 'COURSE_REQUEST',
        details: {
          prixEstime: 5000,
          distanceKm: 5,
          modePrestation: 'courseNormale',
          commissionPct: 20,
        },
      });

      const response = await request(app)
        .post(`/api/actions/${action.id}/accept`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'LEAD_ACCEPTED',
        actor: 'DRIVER',
        payload: {},
        partial: false,
      });
    });
  });

  // ==========================================================
  // ZONE 4 — POST /api/actions/:id/reject
  // ==========================================================

  describe('Zone 4 — rejet chauffeur', () => {
    test('émet LEAD_REJECTED pour une LeadAction privée', async () => {
      const action = await createLeadAction({
        organizationId: organization.id,
        type: 'COURSE_REQUEST',
        details: {},
      });

      const response = await request(app)
        .post(`/api/actions/${action.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('LEAD_REJECTED');
      expect(events[0].actor).toBe('DRIVER');
      expect(events[0].payload).toEqual({});
    });

    test('n’émet aucun événement pour un LONG_HAUL public rejeté par chauffeur', async () => {
      const action = await createLeadAction({
        organizationId: null,
        type: 'LONG_HAUL',
        details: {},
      });

      // Notification exigée par la route /reject pour LONG_HAUL public.
      await prisma.notification.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          leadActionId: action.id,
          title: 'Timeline test',
          message: 'Notification requise pour le rejet public',
          type: 'info',
        },
      });

      const response = await request(app)
        .post(`/api/actions/${action.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(events).toHaveLength(0);
    });
  });

  // ==========================================================
  // ZONE 5 — POST /api/public/actions/respond
  // ==========================================================

  describe('Zone 5 — réponse négociation publique', () => {
    async function createNegotiation({
      expiresAt,
      proposedPrice = 200000,
      codeSuivi,
      clientTel = '0340000000',
    } = {}) {
      const finalCodeSuivi = codeSuivi || `DG-${uniqueSuffix().slice(-6).toUpperCase()}`;
      const action = await createLeadAction({
        organizationId: null,
        type: 'LONG_HAUL',
        statut: 'NEW',
        clientTel,
        details: {
          codeSuivi: finalCodeSuivi,
          typeService: 'marchandises',
          typeVehicule: 'camion',
          pricingModel: 'NEGOTIATED',
          commissionPct: 20,
          distanceKm: 100,
          modePrestation: 'negociation',
          negotiation: {
            status: 'PROPOSITION_EN_ATTENTE_CLIENT',
            proposedPrice,
            proposedAt: new Date(Date.now() - 3600000).toISOString(),
            expiresAt: expiresAt || new Date(Date.now() + 3600000).toISOString(),
            respondedAt: null,
            respondedBy: null,
            responseChannel: null,
            driverId: driver.id,
            vehicleId: vehicle.id,
          },
        },
      });

      return { action, codeSuivi: finalCodeSuivi, clientTel };
    }

    test('expiration : émet NEGOTIATION_EXPIRED puis LEAD_REJECTED', async () => {
      const expiresAt = new Date(Date.now() - 60000).toISOString();

      const { action, codeSuivi, clientTel } = await createNegotiation({ expiresAt });

      const response = await request(app)
        .post('/api/public/actions/respond')
        .send({
          codeSuivi,
          clientTel,
          decision: 'REFUSEE',
        });

      // La branche expiration retourne toujours 409 avec le code dédié.
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('NEGOTIATION_EXPIRED');

      // Les événements sont écrits dans la transaction AVANT le retour 409.
      const events = await readEvents(action.id);

      expect(eventTypes(events)).toEqual([
        'NEGOTIATION_EXPIRED',
        'LEAD_REJECTED',
      ]);

      expect(events[0].actor).toBe('SYSTEM');
      expect(events[1].actor).toBe('SYSTEM');

      expect(events[0].occurredAt.toISOString()).toBe(expiresAt);
      expect(events[1].occurredAt.toISOString()).toBe(expiresAt);

      expect(events[0].payload).toMatchObject({
        expiresAt,
      });
    });

    test('refus client : émet NEGOTIATION_REFUSED_BY_CLIENT puis LEAD_REJECTED', async () => {
      const { action, codeSuivi, clientTel } = await createNegotiation();

      const response = await request(app)
        .post('/api/public/actions/respond')
        .send({
          codeSuivi,
          clientTel,
          decision: 'REFUSEE',
        });

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(eventTypes(events)).toEqual([
        'NEGOTIATION_REFUSED_BY_CLIENT',
        'LEAD_REJECTED',
      ]);

      expect(events[0].actor).toBe('CLIENT');
      expect(events[1].actor).toBe('SYSTEM');

      expect(events[0].payload).toMatchObject({
        responseChannel: 'PUBLIC_CODE',
        respondedBy: 'CLIENT',
      });
    });

    test('acceptation client : émet NEGOTIATION_ACCEPTED_BY_CLIENT puis LEAD_ACCEPTED', async () => {
      const { action, codeSuivi, clientTel } = await createNegotiation();

      const response = await request(app)
        .post('/api/public/actions/respond')
        .send({
          codeSuivi,
          clientTel,
          decision: 'ACCEPTEE',
        });

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(eventTypes(events)).toEqual([
        'NEGOTIATION_ACCEPTED_BY_CLIENT',
        'LEAD_ACCEPTED',
      ]);

      expect(events[0].actor).toBe('CLIENT');
      expect(events[1].actor).toBe('SYSTEM');

      expect(events[0].payload).toMatchObject({
        responseChannel: 'PUBLIC_CODE',
        respondedBy: 'CLIENT',
      });
    });
  });

  // ==========================================================
  // TRANSVERSAL
  // ==========================================================

  describe('Contraintes transversales', () => {
    test('les événements sont persistés avec recordedAt et partial=false', async () => {
      const action = await createLeadAction({
        organizationId: organization.id,
        type: 'COURSE_REQUEST',
      });

      const response = await request(app)
        .post(`/api/actions/${action.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([200, 201]).toContain(response.status);

      const events = await readEvents(action.id);

      expect(events).toHaveLength(1);
      expect(events[0].recordedAt).toBeInstanceOf(Date);
      expect(events[0].partial).toBe(false);
    });
  });
});
