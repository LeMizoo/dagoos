// ============================================
// MATRICE LONG_HAUL - Source de vérité unique
// ============================================

const LONG_HAUL_VEHICLES_BY_SERVICE = {
  passagers: ['bus', 'minivan'],
  marchandises: ['fourgon', 'camion', 'camion_frigo', 'semi_remorque'],
  demenagement: ['fourgon', 'camion'],
  depannage: ['depanneuse'],
  fret: ['camion', 'semi_remorque']
};

const VALID_LONG_HAUL_SERVICES = Object.keys(LONG_HAUL_VEHICLES_BY_SERVICE);

function isVehicleCompatibleWithService(typeService, typeVehicule) {
  const vehicles = LONG_HAUL_VEHICLES_BY_SERVICE[typeService];
  return Array.isArray(vehicles) && vehicles.includes(typeVehicule);
}

module.exports = {
  LONG_HAUL_VEHICLES_BY_SERVICE,
  VALID_LONG_HAUL_SERVICES,
  isVehicleCompatibleWithService
};
