// ============================================================
// DAGOO'S API — Integration tests publics
// Phase 2.0.d
//
// Base exclusivement utilisée : test_2_0_d
// ============================================================

const fs = require('fs');

function loadTestDatabaseUrl() {
  const env = fs.readFileSync('.env', 'utf8');
  const match = env.match(/^DATABASE_URL=(.*)$/m);

  if (!match) {
    throw new Error('DATABASE_URL introuvable dans .env');
  }

  const baseUrl = match[1].trim().replace(/^["']|["']$/g, '');
  const url = new URL(baseUrl);

  url.searchParams.set('schema', 'test_2_0_d');

  return url.toString();
}

// IMPORTANT : doit être défini AVANT le chargement de l'application.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = loadTestDatabaseUrl();

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../app');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function resetDatabase() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'test_2_0_d'
    ORDER BY tablename
  `);

  if (tables.length === 0) {
    return;
  }

  const qualifiedTables = tables
    .map(({ tablename }) => {
      const safeTable = tablename.replace(/"/g, '""');
      return `"test_2_0_d"."${safeTable}"`;
    })
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${qualifiedTables} CASCADE`
  );
}

async function createOrganization({
  slug = 'test-location',
  type = 'FLEET_MANAGER',
} = {}) {
  return prisma.organization.create({
    data: {
      name: 'Organisation Test 2.0.d',
      code: `TEST-${slug}`,
      slug,
      type,
      email: `${slug}@test.dagoos.local`,
      phone: '0340000000',
      plan: 'Premium',
      status: 'active',
    },
  });
}

async function createTarif(organizationId, vehiculeTarifs) {
  return prisma.tarif.create({
    data: {
      organizationId,
      prixBase: 2000,
      prixKm: 500,
      locationJournalier: 15000,
      commissionChauffeur: 20,
      adyVarotraActif: true,
      courseNormalActif: true,
      locationActif: true,
      vehiculeTarifs: JSON.stringify(vehiculeTarifs),
    },
  });
}

function mockGeocodingSuccess() {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => [
      {
        lat: '-18.8792',
        lon: '47.5079',
      },
    ],
  }));
}

function mockGeocodingFailure() {
  global.fetch = jest.fn(async () => {
    throw new Error('Geocoding indisponible pour le test');
  });
}

// ------------------------------------------------------------
// Lifecycle
// ------------------------------------------------------------

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await resetDatabase();
  mockGeocodingSuccess();
});

afterAll(async () => {
  delete global.fetch;
  await prisma.$disconnect();
});

// ============================================================
// 2.0.a — CAR_RENTAL
// ============================================================

