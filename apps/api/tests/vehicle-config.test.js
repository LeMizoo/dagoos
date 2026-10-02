// ============================================================
// VEHICLE_CONFIG — test unitaire
// Phase 2.5.2 — Extraction du mapping URBAN
// ============================================================

const { VEHICLE_CONFIG } = require('../modules/public/vehicle-config');

describe('VEHICLE_CONFIG', () => {
  const expectedVehicles = [
    'moto',
    'voiture',
    'taxi',
    'bus',
    'minivan',
    'tricycle'
  ];

  test('contient exactement les 6 types de véhicules URBAN attendus', () => {
    expect(Object.keys(VEHICLE_CONFIG).sort()).toEqual(
      [...expectedVehicles].sort()
    );
  });

  test('contient les propriétés requises pour chaque véhicule', () => {
    for (const type of expectedVehicles) {
      expect(VEHICLE_CONFIG[type]).toEqual(
        expect.objectContaining({
          serviceCode: expect.any(String),
          categoryCode: expect.any(String),
          pricingModel: expect.any(String),
          responseMode: expect.any(String),
          tariffDimensions: expect.any(Object)
        })
      );
    }
  });

  test('conserve les règles tarifaires URBAN attendues', () => {
    expect(VEHICLE_CONFIG.moto).toEqual({
      serviceCode: 'TAXI',
      categoryCode: 'MOTO',
      pricingModel: 'PER_KM',
      responseMode: 'courseNormale',
      tariffDimensions: { modePrestation: 'normal' }
    });

    expect(VEHICLE_CONFIG.voiture).toEqual({
      serviceCode: 'TAXI',
      categoryCode: 'VOITURE',
      pricingModel: 'PER_KM',
      responseMode: 'courseNormale',
      tariffDimensions: { modePrestation: 'normal' }
    });

    expect(VEHICLE_CONFIG.taxi).toEqual({
      serviceCode: 'TAXI',
      categoryCode: 'VOITURE',
      pricingModel: 'PER_KM',
      responseMode: 'courseNormale',
      tariffDimensions: { modePrestation: 'normal' }
    });

    expect(VEHICLE_CONFIG.bus).toEqual({
      serviceCode: 'LOCATION_URBAINE',
      categoryCode: 'BUS',
      pricingModel: 'FIXED',
      responseMode: 'tarifFixe',
      tariffDimensions: {}
    });

    expect(VEHICLE_CONFIG.minivan).toEqual({
      serviceCode: 'LOCATION_URBAINE',
      categoryCode: 'MINIVAN',
      pricingModel: 'FIXED',
      responseMode: 'tarifFixe',
      tariffDimensions: {}
    });

    expect(VEHICLE_CONFIG.tricycle).toEqual({
      serviceCode: 'LOCATION_URBAINE',
      categoryCode: 'TRICYCLE',
      pricingModel: 'FIXED',
      responseMode: 'tarifFixe',
      tariffDimensions: {}
    });
  });
});
