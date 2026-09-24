# SERVICE TARIFF V2 — TARGET MAP

**Projet :** Dagoos / Dago Mobility
**Phase :** 4 — Cartographie technique
**Statut :** Référence technique (aucune modification de code)
**Prérequis :** SERVICE_TARIFF_V2_ARBITRAGE.md v1.0 validé

---

## 1. Objet

Ce document est le plan technique de référence pour la mise en œuvre de la cible V2 définie en Phase 3.

Il précise, fichier par fichier :
- le rôle cible ;
- les modifications nécessaires ;
- les risques ;
- les tests requis.

**Aucun code n est modifié dans ce document.** C est la feuille de route pour la Phase 5 (implémentation).

---

## 2. Constats Phase 4

### 2.1 Dimensions réelles observées (34 tarifs actifs)

| Service | Dimension(s) réelle(s) | Variantes |
|---|---|---|
| **TAXI** | modePrestation (implicite via PER_KM / NEGOTIATED) | normal, adyVarotra |
| **LOCATION_URBAINE** | aucune | — |
| **LIVRAISON** | zone + mode | 4 combinaisons |
| **TRANSPORT_COMMUN** | zone | regionale, nationale |
| **MARCHANDISES** | AMBIGU — 2 tarifs identiques en clé | À résoudre (M3) |
| **FRET** | VehicleCategory | CAMION, SEMI_REMORQUE |
| **DEPANNAGE** | aucune | — |
| **LOCATION_INTERURBAINE** | aucune | — |
| **LOCATION_VOITURE** | categorie | touristique, familiale, autres |

### 2.2 Anomalie critique — M3

MARCHANDISES + CAMION + NEGOTIATED + MARCHANDISES_GENERALES existe deux fois :
- 20000 base / 2500 unit
- 10000 base / 1500 unit

match count = 2 → **V2 non-déterministe** → V2 inéligible pour ce service.

Règle : ne jamais déduire une dimension à partir de basePrice ou unitPrice.

### 2.3 configuration — deux usages distincts

| Usage | Traitement cible |
|---|---|
| Dimension de sélection (zone, mode, categorie, modePrestation) | Colonnes explicites |
| Paramètre de calcul (forfaitService, prixKm, pricingMethod, note, type) | Reste dans configuration |

Règle stricte : **le selector ne lit JAMAIS configuration pour sélectionner un tarif.**

---

## 3. Architecture cible

RÉFÉRENTIEL PLATEFORME (SUPER_ADMIN)
├── VehicleCategory global
├── Catalogue Service global
└── Pricing Models

ORGANISATION (FLEET_MANAGER / COOP_MANAGER)
├── BusinessActivity
├── Services activés
└── ServiceTariff (dimensions explicites)

MOTEUR DÉTERMINISTE
└── selectServiceTariff(...)
    RÈGLE : match count == 1 obligatoire

PRICING ENGINE (calcul pur)
└── calculatePrice(serviceTariff, distanceKm, inputs)

PARCOURS MÉTIER
└── estimate / estimate-location / actions

---

## 4. Correction C1 — Permissions V2 restreintes

serviceTariffs.read ne doit PAS être donné à tous les rôles.

| Rôle | serviceTariffs.read | serviceTariffs.manage | serviceCatalog.read | serviceCatalog.manage | vehicleCategories.read | vehicleCategories.manage |
|---|---|---|---|---|---|---|
| SUPER_ADMIN | OK | OK | OK | OK | OK | OK |
| ADMIN | à arbitrer | à arbitrer | à arbitrer | à arbitrer | à arbitrer | à arbitrer |
| FLEET_MANAGER | OK | OK | OK | NON | OK | NON |
| COOP_MANAGER | OK | OK | OK | NON | OK | NON |
| DRIVER | NON | NON | NON | NON | NON | NON |

Règle C2 : ADMIN ne reçoit AUCUNE permission V2 tant que son rôle métier n est pas explicitement arbitré.

---

## 5. Correction C3 — Sémantique stricte des dimensions

Règle fondamentale : dimension absente != dimension NULL != wildcard.

Signature du selector :

selectServiceTariff({
  serviceId: string,
  vehicleCategoryId: string,
  pricingModel?: PricingModel,
  dimensions: {
    modePrestation?: normal | adyVarotra,
    zone?: regionale | nationale,
    mode?: courseNormale | courseExpress,
    categorie?: touristique | familiale | autres,
  }
}) → ServiceTariff | null

Comportement :

| Cas | Résultat |
|---|---|
| Dimensions fournies != dimensions en base | Pas de match |
| Dimension non fournie ET absente en base (NULL) | Match possible |
| Dimension non fournie MAIS présente en base | PAS de match (pas de wildcard) |
| Match exact 1 | Retourne le tarif |
| Match > 1 | AmbiguousTariffError |
| Match 0 | Retourne null |

