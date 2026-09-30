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

// ============================================================
// 2.1.a.4 — RESERVATIONS/MANAGE
// ============================================================

describe('POST /api/public/reservations/manage', () => {
  const bcrypt = require('bcryptjs');

  jest.setTimeout(30000);

  const otpHashes = new Map();

  async function getOtpHash(otpCode) {
    const key = String(otpCode);

    if (!otpHashes.has(key)) {
      otpHashes.set(key, await bcrypt.hash(key, 12));
    }

    return otpHashes.get(key);
  }

  async function createManageFixture({
    telephone = '0340000000',
    passagerNom = 'Passager Test',
    place = '1',
    otpCode = '123456',
    otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000),
    departOverrides = {},
  } = {}) {
    const organization = await createOrganization({
      slug: `manage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'COOPERATIVE',
    });

    const depart = await prisma.depart.create({
      data: {
        organizationId: organization.id,
        pointDepart: 'Antananarivo',
        destination: 'Toamasina',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        heure: '08:00',
        prix: 15000,
        placesTotal: 20,
        statut: 'PUBLISHED',
        ...departOverrides,
      },
    });

    const otpHash = await getOtpHash(otpCode);

    const reservation = await prisma.reservation.create({
      data: {
        departId: depart.id,
        passagerNom,
        telephone,
        place,
        statut: 'PENDING',
        otpHash,
        otpExpiresAt,
      },
    });

    return {
      organization,
      depart,
      reservation,
      otpCode,
    };
  }

  test('retourne les réservations PENDING avec un OTP valide', async () => {
    const fixture = await createManageFixture();

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
      });

    expect(response.status).toBe(200);
    expect(response.body.reservations).toHaveLength(1);
    expect(response.body.reservations[0].id).toBe(fixture.reservation.id);
    expect(response.body.reservations[0].place).toBe('1');
    expect(response.body.reservations[0].statut).toBe('PENDING');
    expect(response.body.reservations[0].depart.id).toBe(fixture.depart.id);
  });

  test('retourne 400 si telephone, nom ou OTP manque', async () => {
    const cases = [
      {
        passagerNom: 'Passager Test',
        otpCode: '123456',
      },
      {
        telephone: '0340000000',
        otpCode: '123456',
      },
      {
        telephone: '0340000000',
        passagerNom: 'Passager Test',
      },
    ];

    for (const payload of cases) {
      const response = await request(app)
        .post('/api/public/reservations/manage')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Telephone, nom et code OTP requis'
      );
    }
  });

  test('retourne 404 si aucune réservation ne correspond au téléphone et au nom', async () => {
    const fixture = await createManageFixture();

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: 'Autre Passager',
        otpCode: fixture.otpCode,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      'Aucune réservation trouvée avec ces informations'
    );
  });

  test('retourne 403 avec un OTP invalide', async () => {
    const fixture = await createManageFixture();

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: '999999',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Code OTP invalide ou expire');
  });

  test('retourne 403 avec un OTP expiré', async () => {
    const fixture = await createManageFixture({
      otpExpiresAt: new Date(Date.now() - 60 * 1000),
    });

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Code OTP invalide ou expire');
  });

  test('annule une réservation appartenant au client authentifié', async () => {
    const fixture = await createManageFixture();

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
        action: 'cancel',
        reservationId: fixture.reservation.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      message: 'Réservation annulée',
    });

    const updated = await prisma.reservation.findUnique({
      where: { id: fixture.reservation.id },
      select: { statut: true },
    });

    expect(updated.statut).toBe('CANCELLED');
  });

  test('refuse l annulation d une réservation étrangère', async () => {
    const fixtureA = await createManageFixture({
      telephone: '0340000001',
      passagerNom: 'Passager A',
      place: '1',
      otpCode: '111111',
    });

    const fixtureB = await createManageFixture({
      telephone: '0340000002',
      passagerNom: 'Passager B',
      place: '2',
      otpCode: '222222',
    });

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixtureA.reservation.telephone,
        passagerNom: fixtureA.reservation.passagerNom,
        otpCode: fixtureA.otpCode,
        action: 'cancel',
        reservationId: fixtureB.reservation.id,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Réservation introuvable');

    const foreignReservation = await prisma.reservation.findUnique({
      where: { id: fixtureB.reservation.id },
      select: { statut: true },
    });

    expect(foreignReservation.statut).toBe('PENDING');
  });

  test('modifie la place lorsque la nouvelle place est disponible', async () => {
    const fixture = await createManageFixture({
      place: '1',
    });

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
        action: 'modify',
        reservationId: fixture.reservation.id,
        nouvellePlace: '5',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      message: 'Place modifiée',
    });

    const updated = await prisma.reservation.findUnique({
      where: { id: fixture.reservation.id },
      select: { place: true },
    });

    expect(updated.place).toBe('5');
  });

  test('refuse une nouvelle place déjà réservée', async () => {
    const fixture = await createManageFixture({
      place: '1',
    });

    await prisma.reservation.create({
      data: {
        departId: fixture.depart.id,
        passagerNom: 'Autre Passager',
        telephone: '0340000999',
        place: '5',
        statut: 'PENDING',
        otpHash: await getOtpHash('654321'),
        otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
        action: 'modify',
        reservationId: fixture.reservation.id,
        nouvellePlace: '5',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Place déjà réservée');

    const unchanged = await prisma.reservation.findUnique({
      where: { id: fixture.reservation.id },
      select: { place: true },
    });

    expect(unchanged.place).toBe('1');
  });

  test('ne retourne pas une réservation CANCELLED', async () => {
    const fixture = await createManageFixture();

    await prisma.reservation.update({
      where: { id: fixture.reservation.id },
      data: { statut: 'CANCELLED' },
    });

    const response = await request(app)
      .post('/api/public/reservations/manage')
      .send({
        telephone: fixture.reservation.telephone,
        passagerNom: fixture.reservation.passagerNom,
        otpCode: fixture.otpCode,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      'Aucune réservation trouvée avec ces informations'
    );
  });
});
