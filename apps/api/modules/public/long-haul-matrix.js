// MATRICE LONG_HAUL - Source de vérité unique

const LONG_HAUL_MAPPING = {
  passagers: {
    serviceCode: 'LOCATION_INTERURBAINE',
    vehicleCategories: ['BUS', 'MINIVAN'],
    pricingModel: 'PER_KM',
    vehicles: ['bus', 'minivan']
  },

  marchandises: {
    serviceCode: 'MARCHANDISES',
    vehicleCategories: ['CAMION'],
    pricingModel: 'NEGOTIATED',
    vehicles: ['camion']
  },

  demenagement: {
    serviceCode: 'MARCHANDISES',
    vehicleCategories: ['CAMION'],
    pricingModel: 'NEGOTIATED',
    vehicles: ['camion']
  },

  depannage: {
    serviceCode: 'DEPANNAGE',
    vehicleCategories: ['DEPANNEUSE'],
    pricingModel: 'NEGOTIATED',
    vehicles: ['depanneuse']
  },

  fret: {
    serviceCode: 'FRET',
    vehicleCategories: ['CAMION', 'SEMI_REMORQUE'],
    pricingModel: 'NEGOTIATED',
    vehicles: ['camion', 'semi_remorque']
  }
};

const LONG_HAUL_VEHICLES_BY_SERVICE = Object.fromEntries(
  Object.entries(LONG_HAUL_MAPPING).map(
    ([typeService, config]) => [typeService, config.vehicles]
  )
);

const VALID_LONG_HAUL_SERVICES = Object.keys(LONG_HAUL_MAPPING);

function isVehicleCompatibleWithService(typeService, typeVehicule) {
  const vehicles = LONG_HAUL_VEHICLES_BY_SERVICE[typeService];
  return Array.isArray(vehicles) && vehicles.includes(typeVehicule);
}

module.exports = {
  LONG_HAUL_MAPPING,
  LONG_HAUL_VEHICLES_BY_SERVICE,
  VALID_LONG_HAUL_SERVICES,
  isVehicleCompatibleWithService
};
