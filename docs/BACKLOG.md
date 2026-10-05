# BACKLOG

## 2.2 — Pricing /public/actions (CLOS)

**Statut :** clos
**Décision :** 2026-09-30 (Phase 2.2)
**Référence :** commit `3006a206`

### Contexte

Le calcul du prix pour `COURSE_REQUEST` / `TAXI_RESERVATION` utilisait
un fallback silencieux à 2000 Ar et ne s'alignait pas sur le moteur V2
de `POST /public/estimate`.

### Correctif livré

Alignement sur `selectServiceTariff` + pipeline V2 → V1 → 404.
Détails complets dans le commit `3006a206`.

### Impact résiduel (archivé)

- Incohérence visible côté client : estimation ≠ prix final.
- Le prix affiché dans `/suivi` ne reflète pas la distance.

### Correctif historique envisagé (archivé)

Utiliser le même moteur que `/public/estimate` :

```js
const tariff = await selectServiceTariff({
  serviceId,
  vehicleCategoryId,
  pricingModel: vehicleConfig.pricingModel,
  dimensions: vehicleConfig.tariffDimensions,
});
```

---

## 2.1.c — Notifications : CLOS SANS ACTION

**Statut :** clos
**Décision :** 2026-09-30 (Phase 2.1.c.0)

### Constat

Le circuit notifications est complet et utilisé en production par
3 fronts :

- **`fleet-driver` (PWA)** : chauffeurs urbains, accept/refuse courses
- **`coop-driver` (PWA)** : chauffeurs coop, idem
- **`admin-next` (Next.js)** : dashboard admin + dashboard flotte
  (urbain et interurbain) avec badge compteur

Routes consommées : `GET /notifications`, `GET /unread-count`,
`PUT /:id/read`, `POST /vehicle-assignment-request`.

### Pourquoi V2 (`dagoos-mobile-v2`) n'est pas concerné

- V2 est un **client passager anonyme** : pas d'auth, pas de `userId`.
- Les notifications ciblent **chauffeurs et managers** (`userId` ou
  `organizationId`).
- **Aucune notification n'est destinée au passager** dans le backend.

Porter `/notifications` vers V2 nécessiterait d'ajouter l'auth à V2,
ce qui est un **chantier d'architecture séparé** (hors 2.1.c).

### Suite possible

Créer une **timeline passager** publique via
`GET /public/suivi/:code/events` (voir chantier 2.4 ci-dessous).

---

## 2.4 — Timeline passager dans /suivi (piste)

**Statut :** ouvert (à préciser)
**Identifié :** 2026-09-30 (Phase 2.1.c.0-d)
**Priorité :** basse (nouvelle fonctionnalité)

### Constat

Le passager V2 n'a pas accès aux notifications, car il s'agit d'un
client anonyme.

Une **timeline** des événements liés à son action pourrait toutefois
être proposée :

- Création de la demande
- Estimation produite
- Offre client envoyée
- Proposition chauffeur reçue
- Acceptation / refus
- Fin de course

### Correctif envisagé

Nouvelle route publique `GET /public/suivi/:code/events` qui liste les
événements dérivés :

- soit des champs existants (`createdAt`, `acceptedAt`, etc.)
- soit d'une nouvelle table `ActionEvent`

### Hors périmètre

Ce chantier est **distinct de 2.1.c**. Il s'agit d'une nouvelle
fonctionnalité pour le passager, pas d'une migration legacy.

---

## 2.5 — Documentation + dette technique (post-2.2)

**Statut :** ouvert
**Identifié :** 2026-10-02 (post-2.2)
**Priorité :** moyenne (dette structurante, pas de bug actif)

### Contexte

Trois points issus du chantier 2.2 n'ont pas été traités à la livraison,
car ils sortaient du périmètre strict du bug pricing. Ils sont
documentés ici pour ne pas être perdus.

### 2.5.1 — Contrat HTTP de POST /public/actions non documenté — livré (`7f33d7b`)

**Constat :**

`POST /api/public/actions` renvoie aujourd'hui trois champs seulement :
`ok` (booléen), `actionId` (string), `codeSuivi` (string).

