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
// Suivi — par code (Phase 1 — 1.9.a)
// ------------------------------------------------------------

/**
 * Négociation LONG_HAUL en cours.
 * La structure peut évoluer côté backend.
 */
export interface SuiviNegotiation {
  driverId?: string;
  vehicleId?: string;
  proposedPrice?: number;
  status?: string;
  expiresAt?: string;
  respondedAt?: string;
  respondedBy?: string;
  responseChannel?: string;
  [key: string]: unknown;
}

/**
 * Réponse GET /public/suivi/:code.
 * Le backend expose à la fois les champs V2 et legacy.
 */
export interface SuiviResponse {
  codeSuivi: string;
  statut: string;
  clientNom: string;
  type: string;
  typeService: string | null;
  typeVehicule: string | null;
  depart: string;
  arrivee: string;

  // V2 — tarification
  pricingModel: string | null;
  status: string | null;
  price: number | null;
  estimated: boolean;
  negotiation: SuiviNegotiation | null;

  // Legacy — compatibilité
  prixEstime: number | null;
  offreClient: number | null;
  contreOffreChauffeur: number | null;
  statutNegociation: string | null;

  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Timeline — événements de suivi (Phase 2.4.4.a)
// ------------------------------------------------------------

export interface SuiviEvent {
  id: string;
  type: string;
  actor: string;
  occurredAt: string;
  recordedAt: string;
  payload: Record<string, unknown>;
  partial: boolean;
}

export interface SuiviEventsResponse {
  codeSuivi: string;
  partial: boolean;
  events: SuiviEvent[];
}

// ------------------------------------------------------------
// Course urbaine — types étendus (Phase 1 — 1.6.a)
// ------------------------------------------------------------

/**
 * Mode de mise en relation.
 * Le mode 'proche' (géolocalisation) est reporté en Phase 2.
 */
export type CourseMode = 'choisir' | 'toutes';

/**
 * Corps étendu envoyé à /public/actions pour une COURSE_REQUEST.
 */
export interface CourseRequestDetails {
  depart: string;
  arrivee: string;
  typeVehicule: TypeVehicule;
  mode: CourseMode;
  offreClient?: number;
  [key: string]: unknown;
}

// ------------------------------------------------------------
// Location — estimation et demande (Phase 1 — 1.8)
// ------------------------------------------------------------

export type LocationMode = 'urbain' | 'long_haul';

export type LocationType = 'CAR_RENTAL' | 'LONG_HAUL';

export type LocationTripType = 'A_B' | 'A_B_A' | 'A_B_A_MULTI';

export type LocationFuel = 'AVEC' | 'SANS';

export type LocationService =
  | 'passagers'
  | 'marchandises'
  | 'demenagement'
  | 'depannage'
  | 'fret';

export type LocationVehicle =
  | 'moto'
  | 'voiture'
  | 'bus'
  | 'minivan'
  | 'tricycle'
  | 'fourgon'
  | 'camion'
  | 'camion_frigo'
  | 'semi_remorque'
  | 'depanneuse';

export interface LocationEstimateRequest {
  organizationSlug: string;
  type: LocationType;
  typeVehicule: LocationVehicle;
  typeTrajet?: LocationTripType;
  typeService?: LocationService;
  nbPassagers?: number;
  description?: string;
  depart: string;
  arrivee: string;
  dateAller?: string | null;
  dateRetour?: string | null;
  carburant?: LocationFuel;
}

export interface LocationEstimateResponse {
  distanceKm?: number;
  prixEstime?: number;
  price?: number;
  pricingModel?: string;
  estimated?: boolean;
  status?: string;
  negotiation?: {
    [key: string]: unknown;
  } | null;
  nbJours?: number;
  typeTrajet?: LocationTripType;
  carburant?: LocationFuel;
  type?: LocationType;
  typeVehicule?: LocationVehicle;
  typeService?: LocationService;
  nbPassagers?: number;
  volume?: number;
  error?: string;
}

export interface LocationRequestDetails {
  depart: string;
  arrivee: string;
  typeVehicule: LocationVehicle;
  typeTrajet?: LocationTripType;
  typeService?: LocationService;
  dateAller?: string | null;
  dateRetour?: string | null;
  heureDepart?: string | null;
  heureRetour?: string | null;
  carburant?: LocationFuel;
  nbPassagers?: number;
  description?: string;
  photos?: string[];
}

export interface LocationRequest {
  organizationSlug: string;
  type: LocationType;
  clientNom: string;
  clientTel: string;
  details: LocationRequestDetails;
}

export interface LocationRequestResponse {
  ok?: boolean;
  actionId?: string;
  codeSuivi?: string;
  error?: string;
}

export interface PhotoUploadResponse {
  success?: boolean;
  url?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt?: string;
  error?: string;
}
// ------------------------------------------------------------
// Réservations interurbaines (Phase 1 — 1.7.a)
// ------------------------------------------------------------

/**
 * Place réservée dans un départ (info minimale renvoyée par l'API).
 */
export interface DepartReservation {
  place: string;
}

/**
 * Départ publié par une organisation (bus interurbain).
 * Renvoyé dans le tableau `departs[]` de chaque organisation
 * via GET /public/organizations.
 */
export interface Depart {
  id: string;
  pointDepart: string;
  destination: string;
  date: string;             // ISO date
  heure: string;            // "HH:MM"
  prix: number;
  placesTotal: number;
  statut: string;           // 'PUBLISHED' | 'LEFT' | ...
  reservations?: DepartReservation[];
  /** Nom de l'organisation à laquelle appartient le départ. */
  organizationName?: string;
}

/**
 * Passager pour une place dans une réservation groupée.
 */
export interface ReservationPassenger {
  passagerNom: string;
  place: string;
}

/**
 * Payload POST /public/reservations/batch.
 */
export interface BatchReservationRequest {
  departId: string;
  telephone: string;
  passagers: ReservationPassenger[];
}

/**
 * Réponse POST /public/reservations/batch (succès).
 * Le backend génère un unique code OTP partagé par toutes
 * les réservations de la requête.
 */
export interface BatchReservationResponse {
  ok?: boolean;
  otpCode?: string;
  message?: string;
  reservations?: unknown[];
  error?: string;
  /** Présent en cas d'erreur 409 : places déjà réservées. */
  places?: string[];
}

// ------------------------------------------------------------
// Gestion de réservation par OTP (Phase 2.1.a)
// ------------------------------------------------------------

/**
 * Réservation complète telle qu'exposée par l'API
 * (Prisma Reservation, sans otpHash ni otpExpiresAt côté front).
 *
 * Retournée par POST /public/reservations/manage
 * (lecture des réservations PENDING du client).
 */
export interface ReservationFull {
  id: string;
  departId: string;
  passagerNom: string;
  telephone: string;
  place: string;
  statut: string;             // 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string;          // ISO date
  updatedAt: string;          // ISO date
  /** Départ associé (inclus par /manage via `include: { depart: true }`). */
  depart?: Depart;
}

/**
 * Payload POST /public/reservations/manage.
 *
 * Trois usages, selon les champs présents :
 *   - `{ telephone, passagerNom, otpCode }`
 *     -> lecture : renvoie `{ reservations: ReservationFull[] }`
 *   - `{ ..., action: 'cancel', reservationId }`
 *     -> annulation : renvoie `{ ok: true, message: 'Réservation annulée' }`
 *   - `{ ..., action: 'modify', reservationId, nouvellePlace }`
 *     -> modification de place : renvoie `{ ok: true, message: 'Place modifiée' }`
 */
export interface ManageReservationRequest {
  telephone: string;
  passagerNom: string;
  otpCode: string;
  action?: 'cancel' | 'modify';
  reservationId?: string;
  nouvellePlace?: string;
}

/**
 * Réponse POST /public/reservations/manage.
 *
 * Union selon l'usage :
 *   - lecture : `{ reservations: ReservationFull[] }`
 *   - cancel  : `{ ok: true, message: string }`
 *   - modify  : `{ ok: true, message: string }`
 *   - erreur  : `{ error: string, places?: string[] }`
 *
 * Tous les champs sont optionnels car la réponse varie selon
 * l'action demandée et le code HTTP renvoyé.
 */
export interface ManageReservationResponse {
  reservations?: ReservationFull[];
  ok?: boolean;
  message?: string;
  error?: string;
  places?: string[];
}