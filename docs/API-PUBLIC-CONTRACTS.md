# Contrats API publics

**Dernière mise à jour :** 2026-10-02
**Périmètre :** routes publiques exposées par
`apps/api/modules/public/public.routes.js`
**Style :** contrat technique (input, output, validations, erreurs).
Ce document décrit le comportement **réellement implémenté**.

---

## Vue d'ensemble

| Route | Méthode | Rôle |
|---|---|---|
| `/api/public/actions` | POST | Créer une demande depuis la landing |
| `/api/public/suivi/:code` | GET | Consulter l'état d'une demande |
| `/api/public/actions/respond` | POST | Répondre à une proposition LONG_HAUL NEGOTIATED |
| `/api/public/estimate` | POST | Estimer un prix URBAN |
| `/api/public/estimate-location` | POST | Estimer un prix LONG_HAUL / CAR_RENTAL |

**Rate limiting :** les routes `/actions`, `/contact` et `/reverse-geocode`
sont protégées par `publicLeadLimiter`.

**Authentification :** aucune route publique n'utilise de JWT.
L'accès à une demande se fait via `codeSuivi` (+ `clientTel` pour
`/actions/respond`).

---

## POST /api/public/actions

Créer une demande depuis la landing (course, location, long-courrier,
contact).

### Input

```json
{
  "organizationSlug": "string (optionnel selon type)",
  "type": "string (obligatoire)",
  "clientNom": "string",
  "clientTel": "string",
  "details": "object (obligatoire selon type)"
}
```

**Types valides :**

- `COURSE_REQUEST`
- `TAXI_RESERVATION`
- `PASSENGER_RESERVATION`
- `DELIVERY_REQUEST`
- `CARGO_RESERVATION`
- `CAR_RENTAL`
- `LONG_HAUL`
- `CONTACT`

**Types requérant `details` (objet non vide) :**

- `LONG_HAUL`
- `COURSE_REQUEST`
- `TAXI_RESERVATION`
- `CAR_RENTAL`
- `DELIVERY_REQUEST`

**Règle `organizationSlug` :**

- Optionnel pour : `CONTACT`, `LONG_HAUL`, `CAR_RENTAL`,
  `COURSE_REQUEST`, `TAXI_RESERVATION`.
- **Requis** pour tous les autres types valides.

**Format `clientNom` :** chaîne normalisée NFC, trim, 2 à 100 caractères.

**Format `clientTel` :** chaîne normalisée NFC, trim, sans espaces,
regex `^(?:\+261|0)[0-9]{8,11}$`.

**Clés autorisées dans `details`** (toute autre clé est ignorée) :

- `typeService`, `typeVehicule`, `depart`, `arrivee`
- `nbPassagers`, `volume`, `dateAller`, `dateRetour`
- `carburant`, `typeTrajet`, `offreClient`
- `type`, `mode`, `position`
- `date`, `heure`, `priseEnCharge`, `destination`
- `message`, `description`
- `photos`, `heureDepart`, `heureRetour`

### Output (201)

```json
{
  "ok": true,
  "actionId": "cuid",
  "codeSuivi": "DG-XXXX"
}
```

**Important :** le prix calculé n'est **pas** renvoyé par cette route.
Il est persisté dans `LeadAction.details` et doit être lu via
`GET /api/public/suivi/:code`.

### Pipeline tarifaire (backend uniquement)

Le prix est calculé côté backend selon le `type` :

- `COURSE_REQUEST` / `TAXI_RESERVATION` :
  - V2 via `ServiceTariff` + `VEHICLE_CONFIG` (URBAN).
  - Aucun fallback V1 : `Tarif` n'est pas utilisé pour ce pricing.
  - Erreur 404 si aucun `ServiceTariff` V2 n'est configuré pour la
    combinaison demandée.
  - Erreur 500 si configuration V2 ambiguë (`AmbiguousTariffError`).
- `CAR_RENTAL` :
  - V1 uniquement (`Tarif.vehiculeTarifs[cle].location` ou
    `tarifFixe`).
  - Erreur 400 si `Tarif` absent, 404 si aucun calcul possible.
- `LONG_HAUL` :
  - Moteur V2 `pricingEngine` (`PER_KM`, `FIXED`, `NEGOTIATED`,
    `BAREME`, `PER_DAY`).
  - L'organisation de référence est `org` ou la première organisation
    compatible trouvée par matching automatique.

### Champs persistés dans `LeadAction.details`

