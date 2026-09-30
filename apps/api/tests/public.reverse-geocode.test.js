// ============================================================
// DAGOO'S API — Integration tests reverse-geocode
// Phase 2.1.b.4
//
// Aucune dépendance base de données.
// Nominatim (OpenStreetMap) est mocké via global.fetch.
// Le rate-limiter publicLeadLimiter est désactivé pour les tests.
// ============================================================

// ------------------------------------------------------------
// Mock du rate-limiter AVANT tout import de l'app.
// ------------------------------------------------------------
jest.mock('../middleware/rate-limit', () => ({
  publicLeadLimiter: (req, res, next) => next(),
}));

const request = require('supertest');
const app = require('../app');

// ------------------------------------------------------------
// Helpers de mock Nominatim
// ------------------------------------------------------------

function mockNominatimSuccess(address = {}) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      address: {
        road: 'Rue Andrianampoinimerina',
        suburb: 'Analakely',
        city: 'Antananarivo',
        country_code: 'mg',
        ...address,
      },
      display_name: 'Analakely, Antananarivo, Madagascar',
    }),
  }));
}

function mockNominatimEmpty() {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({}),
  }));
}

// ------------------------------------------------------------
// Lifecycle
// ------------------------------------------------------------

afterEach(() => {
  delete global.fetch;
});

// ============================================================
// GET /api/public/reverse-geocode
// ============================================================

describe('GET /api/public/reverse-geocode', () => {
  test('T1 — coordonnées valides + Nominatim OK → 200 avec adresse', async () => {
    mockNominatimSuccess();

    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lat: -18.8792, lng: 47.5079 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      lat: -18.8792,
      lng: 47.5079,
    });
    expect(typeof response.body.adresse).toBe('string');
    expect(response.body.adresse).toContain('Analakely');
  });

  test('T2 — Nominatim OK sans address → 404', async () => {
    mockNominatimEmpty();

    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lat: -18.8792, lng: 47.5079 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Adresse introuvable');
  });

  test('T3 — lat hors bornes (>90) → 400', async () => {
    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lat: 95, lng: 47.5079 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Coordonnées GPS invalides');
  });

  test('T4 — lng hors bornes (>180) → 400', async () => {
    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lat: -18.8792, lng: 200 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Coordonnées GPS invalides');
  });

  test('T5 — lat non numérique → 400', async () => {
    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lat: 'abc', lng: 47.5079 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Coordonnées GPS invalides');
  });

  test('T6 — lat manquant → 400', async () => {
    const response = await request(app)
      .get('/api/public/reverse-geocode')
      .query({ lng: 47.5079 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Coordonnées GPS invalides');
  });
});
