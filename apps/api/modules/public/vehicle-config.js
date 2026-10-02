// ============================================================
// VEHICLE_CONFIG — Mapping V1 typeVehicule → V2 (URBAN)
// ============================================================
//
// Source unique utilisée par :
//   - POST /public/estimate          (calcul V2 à la volée)
//   - POST /public/actions           (pipeline V2 → V1 → 404)
//
// Chaque entrée décrit comment résoudre le ServiceTariff V2 pour
// un typeVehicule V1 donné.
//
// Champs :
//   - serviceCode      : Service.code (BusinessActivity URBAN)
//   - categoryCode     : VehicleCategory.code
//   - pricingModel     : 'PER_KM' | 'FIXED'
//   - responseMode     : 'courseNormale' | 'tarifFixe' (modePrestation)
//   - tariffDimensions : dimensions explicites pour selectServiceTariff
// ============================================================

const VEHICLE_CONFIG = {
  moto: {
    serviceCode: 'TAXI',
    categoryCode: 'MOTO',
    pricingModel: 'PER_KM',
    responseMode: 'courseNormale',
    tariffDimensions: { modePrestation: 'normal' }
  },
  voiture: {
    serviceCode: 'TAXI',
    categoryCode: 'VOITURE',
    pricingModel: 'PER_KM',
    responseMode: 'courseNormale',
    tariffDimensions: { modePrestation: 'normal' }
  },
  taxi: {
    serviceCode: 'TAXI',
    categoryCode: 'VOITURE',
    pricingModel: 'PER_KM',
    responseMode: 'courseNormale',
    tariffDimensions: { modePrestation: 'normal' }
  },
  bus: {
    serviceCode: 'LOCATION_URBAINE',
    categoryCode: 'BUS',
    pricingModel: 'FIXED',
    responseMode: 'tarifFixe',
    tariffDimensions: {}
  },
  minivan: {
    serviceCode: 'LOCATION_URBAINE',
    categoryCode: 'MINIVAN',
    pricingModel: 'FIXED',
    responseMode: 'tarifFixe',
    tariffDimensions: {}
  },
  tricycle: {
    serviceCode: 'LOCATION_URBAINE',
    categoryCode: 'TRICYCLE',
    pricingModel: 'FIXED',
    responseMode: 'tarifFixe',
    tariffDimensions: {}
  }
};

module.exports = {
  VEHICLE_CONFIG
};