Conséquence : TAXI + MOTO + PER_KM ne matche PAS TAXI + MOTO + NEGOTIATED.

---

## 6. Correction C4 — configuration interdite en sélection

Le selector ne lit JAMAIS configuration pour déterminer le tarif.

| Champ configuration | Usage |
|---|---|
| configuration.forfaitService | Paramètre de calcul |
| configuration.prixKm | Paramètre de calcul |
| configuration.pricingMethod | Paramètre de calcul |
| configuration.note | Descriptif |
| configuration.type | Descriptif |
| configuration.zone | INTERDIT en sélection |
| configuration.mode | INTERDIT en sélection |
| configuration.categorie | INTERDIT en sélection |

Garde-fou : documenter dans le code que configuration est opaque au selector.

---

## 7. Correction C5 — Séparation service-catalog / service-tariffs

| Module | Responsabilité |
|---|---|
| service-catalog.routes.js | Référentiel plateforme : Service global, VehicleCategory global |
| service-tariffs.routes.js | Configuration organisationnelle : BusinessActivity, services activés, ServiceTariff |

Décision : Phase 5 ne crée que service-tariffs.routes.js. service-catalog.routes.js est différé tant qu aucun besoin d écriture catalogue n est avéré. Interdiction de mélanger les responsabilités.

---

## 8. Correction C6 — organizations.routes.js en lecture seule

organizations.routes.js reste en lecture seule pour la V2. GET /:id/config est conservé tel quel pour compatibilité avec organization-context.tsx. Aucune nouvelle écriture V2 ne doit être introduite dans ce fichier.

Les écritures V2 sont implémentées EXCLUSIVEMENT dans les nouveaux modules dédiés.

Objectif : éviter que organizations.routes.js devienne un module fourre-tout.

---

## 9. Cartographie fichier par fichier

### 9.1 Backend

#### apps/api/prisma/schema.prisma
- Rôle actuel : modèle V2 (BusinessActivity, Service, VehicleCategory, ServiceTariff)
- Modification cible : ajouter dimensions explicites sur ServiceTariff
- Option retenue : O1 (colonne explicite) SOUS RÉSERVE de l audit PostgreSQL/Prisma
- Risques : migration 34 tarifs ; compatibilité findFirst
- Tests : contrainte unicité ; sélection déterministe

#### apps/api/modules/service-tariffs/service-tariffs.routes.js (à créer)
- Rôle : module dédié V2 CRUD ServiceTariff + dimensions
- Routes cibles : GET /organizations/:id/service-tariffs ; POST ; PUT ; DELETE (désactivation)
- Permissions : serviceTariffs.read / serviceTariffs.manage
- Isolation : canAccessOrganization obligatoire
- Tests : isolation multi-tenant ; détection d ambiguïté

#### apps/api/modules/service-catalog/service-catalog.routes.js (différé)
- Rôle : référentiel plateforme (Service global, VehicleCategory global)
- Création : différée tant qu aucun besoin d écriture n est avéré
- Ne pas mélanger avec service-tariffs

#### apps/api/modules/organizations/organizations.routes.js
- Rôle actuel : GET /:id/config lit la V2
- Modification cible : aucune écriture V2. Rester en lecture seule
- Risques : ne pas casser organization-context.tsx

#### apps/api/security/permissions.js
- Ajouter : SERVICE_TARIFFS_READ, SERVICE_TARIFFS_MANAGE, SERVICE_CATALOG_READ, SERVICE_CATALOG_MANAGE, VEHICLE_CATEGORIES_READ, VEHICLE_CATEGORIES_MANAGE

#### apps/api/security/roles.js
- Voir section 4 (corrections C1, C2)

#### apps/api/security/authorization.js
- Aucune modification (mécanisme correct)

#### apps/api/services/pricingSelector.js (à créer)
- Signature : selectServiceTariff({ serviceId, vehicleCategoryId, dimensions })
- Règle : match count == 1 obligatoire
- Erreur : AmbiguousTariffError si > 1 ; null si 0
- Interdiction : lire configuration

#### apps/api/services/pricingEngine.js
- Inchangé (calcul pur)

#### apps/api/modules/public/public.routes.js
- Remplacer les 3 findFirst V2 par pricingSelector.selectServiceTariff
- Tests : chaque parcours V2

#### apps/api/modules/public/long-haul-matrix.js
- Inchangé (matrice LONG_HAUL reste source de vérité)

#### apps/api/modules/tarifs/tarifs.routes.js
- Inchangé pendant transition (V1 continue)

### 9.2 Frontend

#### admin-next/src/lib/organization-context.tsx
- Étendre getTariff pour accepter un objet dimensions
- Nouveau type TariffDimensions { modePrestation?, zone?, mode?, categorie? }
- Risques : rétrocompatibilité

#### admin-next/src/app/flotte/settings/page.tsx
- Inchangé pendant transition. Ajouter un onglet Tarifs V2 quand V2 prête

