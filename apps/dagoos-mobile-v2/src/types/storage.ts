// ============================================================
// Storage — Types TypeScript
// Phase 0 — Étape 0.13.3
// ============================================================

/**
 * Informations passager (nom + téléphone).
 */
export interface PassengerInfo {
  name: string;
  phone: string;
}

/**
 * Branding d'organisation tel que stocké.
 * Version minimale pour le storage.
 * Le type Organization complet sera défini dans src/types/organization.ts.
 */
export interface StoredBranding {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  slogan?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Clés de stockage exposées par le wrapper.
 * Note : les clés internes sont préfixées dagoos_v2_.
 */
export type StorageKey =
  | 'passenger_info'
  | 'branding'
  | 'last_code'
  | 'last_otp'
  | 'selected_fleet_slug'
  | 'trip_depart'
  | 'trip_arrivee';