Après création, `details` contient :

- Toutes les clés autorisées de l'input (via `sanitizeDetails`).
- `distanceKm` (number)
- `prixEstime` (number)
- `modePrestation` (string : `courseNormale` | `tarifFixe` |
  `location` | `negociation` | `long_haul`)
- `commissionPct` (number)
- `nbJours` (number, uniquement pour `CAR_RENTAL` et `LONG_HAUL`)
- `offreClient` (number|null)
- `codeSuivi` (string, format `DG-XXXX`)
- `statutNegociation` (`OFFRE_CLIENT` | `PRIX_SUGGERE`)

### Écart documenté — LONG_HAUL et `sanitizeDetails`

Le pipeline LONG_HAUL écrit dans `details` :

```js
details.pricingModel = pricingResult.pricingModel;
details.estimated     = pricingResult.estimated;
details.price         = pricingResult.price;
details.status        = pricingResult.status;
details.negotiation   = pricingResult.negotiation || null;
```

Or ces 5 clés **ne figurent pas** dans `ALLOWED_DETAILS_KEYS`.
`sanitizeDetails` les **filtre donc silencieusement** à la persistance.

**Conséquence observée :** pour une demande LONG_HAUL, les champs
`pricingModel`, `estimated`, `price`, `status` et `negotiation` ne
sont **pas persistés** dans `LeadAction.details`.

À la lecture (`GET /public/suivi/:code`), ils sont **reconstruits**
avec des valeurs dérivées (`status='ESTIMATED'`, `estimated=true`,
`price=prixEstime`), et `negotiation` reste `null`.

Ce comportement est **documenté tel quel**. Aucune correction n'est
apportée dans cette version.

### Codes d'erreur

| HTTP | Condition | Réponse |
|---|---|---|
| 400 | `type` manquant ou non-string | `{ error: "Champ type requis" }` |
| 400 | `clientNom` invalide | `{ error: "clientNom invalide (2-100 caractères attendus)" }` |
| 400 | `clientTel` invalide | `{ error: "clientTel invalide (format attendu : 03XXXXXXXX ou +261XXXXXXXXX)" }` |
| 400 | `details` non-objet | `{ error: "details doit être un objet JSON" }` |
| 404 | `organizationSlug` introuvable | `{ error: "Organisation introuvable" }` |
| 400 | `organizationSlug` requis mais absent | `{ error: "organisationSlug requis pour ce type" }` |
| 400 | `type` invalide | `{ error: "Type invalide" }` |
| 400 | `details` manquant pour type le requérant | `{ error: "details est obligatoire pour le type X" }` |
| 400 | `details` vide pour type le requérant | `{ error: "details ne peut pas être vide pour le type X" }` |
| 400 | `typeVehicule` invalide (COURSE/TAXI) | `{ error: "Type de véhicule invalide: X" }` |
| 400 | Distance non calculable | `{ error: "Impossible de déterminer la distance..." }` |
| 404 | `ServiceTariff` V2 absent (COURSE/TAXI) | `{ error: "Tarif V2 non configure pour X sur Y" }` |
| 500 | Configuration V2 ambiguë | `{ error: "Configuration tarifaire ambigue pour cette combinaison" }` |
| 400 | Tarif location absent (CAR_RENTAL) | `{ error: "Tarif non configuré pour cette organisation" }` |
| 400 | `typeVehicule` incompatible LONG_HAUL | `{ error: "Véhicule X incompatible avec le service Y" }` |
| 404 | Aucune organisation compatible LONG_HAUL | `{ error: "Aucune organisation compatible pour X/Y" }` |
| 500 | Erreur interne non gérée | `{ error: "Erreur serveur" }` |

---

## GET /api/public/suivi/:code

Consulter l'état d'une demande à partir de son `codeSuivi`.

### Input

- Path param : `code` (format `DG-XXXX`).

### Output (200)