Il **ne renvoie pas** `prixEstime`, `modePrestation`, `distanceKm`,
ni `commissionPct`. Ces valeurs sont **persistées** dans
`LeadAction.details` et lues via `GET /api/public/suivi/:code`.

**Impact :**

Un futur dev peut supposer à tort que `/public/actions` renvoie le prix
calculé, et coder un client sur un contrat inexistant.

**Action réalisée :**

Création de `docs/API-PUBLIC-CONTRACTS.md`, documentant les contrats
des principales routes publiques :

- `POST /api/public/actions`
- `GET /api/public/suivi/:code`
- `POST /api/public/actions/respond`
- `POST /api/public/estimate`
- `POST /api/public/estimate-location`

Le document précise notamment :

- l'input attendu ;
- l'output réel ;
- les validations et principaux codes d'erreur ;
- le chemin de lecture du prix via `GET /public/suivi/:code` ;
- le pipeline tarifaire V2 → V1 → 404 lorsqu'il s'applique.

**Critère de clôture :**

- `docs/API-PUBLIC-CONTRACTS.md` créé ;
- section `/public/actions` documentée ;
- les principales routes publiques documentées ;
- référence croisée présente dans ce backlog.

### 2.5.2 — Duplication VEHICLE_CONFIG entre /estimate et /actions — livré (`42fc5cec`)

**Constat :**

Le mapping `VEHICLE_CONFIG` (moto/voiture/taxi/bus/minivan/tricycle →
serviceCode / categoryCode / pricingModel / responseMode /
tariffDimensions) est **dupliqué** entre :

- `POST /public/estimate` (bloc historique)
- `POST /public/actions` (bloc ajouté en 2.2)

**Impact :**

Toute évolution du mapping doit être appliquée **deux fois**. Risque de
divergence silencieuse (un véhicule supporté dans un endpoint, oublié
dans l'autre).

**Action envisagée :**

Extraire vers `apps/api/modules/public/vehicle-config.js` :

- source unique du mapping
- consommée par `/estimate` et `/actions`
- tests unitaires sur le mapping

Chantier dédié : section `2.5.x` (à ouvrir ultérieurement).

**Critère de clôture :**

- module `vehicle-config.js` créé et exporté
- `/estimate` et `/actions` l'importent
- aucun mapping inline résiduel
- tests de non-régression : `public.integration.test.js`,
  `public.actions.pricing.test.js` verts

### 2.5.3 — Migration V1 → V2 des organisations restantes — clôturé via 2.5.6

Le chantier historique 2.5.3 identifiait le fallback V1 de
`POST /public/actions` comme dette technique à supprimer après migration
des organisations concernées vers la configuration V2
(`BusinessActivity` + `Service` + `VehicleCategory` + `ServiceTariff`).

La suppression effective du fallback V1 dans `POST /public/actions` a été
traitée et clôturée dans le chantier **2.5.6**.

**Périmètre restant volontairement hors 2.5.6 :**

- `POST /public/estimate-location` conserve son usage V1 existant.
- Les autres consommateurs V1 (`departs`, `finances`, administration des
  `Tarif`) restent actifs et ne sont pas supprimés dans ce chantier.

**Référence :** chantier 2.5.6.

### 2.5.4 — Écart `sanitizeDetails` vs pipeline LONG_HAUL — livré (`e2d1f540`)

**Constat :**

Le pipeline LONG_HAUL écrivait dans `details` 5 champs V2
(`pricingModel`, `estimated`, `price`, `status`, `negotiation`),
mais `sanitizeDetails` les filtrait silencieusement à la persistance
(car hors `ALLOWED_DETAILS_KEYS`). Conséquence observable côté client :
`negotiation` était toujours `null` dans `GET /public/suivi/:code`,
bloquant la détection des négociations dans `Suivi.tsx`
(`dagoos-mobile-v2`).

**Correctif livré :**

Séparation stricte entre :

- l'input client, filtré par `sanitizeDetails` (frontière de sécurité
  inchangée) ;
- les champs internes produits par le pipeline LONG_HAUL, accumulés
  dans une variable `v2Details` puis spread en fin de `details` à la
  création de `LeadAction`.

`sanitizeDetails` et `ALLOWED_DETAILS_KEYS` restent inchangés :
aucun élargissement de la whitelist d'entrée client.

**Tests ajoutés :**

