// ============================================================
// Services — Migration du storage legacy → V2
// Phase 1 — Étape 1.3.0
//
// Migration idempotente au boot de la V2.
// Une clé V2 déjà présente n'est jamais écrasée.
// Les clés legacy sont laissées en place (transition douce)..
//
// Lit les clés legacy (sans préfixe) et les copie vers le
// namespace dagoos_v2_* si :
//   1. la clé V2 n'existe pas encore
//   2. la clé legacy existe
//
// Les clés legacy sont LAISSÉES EN PLACE (le legacy peut
// encore tourner pendant la transition).
//
// Aucune donnée d'authentification / session n'est migrée.
// ============================================================

const V2_PREFIX = 'dagoos_v2_';

/**
 * Mapping clé legacy → clé V2 (sans préfixe).
 * Toutes les valeurs sont des chaînes brutes (JSON ou string).
 */
const LEGACY_MAP: Record<string, string> = {
  // Passager
  dagoo_passenger_info: 'passenger_info',
  // Branding organisation
  dagoos_mobile_branding: 'branding',
  // Flotte sélectionnée
  dagoos_selected_fleet_slug: 'selected_fleet_slug',
  // Trajets
  dagoos_trip_depart: 'trip_depart',
  dagoos_trip_arrivee: 'trip_arrivee',
  // Code de suivi
  dagoos_mobile_last_code: 'last_code',
  // Page courante
  dagoos_mobile_page: 'page',
};

/**
 * Clés legacy explicitement EXCLUES de la migration.
 * Sécurité : ne jamais migrer un token, une session,
 * un OTP ou une donnée d'authentification.
 */
const LEGACY_EXCLUDED = [
  'dagoos_mobile_last_otp',
  'dagoos_mobile_token',
  'dagoos_mobile_session',
  'dagoos_mobile_jwt',
];

/**
 * Effectue la migration idempotente.
 *
 * Retourne un objet résumant ce qui a été fait (utile pour
 * les logs de diagnostic).
 */
export function migrateLegacyStorage(): {
  migrated: string[];
  skipped: string[];
  excluded: string[];
} {
  const migrated: string[] = [];
  const skipped: string[] = [];
  const excluded: string[] = [];

  if (typeof window === 'undefined') {
    return { migrated, skipped, excluded };
  }

  try {
    // 1. Vérifier les exclusions (sécurité)
    for (const legacyKey of LEGACY_EXCLUDED) {
      if (window.localStorage.getItem(legacyKey) !== null) {
        excluded.push(legacyKey);
      }
    }

    // 2. Migration des clés mappées
    for (const [legacyKey, v2Suffix] of Object.entries(LEGACY_MAP)) {
      const v2Key = V2_PREFIX + v2Suffix;

      const legacyValue = window.localStorage.getItem(legacyKey);
      const v2Value = window.localStorage.getItem(v2Key);

      // Rien à migrer
      if (legacyValue === null) {
        continue;
      }

      // V2 a déjà une valeur → on ne touche pas
      if (v2Value !== null) {
        skipped.push(legacyKey);
        continue;
      }

      // Migration
      window.localStorage.setItem(v2Key, legacyValue);
      migrated.push(legacyKey);
    }
  } catch (err) {
    console.warn('[storageMigration] échec migration', err);
  }

  return { migrated, skipped, excluded };
}