```json
{
  "codeSuivi": "DG-XXXX",
  "statut": "NEW | ACCEPTED | REJECTED | ...",
  "clientNom": "string",
  "type": "COURSE_REQUEST | TAXI_RESERVATION | ...",
  "typeService": "string|null",
  "typeVehicule": "string|null",
  "depart": "string",
  "arrivee": "string",
  "photos": ["url1", "url2"],
  "pricingModel": "PER_KM | FIXED | NEGOTIATED | null",
  "status": "ESTIMATED | NEGOTIATION_REQUIRED | ...",
  "price": "number|null",
  "estimated": "boolean",
  "negotiation": "object|null",
  "prixEstime": "number|null",
  "offreClient": "number|null",
  "contreOffreChauffeur": "number|null",
  "statutNegociation": "string|null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

**Champs dérivés** (calculés à la lecture si absents de `details`) :

- `status` : `details.status` si présent, sinon `'ESTIMATED'` si
  `details.prixEstime` est défini, sinon `null`.
- `price` : `details.price` si défini, sinon `details.prixEstime`,
  sinon `null`.
- `estimated` : `details.estimated` si défini, sinon
  `!!details.prixEstime`.

**C'est cette route qui expose le prix au client.**

### Négociation LONG_HAUL — valeurs de `negotiation.status`

`negotiation` est non-null uniquement pour les demandes LONG_HAUL dont
le `pricingModel` est `NEGOTIATED`.

Le champ `negotiation.status` prend **cinq valeurs** distinctes :

| Valeur | Signification | Émetteur |
|---|---|---|
| `EN_ATTENTE_TRANSPORTEUR` | Demande créée, aucun chauffeur n'a encore proposé | `POST /public/actions` |
| `PROPOSITION_EN_ATTENTE_CLIENT` | Un chauffeur a proposé un prix, en attente de réponse client | `POST /actions/:id/propose` |
| `ACCEPTEE` | Le client a accepté la proposition | `POST /public/actions/respond` |
| `REFUSEE` | Le client a refusé la proposition | `POST /public/actions/respond` |
| `EXPIREE` | Proposition expirée (TTL 48h, expiration paresseuse) | `POST /public/actions/respond` |

**Ne pas confondre :**

- `status` (top-level) : état du **pricing** (`ESTIMATED` |
  `NEGOTIATION_REQUIRED`).
- `negotiation.status` : état de la **négociation** elle-même.
- `statutNegociation` (legacy) : état du flux d'offre client
  (`PRIX_SUGGERE` | `OFFRE_CLIENT`).

**Consommation côté client :**

Les deux états qui concernent l'UX avant décision finale sont :

- `EN_ATTENTE_TRANSPORTEUR` → afficher « recherche d'un chauffeur ».
- `PROPOSITION_EN_ATTENTE_CLIENT` → afficher « proposition reçue ».

Les trois autres (`ACCEPTEE`, `REFUSEE`, `EXPIREE`) sont des états
terminaux.

### Codes d'erreur

| HTTP | Condition | Réponse |
|---|---|---|
| 400 | `code` manquant | `{ error: "Code requis" }` |
| 404 | Aucune `LeadAction` ne correspond | `{ error: "Demande introuvable" }` |
| 500 | Erreur interne | `{ error: <message> }` |

---

## POST /api/public/actions/respond

Répondre à une proposition LONG_HAUL NEGOTIATED.
Authentification publique : `codeSuivi` + `clientTel`.
Le client **ne fournit jamais** le prix — celui-ci provient
exclusivement de `negotiation.proposedPrice`.

### Input

```json
{
  "codeSuivi": "DG-XXXX",
  "clientTel": "03XXXXXXXX",
  "decision": "ACCEPTEE | REFUSEE"
}
```

### Output (200)

Pour `REFUSEE` :

```json
{ "ok": true, "status": "REFUSEE" }
```

Pour `ACCEPTEE` :

```json
{
  "ok": true,
  "status": "ACCEPTEE",
  "courseId": "cuid|null"
}
```

### Validations serveur

1. `codeSuivi`, `clientTel` et `decision` obligatoires (string non vides).
2. `decision` ∈ `['ACCEPTEE', 'REFUSEE']` (insensible à la casse).
3. La `LeadAction` doit exister, être de `type: 'LONG_HAUL'` et
   avoir `details.pricingModel === 'NEGOTIATED'`.
4. `action.clientTel === clientTel` (second facteur).
5. `details.negotiation.status === 'PROPOSITION_EN_ATTENTE_CLIENT'`.
6. Revalidation complète :
   - `driver` existe, actif, rattaché à la même organisation.
   - `driver.vehicleId === negotiation.vehicleId`.
   - `driver.vehicle.organizationId === driver.organizationId`.
   - Compatibilité `typeService` / `typeVehicule` via `LONG_HAUL_MAPPING`.
   - `vehicle.type === typeVehicule`.
7. Transaction atomique :
   - Verrou optimiste via `updatedAt`.
   - Écriture de `statut`, `details.negotiation`, création `Course` si
     acceptation.

### Effets de bord

- Notification du chauffeur (`notification.create`, non bloquant).
- Fermeture des notifications liées (`notification.updateMany`).

### Codes d'erreur

| HTTP | Condition |
|---|---|
| 400 | Champs manquants / `decision` invalide |
| 404 | `codeSuivi` introuvable |
| 403 | `clientTel` incorrect, chauffeur inactif, véhicule changé |
| 409 | Proposition expirée, déjà répondue, modifiée, concurrence |
| 500 | Erreur interne |

---

## POST /api/public/estimate

Estimation URBAN à la volée. Source tarifaire : V2 (`ServiceTariff`).
**Aucun fallback V1.**

### Input

```json
{
  "organizationSlug": "string",
  "depart": "string",
  "arrivee": "string",
  "typeVehicule": "moto | voiture | taxi | bus | minivan | tricycle"
}
```

### Output (200)

```json
{
  "distanceKm": 12.5,
  "prixEstime": 8000,
  "modePrestation": "courseNormale | tarifFixe"
}
```

### Codes d'erreur

| HTTP | Condition |
|---|---|
| 400 | `organizationSlug`, `depart` ou `arrivee` manquant |
| 404 | Organisation introuvable |
| 400 | Distance non calculable |
| 400 | `typeVehicule` invalide |
| 404 | `BusinessActivity URBAN` non configurée |
| 404 | `Service` V2 non configuré |
| 404 | `VehicleCategory` V2 introuvable |
| 404 | `ServiceTariff` V2 absent |
| 500 | Configuration V2 ambiguë ou invalide |
| 500 | Modèle tarifaire non supporté |

---

## POST /api/public/estimate-location

Estimation LONG_HAUL ou CAR_RENTAL à la volée.

### Input

```json
{
  "organizationSlug": "string",
  "type": "LONG_HAUL | CAR_RENTAL",
  "typeVehicule": "string",
  "typeTrajet": "A_B | A_B_A | A_B_A_MULTI",
  "typeService": "passagers | marchandises | demenagement | depannage | fret",
  "nbPassagers": "number",
  "volume": "number",
  "depart": "string",
  "arrivee": "string",
  "dateAller": "string|null",
  "dateRetour": "string|null",
  "carburant": "AVEC | SANS"
}
```

### Output — LONG_HAUL

```json
{
  "distanceKm": 350,
  "pricingModel": "PER_KM | FIXED | NEGOTIATED | BAREME | PER_DAY",
  "estimated": true,
  "price": 250000,
  "status": "ESTIMATED | NEGOTIATION_REQUIRED",
  "currency": "MGA",
  "negotiation": "object|null",
  "type": "LONG_HAUL",
  "typeVehicule": "bus",
  "typeService": "passagers",
  "nbPassagers": 10,
  "volume": null
}
```

### Output — CAR_RENTAL

```json
{
  "distanceKm": 45,
  "prixEstime": 180000,
  "nbJours": 1,
  "typeTrajet": "A_B",
  "carburant": "AVEC"
}
```

### Codes d'erreur

| HTTP | Condition |
|---|---|
| 400 | `organizationSlug`, `depart` ou `arrivee` manquant |
| 400 | `typeTrajet` manquant pour CAR_RENTAL |
| 404 | Organisation introuvable |
| 400 | Distance non calculable |
| 404 | `Tarif` V1 absent |
| 404 | LONG_HAUL : `BusinessActivity INTERURBAN` absente |
| 404 | LONG_HAUL : `Service` V2 absent |
| 404 | LONG_HAUL : `VehicleCategory` V2 introuvable |
| 404 | LONG_HAUL : `ServiceTariff` V2 absent |
| 404 | CAR_RENTAL : aucune configuration location / tarif fixe |
| 400 | LONG_HAUL : `typeService` ou `typeVehicule` invalide |
| 500 | Erreur interne |

---

## Références

- **Code source :** `apps/api/modules/public/public.routes.js`
- **Mapping véhicules :** `apps/api/modules/public/vehicle-config.js`
- **Matrice LONG_HAUL :** `apps/api/modules/public/long-haul-matrix.js`
- **Backlog :** `docs/BACKLOG.md` (section 2.5.1)
- **Tests :**
  - `apps/api/tests/public.actions.pricing.test.js`
  - `apps/api/tests/public.integration.test.js`
  - `apps/api/tests/vehicle-config.test.js`
