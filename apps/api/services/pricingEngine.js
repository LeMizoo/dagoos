/**
 * ========================================================
 * MOTEUR DE PRICING V2 - SOURCE DE VÉRITÉ UNIQUE
 * ========================================================
 */

const VALID_PRICING_MODELS = [
  'PER_KM',
  'FIXED',
  'NEGOTIATED',
  'BAREME',
  'PER_DAY'
];

const VALID_CAPACITY_UNITS = ['TONNES', 'M3'];

function arrondirPrix(prix) {
  if (prix <= 0) return 0;
  
  if (prix < 10000) {
    return Math.ceil(prix / 500) * 500;
  } else {
    return Math.ceil(prix / 1000) * 1000;
  }
}

function calculatePrice(serviceTariff, distanceKm, inputs = {}) {
  if (!serviceTariff || !serviceTariff.pricingModel) {
    throw new Error('ServiceTariff invalide');
  }

  if (!VALID_PRICING_MODELS.includes(serviceTariff.pricingModel)) {
    throw new Error(`Modèle tarifaire non supporté: ${serviceTariff.pricingModel}`);
  }

  switch (serviceTariff.pricingModel) {
    case 'PER_KM': {
      const basePrice = Number(serviceTariff.basePrice) || 0;
      const unitPrice = Number(serviceTariff.unitPrice) || 0;
      const nbPassagers = Number(inputs.nbPassagers) || 1;
      const pricingMethod = serviceTariff.configuration?.pricingMethod;

      let price;
      if (pricingMethod === 'PER_PASSENGER_PLUS_DISTANCE') {
        price = (basePrice * nbPassagers) + (distanceKm * unitPrice);
      } else {
        price = basePrice + (distanceKm * unitPrice);
      }

      return {
        pricingModel: 'PER_KM',
        estimated: true,
        price: arrondirPrix(price),
        status: 'ESTIMATED',
        distanceKm,
        currency: 'MGA',
        details: {
          basePrice,
          unitPrice,
          nbPassagers: inputs.nbPassagers ? Number(inputs.nbPassagers) : undefined,
          pricingMethod: pricingMethod || 'VEHICLE_PLUS_DISTANCE'
        }
      };
    }

    case 'FIXED': {
      const price = Number(serviceTariff.basePrice) || 0;

      return {
        pricingModel: 'FIXED',
        estimated: true,
        price,
        status: 'ESTIMATED',
        distanceKm,
        currency: 'MGA',
        details: {
          fixedPrice: price
        }
      };
    }

    case 'NEGOTIATED': {
      return {
        pricingModel: 'NEGOTIATED',
        estimated: false,
        price: null,
        status: 'NEGOTIATION_REQUIRED',
        distanceKm,
        currency: 'MGA',
        negotiation: {
          status: 'EN_ATTENTE_TRANSPORTEUR',
          proposedPrice: null,
          note: null,
          proposedAt: null,
          respondedAt: null
        }
      };
    }

    case 'BAREME': {
      const basePrice = Number(serviceTariff.basePrice) || 0;
      const config = serviceTariff.configuration || {};
      const prixTonne = Number(config.prixTonne) || 0;
      const prixKm = Number(config.prixKm) || Number(serviceTariff.unitPrice) || 0;
      const tonnage = Number(inputs.tonnage) || 0;

      const price = basePrice + (tonnage * prixTonne) + (distanceKm * prixKm);

      return {
        pricingModel: 'BAREME',
        estimated: true,
        price: arrondirPrix(price),
        status: 'ESTIMATED',
        distanceKm,
        currency: 'MGA',
        details: {
          basePrice,
          prixTonne,
          prixKm,
          tonnage,
          zone: config.zone || null
        }
      };
    }

    case 'PER_DAY': {
      const price = Number(serviceTariff.basePrice) || 0;
      const nbJours = Number(inputs.nbJours) || 1;

      return {
        pricingModel: 'PER_DAY',
        estimated: true,
        price: arrondirPrix(price * nbJours),
        status: 'ESTIMATED',
        distanceKm,
        currency: 'MGA',
        details: {
          pricePerDay: price,
          nbJours
        }
      };
    }

    default:
      throw new Error(`Modèle non implémenté: ${serviceTariff.pricingModel}`);
  }
}

function createNegotiation(initialStatus = 'EN_ATTENTE_TRANSPORTEUR') {
  return {
    status: initialStatus,
    proposedPrice: null,
    note: null,
    proposedAt: null,
    respondedAt: null
  };
}

function isPriceAccepted(details) {
  if (!details) return false;

  if (details.pricingModel !== 'NEGOTIATED') {
    return true;
  }

  const negotiation = details.negotiation;
  if (!negotiation) return false;

  return negotiation.status === 'ACCEPTEE' &&
         negotiation.proposedPrice != null &&
         negotiation.proposedPrice > 0;
}

module.exports = {
  calculatePrice,
  createNegotiation,
  isPriceAccepted,
  arrondirPrix,
  VALID_PRICING_MODELS,
  VALID_CAPACITY_UNITS
};
