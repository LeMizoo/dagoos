### Impact

- Incohérence visible côté client : estimation ≠ prix final.
- Le prix affiché dans `/suivi` ne reflète pas la distance.

### Correctif envisagé

Utiliser le même moteur que `/public/estimate` :

```js
const tariff = await selectServiceTariff({
  serviceId,
  vehicleCategoryId,
  pricingModel: vehicleConfig.pricingModel,
  dimensions: vehicleConfig.tariffDimensions,
});

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
