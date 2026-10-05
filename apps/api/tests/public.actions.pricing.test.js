// IMPORTANT : doit précéder tout require qui lit JWT_SECRET
require('dotenv/config');

// ============================================================
// DAGOO'S API — Tests pricing /public/actions
// Phase 2.2.3
//
// Objectif :
// - V2 ServiceTariff prioritaire
// - fallback V1 si V2 absent
// - jamais de prix par défaut à 2000 Ar
// - erreur explicite si aucun tarif
// - rejet d'une configuration V2 ambiguë
// ============================================================

jest.mock('../lib/prisma', () => ({
  organization: {
    findUnique: jest.fn(),
  },
  businessActivity: {
    findFirst: jest.fn(),
  },
  service: {
    findFirst: jest.fn(),
  },
  vehicleCategory: {
    findUnique: jest.fn(),
  },
  driver: {
    findMany: jest.fn(),
  },
  serviceTariff: {
    findMany: jest.fn(),
  },
  tarif: {
    findUnique: jest.fn(),
  },
  leadAction: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
}));

jest.mock('../services/pricingSelector', () => {
  class AmbiguousTariffError extends Error {
    constructor(context) {
      super('Tarification ambiguë');
      this.name = 'AmbiguousTariffError';
      this.context = context;
    }
  }

  return {
    AmbiguousTariffError,
    selectServiceTariff: jest.fn(),
  };
});

const request = require('supertest');
const prisma = require('../lib/prisma');
const {
  selectServiceTariff,
  AmbiguousTariffError,
} = require('../services/pricingSelector');
const app = require('../app');