#### admin-next/src/app/dashboard/settings/page.tsx
- Ajouter groupe Référentiel ou onglet dédié :
  - VehicleCategory (lecture + édition si nécessaire)
  - Catalogue Service (référentiel plateforme)

#### admin-next/src/components/settings/ServiceTariffsEditor.tsx (à créer)
- UI d édition V2 par organisation
- API : /organizations/:id/service-tariffs

### 9.3 Migration

#### apps/api/scripts/migrate-service-tariffs.mjs (à créer)
- Migration des 34 tarifs existants
- Étapes : dry-run, rapport d ambiguïtés, résolution M3, migration transactionnelle, rollback
- Risques : perte de données si mal exécuté

---

## 10. Correction C7 — Décision O1/O2/O3/O4

| Option | Statut | Justification |
|---|---|---|
| O2 (table dimensions) | Écarté | Complexité disproportionnée pour 4 dimensions |
| O4 (JSON typé) | Écarté | Reproduit le problème actuel |
| O3 (dimensionKey) | Fallback | Déplace la structure dans une string |
| O1 (colonnes explicites) | CANDIDAT PRINCIPAL | Lisible, déterministe, adapté |

Réserve O1 : @@unique composé avec colonnes nullable ne garantit PAS l unicité métier en PostgreSQL (NULL != NULL).

Décision : O1 retenu SOUS RÉSERVE d un mini-audit technique PostgreSQL/Prisma pour déterminer la stratégie d unicité fiable (index partiels, colonne calculée, contrainte conditionnelle).

---

## 11. M3 — Blocage explicite

MARCHANDISES + CAMION + NEGOTIATED + MARCHANDISES_GENERALES existe deux fois.

match count = 2 → V2 inéligible pour ce service.

Règles :
- Ne pas déduire une dimension à partir de basePrice / unitPrice
- Ne pas activer V2 pour MARCHANDISES
- Documenter le blocage comme service-level

Aucune tentative d activation avant résolution métier.

---

## 12. Séquence d implémentation

ÉTAPE 0 — Décision O1 (après mini-audit PostgreSQL/Prisma)
ÉTAPE 1 — Résolution M3 (ou blocage confirmé)
ÉTAPE 2 — Modifier schema.prisma
ÉTAPE 3 — Créer pricingSelector.js + tests unitaires
ÉTAPE 4 — Créer service-tariffs.routes.js + permissions + rôles
ÉTAPE 5 — Basculer estimate / estimate-location / actions
ÉTAPE 6 — Frontend : organization-context.tsx + ServiceTariffsEditor.tsx
ÉTAPE 7 — Migration données (dry-run + validation)
ÉTAPE 8 — Bascule progressive V1 → V2 par parcours

---

## 13. Tests requis

### Backend
- Sélection déterministe (match == 1)
- Ambiguïté (AmbiguousTariffError si > 1)
- Absence (null si 0)
- Isolation org (FLEET A → org B → 403)
- SUPER_ADMIN global
- Manager organisationnel
- Chaque pricing model (5)
- Chaque dimension (4)
- Divergence V1/V2 (détection)
- Non-régression V1

### Frontend
- Chargement config V2
- Édition tarifs V2
- Isolation UI
- Référentiel SUPER_ADMIN
- Rétrocompatibilité getTariff

### Migration
- Dry-run sans écriture
- Migration 34 tarifs sans perte
- Rollback possible
- Rapport MARCHANDISES

---

## 14. Risques et mitigations

| # | Risque | Impact | Mitigation |
|---|---|---|---|
| R1 | Casser les findFirst existants | Régression | Tests automatisés avant bascule |
| R2 | Migration incomplète | Perte de tarifs | Dry-run + backup + transaction |
| R3 | Contrainte unique rejette données | Blocage | Diagnostic préalable |
| R4 | M3 non résolu | Service bloqué | Documentation + blocage activation |
| R5 | Régression V1 | Perte fonctionnelle | V1 non modifié |
| R6 | Frontend casse isolation | Faille sécurité | Tests E2E cross-org |

---

## 15. Critère de sortie Phase 4

- Constat technique documenté
- Architecture cible définie
- Cartographie fichier par fichier
- Tests identifiés
- Risques documentés
- C1-C7 intégrées
- M3 bloqué explicitement
- O1 candidat principal avec réserve
- Mini-audit O1 produit et O1 figé

---

## 16. Prochaine étape — Phase 5

Implémentation fichier par fichier, dans l ordre de la séquence section 12.

Chaque fichier suit la méthode éprouvée : audit, commande de modification, typecheck, test, commit.

---

## Statut du document

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | Référence technique corrigée |
| Bloqué par | Mini-audit O1 + résolution M3 |
| Portée | Phase 5 |

Phase 4 — Terminée sous réserve mini-audit O1 et résolution M3.
