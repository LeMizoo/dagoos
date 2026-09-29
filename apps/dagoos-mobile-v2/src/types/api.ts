// ============================================================
// API — Types TypeScript
// Phase 0 — Étape 0.13.1
// Phase 1 — Étape 1.1 : ajout des types métier
//
// Sources :
//   apps/dagoos-mobile/pages/home.js
//   apps/dagoos-mobile/pages/course.js
//
// Les types propres à reservations.js et location.js seront
// complétés après leurs audits respectifs.
// ============================================================

// ------------------------------------------------------------
// Erreurs et options HTTP (Phase 0)
// ------------------------------------------------------------

/**
 * Erreur API enrichie.
 * Porte le contexte de l'échec (status HTTP, données, endpoint, timeout).
 */
export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  endpoint: string;
  code?: string;
  isTimeout?: boolean;
}

/**
 * Options passées à apiFetch.
 */
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  timeout?: number;
  retry?: boolean;
}

// ------------------------------------------------------------
// Organisation (multi-tenant)
// ------------------------------------------------------------

/**
 * Type d'organisation — détermine le parcours métier.
 * FLEET_MANAGER → urbain (taxi, moto-taxi)
 * Autres valeurs à identifier via reservations.js / location.js
 */
export type OrganizationType = 'FLEET_MANAGER' | string;

/**
 * Plan commercial d'une organisation.
 * L'ordre de priorité dans home.js est :
 *   Premium > Standard > Basic > Freemium
 */
export type OrganizationPlan =
  | 'Premium'
  | 'Standard'
  | 'Basic'
  | 'Freemium'
  | string;

/**
 * Service activé par une organisation.
 * Le champ `typeService` distingue les usages (TAXI, LOCATION, etc.).
 * Structure complète à préciser après audit location/reservations.
 */
export interface OrganizationService {
  service: string;
  [key: string]: unknown;
}

/**
 * Organisation partenaire (flotte ou coopérative).
 * Utilisée par home, course, location, reservations.
 */
export interface Organization {
  id?: number | string;
  slug: string;
  name: string;
  logo?: string;
  type: OrganizationType;
  plan: OrganizationPlan;
  slogan?: string;
  primaryColor?: string;
  secondaryColor?: string;
  organizationServices?: OrganizationService[];
  [key: string]: unknown;
}

// ------------------------------------------------------------
// Course urbaine — estimation
// ------------------------------------------------------------

export type TypeVehicule = 'moto' | 'voiture';

export interface EstimateRequest {
  organizationSlug: string;
  depart: string;
  arrivee: string;
  typeVehicule: TypeVehicule;
}

export interface EstimateResponse {
  prixEstime?: number;
  distanceKm?: number;
  error?: string;
}

// ------------------------------------------------------------
// Actions passager (COURSE_REQUEST, LOCATION_REQUEST, …)
// ------------------------------------------------------------

export type ActionType =
  | 'COURSE_REQUEST'
  | 'LOCATION_REQUEST'
  | 'RESERVATION_REQUEST'
  | string;

export interface ActionPosition {
  lat: number;
  lng: number;
}

/**
 * Détails variables selon le type d'action.
 * Les champs communs sont typés ; le reste est laissé ouvert
 * tant que les audits reservations.js / location.js ne sont
 * pas terminés.
 */
export interface ActionDetails {
  depart?: string;
  arrivee?: string;
  typeVehicule?: TypeVehicule;
  mode?: string;
  position?: ActionPosition;
  offreClient?: number;
  [key: string]: unknown;
}

export interface ActionRequest {
  organizationSlug: string;
  type: ActionType;
  clientNom: string;
  clientTel: string;
  details: ActionDetails;
}

export interface ActionResponse {
  codeSuivi?: string;
  ok?: boolean;
  error?: string;
}

// ------------------------------------------------------------
// Géocodage inverse
// ------------------------------------------------------------

export interface ReverseGeocodeResponse {
  adresse?: string;
}

// ------------------------------------------------------------
// Suivi (placeholder — à préciser après audit suivi.js)
// ------------------------------------------------------------

export interface SuiviResponse {
  [key: string]: unknown;
}