describe('POST /api/public/actions — pricing 2.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      slug: 'test-org',
      name: 'Organisation Test',
      status: 'active',
    });

    prisma.businessActivity.findFirst.mockResolvedValue({
      id: 'activity-1',
    });

    prisma.service.findFirst.mockResolvedValue({
      id: 'service-1',
      code: 'TAXI',
    });

    prisma.vehicleCategory.findUnique.mockResolvedValue({
      id: 'category-1',
      code: 'MOTO',
    });

    prisma.leadAction.create.mockResolvedValue({
      id: 'action-1',
    });

    prisma.notification.create.mockResolvedValue({
      id: 'notification-1',
    });

    prisma.notification.createMany.mockResolvedValue({
      count: 0,
    });

    prisma.driver.findMany.mockResolvedValue([]);
  });

  function mockDistance() {
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

  function payload(overrides = {}) {
    return {
      organizationSlug: 'test-org',
      type: 'COURSE_REQUEST',
      clientNom: 'Client Test',
      clientTel: '0340000000',
      details: {
        typeVehicule: 'moto',
        depart: 'Antananarivo',
        arrivee: 'Ambohimangakely',
        ...overrides,
      },
    };
  }

  beforeEach(() => {
    mockDistance();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('1. utilise ServiceTariff V2 prioritaire pour une course moto', async () => {
    selectServiceTariff.mockResolvedValueOnce({
      id: 'tariff-v2',
      pricingModel: 'PER_KM',
      basePrice: 5000,
      unitPrice: 1000,
      commissionPct: 15,
    });

    const response = await request(app)
      .post('/api/public/actions')
      .send(payload());

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    const leadActionData = prisma.leadAction.create.mock.calls[0][0].data;
    expect(leadActionData.details.prixEstime).toBeGreaterThan(0);
    expect(leadActionData.details.prixEstime).not.toBe(2000);
    expect(leadActionData.details.modePrestation).toBe('courseNormale');

    expect(selectServiceTariff).toHaveBeenCalledWith({
      serviceId: 'service-1',
      vehicleCategoryId: 'category-1',
      pricingModel: 'PER_KM',
      dimensions: {
        modePrestation: 'normal',
      },
    });

    expect(prisma.tarif.findUnique).not.toHaveBeenCalled();
  });

  test('2. utilise le tarif V2 FIXED pour un bus', async () => {
    prisma.service.findFirst.mockResolvedValueOnce({
      id: 'service-location',
      code: 'LOCATION_URBAINE',
    });

    prisma.vehicleCategory.findUnique.mockResolvedValueOnce({
      id: 'category-bus',
      code: 'BUS',
    });

    selectServiceTariff.mockResolvedValueOnce({
      id: 'tariff-bus-v2',
      pricingModel: 'FIXED',
      basePrice: 12000,
      unitPrice: null,
      commissionPct: 18,
    });

    const response = await request(app)
      .post('/api/public/actions')
      .send(payload({
        typeVehicule: 'bus',
      }));

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    const leadActionData = prisma.leadAction.create.mock.calls[0][0].data;
    expect(leadActionData.details.prixEstime).toBe(12000);
    expect(leadActionData.details.modePrestation).toBe('tarifFixe');

    expect(selectServiceTariff).toHaveBeenCalledWith({
      serviceId: 'service-location',
      vehicleCategoryId: 'category-bus',
      pricingModel: 'FIXED',
      dimensions: {},
    });

    expect(prisma.tarif.findUnique).not.toHaveBeenCalled();
  });

  test('3. utilise V1 lorsque ServiceTariff V2 est absent', async () => {
    selectServiceTariff.mockResolvedValueOnce(null);

    prisma.tarif.findUnique.mockResolvedValueOnce({
      id: 'tarif-v1',
      organizationId: 'org-1',
      prixBase: 3000,
      prixKm: 500,
      commissionChauffeur: 20,
      vehiculeTarifs: JSON.stringify({
        moto: {
          courseNormale: {
            prixBase: 3000,
            prixKm: 500,
          },
        },
      }),
    });

    const response = await request(app)
      .post('/api/public/actions')
      .send(payload());

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);

    const leadActionData = prisma.leadAction.create.mock.calls[0][0].data;
    expect(leadActionData.details.prixEstime).toBeGreaterThan(0);
    expect(leadActionData.details.prixEstime).not.toBe(2000);
    expect(leadActionData.details.modePrestation).toBe('courseNormale');

    expect(prisma.tarif.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
      },
    });
  });

  test('4. retourne 404 si V2 et V1 sont absents', async () => {
    selectServiceTariff.mockResolvedValueOnce(null);
    prisma.tarif.findUnique.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/public/actions')
      .send(payload());

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      'Tarif non configuré pour cette organisation'
    );
    expect(response.body.prixEstime).toBeUndefined();
  });

  test('5. retourne 500 si la configuration V2 est ambiguë', async () => {
    selectServiceTariff.mockRejectedValueOnce(
      new AmbiguousTariffError({
        serviceId: 'service-1',
        vehicleCategoryId: 'category-1',
      })
    );

    const response = await request(app)
      .post('/api/public/actions')
      .send(payload());

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'Configuration tarifaire ambigue pour cette combinaison'
    );

    expect(prisma.tarif.findUnique).not.toHaveBeenCalled();
  });

  test('6. persiste le résultat V2 LONG_HAUL NEGOTIATED', async () => {
    prisma.service.findFirst.mockResolvedValueOnce({
      id: 'service-long-haul',
      code: 'MARCHANDISES',
    });

    prisma.vehicleCategory.findUnique.mockResolvedValueOnce({
      id: 'category-camion',
      code: 'CAMION',
    });

    selectServiceTariff.mockResolvedValueOnce({
      id: 'tariff-negotiated',
      pricingModel: 'NEGOTIATED',
      basePrice: 0,
      unitPrice: 0,
      commissionPct: 20,
      configuration: {},
    });

    const response = await request(app)
      .post('/api/public/actions')
      .send({
        organizationSlug: 'test-org',
        type: 'LONG_HAUL',
        clientNom: 'Client Test',
        clientTel: '0340000000',
        details: {
          typeService: 'marchandises',
          typeVehicule: 'camion',
          depart: 'Antananarivo',
          arrivee: 'Toamasina',
          volume: 10,
        },
      });

    expect(response.status).toBe(201);

    const createCall = prisma.leadAction.create.mock.calls[0][0];
    const savedDetails = createCall.data.details;

    expect(savedDetails.pricingModel).toBe('NEGOTIATED');
    expect(savedDetails.estimated).toBe(false);
    expect(savedDetails.price).toBeNull();
    expect(savedDetails.status).toBe('NEGOTIATION_REQUIRED');
    expect(savedDetails.negotiation).toEqual({
      status: 'EN_ATTENTE_TRANSPORTEUR',
      proposedPrice: null,
      note: null,
      proposedAt: null,
      respondedAt: null,
    });
  });

  test('7. expose le résultat V2 LONG_HAUL NEGOTIATED via /suivi', async () => {
    prisma.service.findFirst.mockResolvedValueOnce({
      id: 'service-long-haul',
      code: 'MARCHANDISES',
    });

    prisma.vehicleCategory.findUnique.mockResolvedValueOnce({
      id: 'category-camion',
      code: 'CAMION',
    });

    selectServiceTariff.mockResolvedValueOnce({
      id: 'tariff-negotiated',
      pricingModel: 'NEGOTIATED',
      basePrice: 0,
      unitPrice: 0,
      commissionPct: 20,
      configuration: {},
    });

    const createResponse = await request(app)
      .post('/api/public/actions')
      .send({
        organizationSlug: 'test-org',
        type: 'LONG_HAUL',
        clientNom: 'Client Test',
        clientTel: '0340000000',
        details: {
          typeService: 'marchandises',
          typeVehicule: 'camion',
          depart: 'Antananarivo',
          arrivee: 'Toamasina',
          volume: 10,
        },
      });

    expect(createResponse.status).toBe(201);

    const createCall = prisma.leadAction.create.mock.calls[0][0];
    const savedDetails = createCall.data.details;
    const codeSuivi = savedDetails.codeSuivi;

    prisma.leadAction.findFirst.mockResolvedValueOnce({
      id: 'action-1',
      clientNom: 'Client Test',
      clientTel: '0340000000',
      type: 'LONG_HAUL',
      statut: 'PENDING',
      details: savedDetails,
      createdAt: new Date('2026-10-05T05:00:00.000Z'),
      updatedAt: new Date('2026-10-05T05:00:00.000Z'),
    });

    const suiviResponse = await request(app)
      .get(`/api/public/suivi/${codeSuivi}`);

    expect(suiviResponse.status).toBe(200);
    expect(suiviResponse.body.codeSuivi).toBe(codeSuivi);
    expect(suiviResponse.body.pricingModel).toBe('NEGOTIATED');
    expect(suiviResponse.body.estimated).toBe(false);
    expect(suiviResponse.body.price).toBeNull();
    expect(suiviResponse.body.status).toBe('NEGOTIATION_REQUIRED');
    expect(suiviResponse.body.negotiation).toEqual({
      status: 'EN_ATTENTE_TRANSPORTEUR',
      proposedPrice: null,
      note: null,
      proposedAt: null,
      respondedAt: null,
    });
  });

  test('8. conserve le calcul réel LONG_HAUL PER_KM', async () => {
    prisma.service.findFirst.mockResolvedValueOnce({
      id: 'service-long-haul',
      code: 'LOCATION_INTERURBAINE',
    });

    prisma.vehicleCategory.findUnique.mockResolvedValueOnce({
      id: 'category-bus',
      code: 'BUS',
    });

    selectServiceTariff.mockResolvedValueOnce({
      id: 'tariff-per-km',
      pricingModel: 'PER_KM',
      basePrice: 5000,
      unitPrice: 1000,
      commissionPct: 15,
      configuration: {},
    });

    const response = await request(app)
      .post('/api/public/actions')
      .send({
        organizationSlug: 'test-org',
        type: 'LONG_HAUL',
        clientNom: 'Client Test',
        clientTel: '0340000000',
        details: {
          typeService: 'passagers',
          typeVehicule: 'bus',
          depart: 'Antananarivo',
          arrivee: 'Ambohimangakely',
          nbPassagers: 2,
        },
      });

    expect(response.status).toBe(201);

    const createCall = prisma.leadAction.create.mock.calls[0][0];
    const savedDetails = createCall.data.details;

    expect(savedDetails.pricingModel).toBe('PER_KM');
    expect(savedDetails.estimated).toBe(true);
    expect(savedDetails.status).toBe('ESTIMATED');
    expect(savedDetails.price).toBeGreaterThan(5000);
    expect(savedDetails.negotiation).toBeNull();
  });
});
