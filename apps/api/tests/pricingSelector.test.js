// ============================================================
// TESTS - pricingSelector
// ============================================================
//
// Verifie le comportement deterministe du selector.
// Utilise une mock de prisma pour eviter la base de donnees.
//
// Semantique testee (S2 STRICTE) :
//   - Toutes les dimensions sont toujours filtrees.
//   - Dimension non fournie -> filtre sur NULL.
//   - Dimension fournie a null -> filtre sur NULL.
//   - Dimension fournie a valeur -> filtre sur valeur exacte.
//   - excludeFromUnique: false par defaut.
//
// Reference : docs/O1_PRISMA_POSTGRES_AUDIT.md
// ============================================================

const {
  selectServiceTariff,
  AmbiguousTariffError,
} = require('../services/pricingSelector');

// ============================================================
// MOCK PRISMA
// ============================================================

jest.mock('../lib/prisma', () => ({
  serviceTariff: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../lib/prisma');

// ============================================================
// HELPERS
// ============================================================

function mockFindMany(result) {
  prisma.serviceTariff.findMany.mockResolvedValueOnce(result);
}

function baseWhere() {
  return {
    active: true,
    excludeFromUnique: false,
    modePrestation: null,
    zone: null,
    mode: null,
    categorie: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// VALIDATION DES PARAMETRES
// ============================================================

describe('selectServiceTariff - validation', () => {
  test('lance une erreur si serviceId manque', async () => {
    await expect(
      selectServiceTariff({ vehicleCategoryId: 'cat1' })
    ).rejects.toThrow('serviceId est obligatoire');
  });

  test('lance une erreur si vehicleCategoryId manque', async () => {
    await expect(
      selectServiceTariff({ serviceId: 'svc1' })
    ).rejects.toThrow('vehicleCategoryId est obligatoire');
  });
});

// ============================================================
// MATCH UNIQUE
// ============================================================

describe('selectServiceTariff - match unique', () => {
  test('retourne le tarif si exactement 1 match', async () => {
    const fakeTariff = { id: 'tariff1', pricingModel: 'PER_KM' };
    mockFindMany([fakeTariff]);

    const result = await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      pricingModel: 'PER_KM',
    });

    expect(result).toBe(fakeTariff);

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({
      ...baseWhere(),
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      pricingModel: 'PER_KM',
    });
    expect(callArgs.orderBy).toEqual({ createdAt: 'asc' });
  });

  test('retourne le tarif avec dimensions explicites', async () => {
    const fakeTariff = { id: 'tariff1' };
    mockFindMany([fakeTariff]);

    const result = await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      dimensions: {
        zone: 'regionale',
        mode: 'courseNormale',
      },
    });

    expect(result).toBe(fakeTariff);

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({
      ...baseWhere(),
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      zone: 'regionale',
      mode: 'courseNormale',
    });
  });
});

// ============================================================
// AUCUN MATCH
// ============================================================

describe('selectServiceTariff - aucun match', () => {
  test('retourne null si 0 match', async () => {
    mockFindMany([]);

    const result = await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      pricingModel: 'PER_KM',
    });

    expect(result).toBeNull();
  });
});

// ============================================================
// AMBIGUITE
// ============================================================

describe('selectServiceTariff - ambiguité', () => {
  test('lance AmbiguousTariffError si plusieurs matchs', async () => {
    mockFindMany([
      { id: 'tariff1', pricingModel: 'NEGOTIATED' },
      { id: 'tariff2', pricingModel: 'NEGOTIATED' },
    ]);

    await expect(
      selectServiceTariff({
        serviceId: 'svc1',
        vehicleCategoryId: 'cat1',
        pricingModel: 'NEGOTIATED',
      })
    ).rejects.toThrow(AmbiguousTariffError);
  });

  test('AmbiguousTariffError contient le contexte', async () => {
    mockFindMany([
      { id: 'tariff1' },
      { id: 'tariff2' },
    ]);

    try {
      await selectServiceTariff({
        serviceId: 'svc1',
        vehicleCategoryId: 'cat1',
        pricingModel: 'NEGOTIATED',
      });
      throw new Error('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AmbiguousTariffError);
      expect(e.context.matchCount).toBe(2);
      expect(e.context.tariffIds).toEqual(['tariff1', 'tariff2']);
      expect(e.context.serviceId).toBe('svc1');
    }
  });
});

// ============================================================
// DIMENSION undefined vs null vs valeur
// ============================================================

describe('selectServiceTariff - sémantique dimensions', () => {
  test('dimension absente -> filtre sur NULL', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where.modePrestation).toBeNull();
    expect(callArgs.where.zone).toBeNull();
    expect(callArgs.where.mode).toBeNull();
    expect(callArgs.where.categorie).toBeNull();
  });

  test('dimension explicitement null -> filtre sur NULL', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      dimensions: {
        zone: null,
      },
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where.zone).toBeNull();
    expect(callArgs.where.modePrestation).toBeNull();
    expect(callArgs.where.mode).toBeNull();
    expect(callArgs.where.categorie).toBeNull();
  });

  test('dimension valeur -> filtre sur valeur', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      dimensions: {
        zone: 'regionale',
      },
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where.zone).toBe('regionale');
    expect(callArgs.where.modePrestation).toBeNull();
    expect(callArgs.where.mode).toBeNull();
    expect(callArgs.where.categorie).toBeNull();
  });

  test('dimension non fournie ne peut pas matcher une valeur DB', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      dimensions: {
        zone: 'regionale',
      },
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    // modePrestation n'est pas fourni -> filtre sur NULL
    expect(callArgs.where.modePrestation).toBeNull();
  });

  test('sans aucune dimension, les 4 dimensions sont filtrees sur NULL', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({
      ...baseWhere(),
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
    });
  });
});

// ============================================================
// EXCLUDE FROM UNIQUE + CONFIGURATION IGNOREE
// ============================================================

describe('selectServiceTariff - excludeFromUnique et configuration', () => {
  test('excludeFromUnique: false est toujours envoye', async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];
    expect(callArgs.where.excludeFromUnique).toBe(false);
  });

  test("configuration n'est pas lue pour la selection", async () => {
    mockFindMany([{ id: 'tariff1' }]);

    await selectServiceTariff({
      serviceId: 'svc1',
      vehicleCategoryId: 'cat1',
      dimensions: {
        zone: 'regionale',
        mode: 'courseNormale',
      },
    });

    const callArgs = prisma.serviceTariff.findMany.mock.calls[0][0];

    // La clause where ne doit contenir QUE les filtres explicites
    expect(Object.keys(callArgs.where).sort()).toEqual([
      'active',
      'categorie',
      'excludeFromUnique',
      'mode',
      'modePrestation',
      'serviceId',
      'vehicleCategoryId',
      'zone',
    ]);

    // Aucun champ 'configuration' dans la clause
    expect(callArgs.where).not.toHaveProperty('configuration');
  });
});