- Test 6 : persistance des 5 champs V2 LONG_HAUL NEGOTIATED.
- Test 7 : exposition correcte via `GET /public/suivi/:code`.
- Test 8 : non-régression LONG_HAUL PER_KM.

**Référence :** commit `e2d1f540`.

**Dette résiduelle (hors périmètre) :**

Le front `Suivi.tsx` ne teste que le statut `PROPOSITION_EN_ATTENTE_CLIENT`,
alors que le backend produit `EN_ATTENTE_TRANSPORTEUR` à la création.
Alignement des statuts à tracer comme chantier séparé.

### 2.5.5 — Alignement des statuts de négociation backend ↔ Suivi.tsx — livré (`959bb5c4`)

**Constat :**

Le backend produit cinq statuts distincts dans `negotiation.status`
(`EN_ATTENTE_TRANSPORTEUR`, `PROPOSITION_EN_ATTENTE_CLIENT`,
`ACCEPTEE`, `REFUSEE`, `EXPIREE`). Le front `Suivi.tsx`
(`dagoos-mobile-v2`) ne testait que `PROPOSITION_EN_ATTENTE_CLIENT`.

Conséquence UX : entre la création d'une demande LONG_HAUL NEGOTIATED
et la première proposition d'un chauffeur, l'écran de suivi n'affichait
**aucun message** sur l'état de la négociation. Le client pouvait croire
que rien ne se passait.

Le backend est sémantiquement correct. L'écart est temporel (deux états
UX à distinguer), pas une incohérence de nom.

**Correctif livré :**

Dans `Suivi.tsx` :

- Nouveau state dérivé `negotiationAwaitingDriver` (`EN_ATTENTE_TRANSPORTEUR`).
- `negotiationPending` conservé (`PROPOSITION_EN_ATTENTE_CLIENT`).
- Bloc UI distinct pour chaque état :
  - en attente → « Votre demande est en attente d'un chauffeur pour la négociation. »
  - proposition reçue → « Le chauffeur vous a proposé X Ar. »
- Condition d'affichage du bloc `Négociation` élargie pour couvrir
  les deux états.

**Périmètre strict :**

- `apps/dagoos-mobile-v2/src/pages/Suivi.tsx` uniquement.
- Aucun changement backend (`pricingModel`, `status`,
  `statutNegociation` inchangés).
- Les fronts V1 mobile et `admin-next` ne sont pas touchés (ils
  utilisent d'autres contrats et ne présentent pas le problème).

**Documentation :**

- Section `GET /public/suivi/:code` de `docs/API-PUBLIC-CONTRACTS.md`
  mise à jour : table des cinq valeurs de `negotiation.status`.
- **Référence :** commit `959bb5c4`.


### 2.5.6 — Suppression du fallback V1 de `POST /public/actions` — livré

**Objectif :**

Finaliser la migration du pricing `COURSE_REQUEST` / `TAXI_RESERVATION`
vers la configuration V2 et supprimer le fallback V1 encore présent dans
`POST /public/actions`.

**Correctif livré :**

- `ServiceTariff` V2 est désormais la seule source tarifaire pour
  `COURSE_REQUEST` / `TAXI_RESERVATION`.
- Si aucun `ServiceTariff` V2 ne correspond à la combinaison
  `Service` + `VehicleCategory` + `pricingModel`, l'API retourne `404`.
- Aucun appel à `prisma.tarif.findUnique` n'est effectué pour ce chemin.
- Une configuration V2 ambiguë continue de produire `500` via
  `AmbiguousTariffError`.
- Les scénarios `LONG_HAUL` existants restent inchangés.

**Tests :**

- `apps/api/tests/public.actions.pricing.test.js`
- 7/7 tests ciblés verts.
- Le test d'absence de `ServiceTariff` vérifie explicitement l'absence
  d'appel au Tarif V1.

**Hors périmètre :**

- `POST /public/estimate-location` conserve son usage V1.
- `CAR_RENTAL` conserve son pricing V1 existant.
- Le modèle `Tarif` et ses trois configurations existantes ne sont pas
  supprimés.
- Les modules `departs`, `finances` et l'administration des tarifs V1
  ne sont pas modifiés.

**Référence :** chantier 2.5.6.