describe('POST /api/public/estimate-location — CAR_RENTAL', () => {
  test('utilise tarifFixe.prixTrajet pour bus, minivan et tricycle', async () => {
    const organization = await createOrganization({
      slug: 'test-fixed',
    });

    await createTarif(organization.id, {
      bus: {
        tarifFixe: {
          prixTrajet: 6000,
        },
      },
      minivan: {
        tarifFixe: {
          prixTrajet: 5000,
        },
      },
      tricycle: {
        tarifFixe: {
          prixTrajet: 1500,
        },
      },
    });

    const basePayload = {
      organizationSlug: organization.slug,
      type: 'CAR_RENTAL',
      typeTrajet: 'A_B',
      depart: 'Antananarivo',
      arrivee: 'Antananarivo',
      carburant: 'AVEC',
    };

    const bus = await request(app)
      .post('/api/public/estimate-location')
      .send({
        ...basePayload,
        typeVehicule: 'bus',
      });

    const minivan = await request(app)
      .post('/api/public/estimate-location')
      .send({
        ...basePayload,
        typeVehicule: 'minivan',
      });

    const tricycle = await request(app)
      .post('/api/public/estimate-location')
      .send({
        ...basePayload,
        typeVehicule: 'tricycle',
      });

    expect(bus.status).toBe(200);
    expect(bus.body.prixEstime).toBe(6000);

    expect(minivan.status).toBe(200);
    expect(minivan.body.prixEstime).toBe(5000);

    expect(tricycle.status).toBe(200);
    expect(tricycle.body.prixEstime).toBe(1500);
  });

  test('retourne 404 lorsqu aucun tarif location/fixe n est configuré', async () => {
    const organization = await createOrganization({
      slug: 'test-no-tariff',
    });

    await createTarif(organization.id, {
      tricycle: {
        tarifFixe: {
          prixTrajet: 1500,
        },
      },
    });

    const response = await request(app)
      .post('/api/public/estimate-location')
      .send({
        organizationSlug: organization.slug,
        type: 'CAR_RENTAL',
        typeVehicule: 'bus',
        typeTrajet: 'A_B',
        carburant: 'AVEC',
        depart: 'Antananarivo',
        arrivee: 'Antananarivo',
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain(
      'Tarif location non configuré pour bus'
    );
  });

  test('ne réutilise pas tarifFixe pour SANS carburant', async () => {
    const organization = await createOrganization({
      slug: 'test-fixed-sans',
    });

    await createTarif(organization.id, {
      bus: {
        tarifFixe: {
          prixTrajet: 6000,
        },
      },
    });

    const response = await request(app)
      .post('/api/public/estimate-location')
      .send({
        organizationSlug: organization.slug,
        type: 'CAR_RENTAL',
        typeVehicule: 'bus',
        typeTrajet: 'A_B',
        carburant: 'SANS',
        depart: 'Antananarivo',
        arrivee: 'Antananarivo',
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain(
      'Tarif location non configuré pour bus'
    );
  });
});

// ============================================================
// 2.0.b — calculerDistance
// ============================================================

describe('POST /api/public/estimate-location — distance', () => {
  test('retourne 400 lorsque le géocodage échoue', async () => {
    mockGeocodingFailure();

    const organization = await createOrganization({
      slug: 'test-distance-error',
    });

    await createTarif(organization.id, {
      bus: {
        tarifFixe: {
          prixTrajet: 6000,
        },
      },
    });

    const response = await request(app)
      .post('/api/public/estimate-location')
      .send({
        organizationSlug: organization.slug,
        type: 'CAR_RENTAL',
        typeVehicule: 'bus',
        typeTrajet: 'A_B',
        carburant: 'AVEC',
        depart: 'Adresse inexistante test 2.0.d',
        arrivee: 'Autre adresse inexistante test 2.0.d',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'Impossible de déterminer la distance entre les adresses fournies',
    });
  });

  test('retourne 400 lorsque départ et arrivée sont absents', async () => {
    const organization = await createOrganization({
      slug: 'test-distance-required',
    });

    const response = await request(app)
      .post('/api/public/estimate-location')
      .send({
        organizationSlug: organization.slug,
        type: 'CAR_RENTAL',
        typeVehicule: 'bus',
        typeTrajet: 'A_B',
        carburant: 'AVEC',
        depart: '',
        arrivee: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Informations manquantes');
  });
});

// ============================================================
// 2.0.c — photos + heures
// ============================================================

describe('POST /api/public/actions + GET /api/public/suivi/:code', () => {
  test('préserve photos, heureDepart et heureRetour', async () => {
    const organization = await createOrganization({
      slug: 'test-photos-hours',
    });
    await createTarif(organization.id, {
  bus: {
    tarifFixe: {
      prixTrajet: 6000,
    },
  },
});

    const photos = [
      'https://res.cloudinary.com/test/image/upload/photo-1.jpg',
      'https://res.cloudinary.com/test/image/upload/photo-2.jpg',
    ];

    const response = await request(app)
      .post('/api/public/actions')
      .send({
        organizationSlug: organization.slug,
        type: 'CAR_RENTAL',
        clientNom: 'Client Test',
        clientTel: '0340000000',
        details: {
          typeVehicule: 'bus',
          typeTrajet: 'A_B',
          depart: 'Antananarivo',
          arrivee: 'Ambohimangakely',
          dateAller: '2026-09-29',
          dateRetour: null,
          carburant: 'AVEC',
          photos,
          heureDepart: '08:00',
          heureRetour: '17:00',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.codeSuivi).toMatch(/^DG-/);

    const code = response.body.codeSuivi;

    const suivi = await request(app)
      .get(`/api/public/suivi/${encodeURIComponent(code)}`);

    expect(suivi.status).toBe(200);
    expect(suivi.body.codeSuivi).toBe(code);
    expect(suivi.body.photos).toEqual(photos);

    const action = await prisma.leadAction.findFirst({
      where: {
        id: response.body.actionId,
      },
      select: {
        details: true,
      },
    });

    expect(action).not.toBeNull();
    expect(action.details.photos).toEqual(photos);
    expect(action.details.heureDepart).toBe('08:00');
    expect(action.details.heureRetour).toBe('17:00');
  });
});
