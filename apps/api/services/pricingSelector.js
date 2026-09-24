// ============================================================
// PRICING SELECTOR - Selection deterministe de ServiceTariff
// ============================================================
//
// Ce module remplace les findFirst() non deterministes utilises
// dans public.routes.js.
//
// REGLES (voir docs/SERVICE_TARIFF_V2_TARGET_MAP.md) :
//   - Match exact sur les dimensions fournies.
//   - Une dimension NON FOURNIE (undefined) correspond uniquement
//     a NULL en DB.
//   - Une dimension FOURNIE a null filtre sur IS NULL.
//   - Une dimension FOURNIE a une valeur filtre sur egalite exacte.
//   - Le selector NE LIT JAMAIS configuration pour selectionner.
//   - Le selector N'UTILISE PAS excludeFromUnique (colonne d'index).
//   - Match count > 1 -> AmbiguousTariffError.
//   - Match count = 0 -> retourne null.
//   - Match count = 1 -> retourne le tarif.
//
// Reference : docs/O1_PRISMA_POSTGRES_AUDIT.md
// ============================================================

const prisma = require('../lib/prisma');

// ============================================================
// ERREURS
// ============================================================

class AmbiguousTariffError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'AmbiguousTariffError';
    this.context = context;
  }
}

// ============================================================
// SELECTEUR
// ============================================================

/**
 * Selectionne un ServiceTariff unique et deterministe.
 *
 * @param {Object} params
 * @param {string} params.serviceId            - ID du Service (obligatoire)
 * @param {string} params.vehicleCategoryId    - ID du VehicleCategory (obligatoire)
 * @param {string} [params.pricingModel]       - Modele de pricing (optionnel)
 * @param {Object} [params.dimensions]         - Dimensions tarifaires (optionnel)
 * @param {string|null} [params.dimensions.modePrestation]
 * @param {string|null} [params.dimensions.zone]
 * @param {string|null} [params.dimensions.mode]
 * @param {string|null} [params.dimensions.categorie]
 *
 * @returns {Promise<Object|null>} Le ServiceTariff, ou null si aucun match.
 *
 * @throws {AmbiguousTariffError} Si plusieurs tarifs matchent.
 * @throws {Error} Si serviceId ou vehicleCategoryId manque.
 */
async function selectServiceTariff({
  serviceId,
  vehicleCategoryId,
  pricingModel,
  dimensions = {},
}) {
  if (!serviceId) {
    throw new Error('selectServiceTariff: serviceId est obligatoire');
  }

  if (!vehicleCategoryId) {
    throw new Error('selectServiceTariff: vehicleCategoryId est obligatoire');
  }

  const where = {
    serviceId,
    vehicleCategoryId,
    active: true,
    // Par defaut, on exclut les tarifs marques excludeFromUnique = true
    // (MARCHANDISES en quarantaine : voir docs/O1_PRISMA_POSTGRES_AUDIT.md section 7)
    excludeFromUnique: false,
  };

  if (pricingModel !== undefined) {
    where.pricingModel = pricingModel;
  }

  // ----------------------------------------------------------
  // Dimensions :
  // une dimension absente equivaut a NULL en DB.
  // Il n'existe donc aucun wildcard implicite.
  // ----------------------------------------------------------
  where.modePrestation = dimensions.modePrestation ?? null;
  where.zone = dimensions.zone ?? null;
  where.mode = dimensions.mode ?? null;
  where.categorie = dimensions.categorie ?? null;

  const tariffs = await prisma.serviceTariff.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  if (tariffs.length === 0) {
    return null;
  }

  if (tariffs.length > 1) {
    throw new AmbiguousTariffError(
      `Plusieurs tarifs correspondent (${tariffs.length}) pour ` +
      `serviceId=${serviceId}, vehicleCategoryId=${vehicleCategoryId}`,
      {
        serviceId,
        vehicleCategoryId,
        pricingModel: pricingModel ?? null,
        dimensions,
        matchCount: tariffs.length,
        tariffIds: tariffs.map((t) => t.id),
      }
    );
  }

  return tariffs[0];
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  selectServiceTariff,
  AmbiguousTariffError,
};