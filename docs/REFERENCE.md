# DAGOO'S MOBILITY — Référence technique

Document de référence pour l'architecture, les conventions et la dette technique du projet.

---

## Historique

- **Point de référence stable historique** : commit `d250ff9` — « feat: finalisation flotte et demandes LONG_HAUL »

---

## Dette technique — coexistence V1 / V2

### Modèle `Tarif` (V1) vs `ServiceTariff` (V2)

Deux systèmes tarifaires coexistent en production.

#### `Tarif` (V1) — modèle global par organisation

- **Défini dans** : `apps/api/prisma/schema.prisma` (modèle `Tarif`)
- **Routes** : `apps/api/modules/tarifs/tarifs.routes.js`
  - `GET /tarifs/:organizationId`
  - `PUT /tarifs/:organizationId`
- **Édité par** : `admin-next/src/app/flotte/settings/page.tsx`
- **Lu par** : `public.routes.js` pour les cours classiques et le calcul de commission
  - `public.routes.js:1320` — calcul cours classique
  - `public.routes.js:1721-1725` — commission chauffeur
  - `public.routes.js:1796-1806` — location

Champs principaux : `prixBase`, `prixKm`, `locationJournalier`,
`commissionChauffeur`, `vehiculeTarifs` (JSON stringifié), `mobileMoney`.

#### `ServiceTariff` (V2) — modèle par Service + VehicleCategory

- **Défini dans** : `apps/api/prisma/schema.prisma` (modèle `ServiceTariff`)
- **Utilisé par** : `apps/api/services/pricingEngine.js` (moteur V2)
- **Utilisé par** : `public.routes.js` pour les flux LONG_HAUL
  - `public.routes.js:566` — calcul LONG_HAUL
  - `public.routes.js:1412` — calcul LONG_HAUL négocié
  - `public.routes.js:1988` — matching LONG_HAUL
- **Endpoint V2 cible** : `GET/PUT /organizations/:id/config`

  Cet endpoint n'est pas encore le chemin de configuration actuel ; il fait
  partie de la migration future vers `ServiceTariff`.

Champs principaux : `pricingModel`, `basePrice`, `unitPrice`, `minimumPrice`,
`commissionPct`, `vehicleCategory`, `configuration`.

#### Problème identifié

`settings/page.tsx` écrit dans `Tarif` (V1), mais le moteur de pricing V2
(`pricingEngine.js`) lit exclusivement `ServiceTariff`. Les tarifs saisis
dans `settings/page.tsx` n'alimentent donc **pas** le calcul V2.

Certaines routes de `public.routes.js` lisent encore `Tarif` pour les cours
classiques, ce qui rend la migration non triviale : les deux modèles doivent
coexister tant que toutes les routes n'ont pas basculé sur `ServiceTariff`.

#### Migration à prévoir

1. Créer l'endpoint `PUT /organizations/:id/config` pour éditer les
   `ServiceTariff` directement
2. Réécrire `settings/page.tsx` pour consommer cet endpoint
3. Migrer les données `Tarif.vehiculeTarifs` (JSON stringifié) →
   `ServiceTariff` (lignes structurées avec `pricingModel`)
4. Migrer `Tarif.commissionChauffeur` → `ServiceTariff.commissionPct`
5. Vérifier qu'aucun flux ne lit plus `Tarif` avant de le supprimer

#### Consigne intermédiaire

**Ne pas modifier `settings/page.tsx` sans plan de migration complet.**
Un patch partiel (par exemple remplacer `isUrbain` par `hasActivity`) ne
résoudrait que le symptôme et conserverait la logique tarifaire V1 active.

---

### Modèle `Operation` (non utilisé)

Le modèle `Operation` est défini dans `schema.prisma` mais n'est référencé
par **aucun** appel `prisma.operation.*` dans le backend.

Vestige d'une migration inachevée. La source de vérité pour les prestations
est actuellement `LeadAction` → `Course`.

**Décision** : à supprimer dans une future version après vérification qu'aucun
script externe ne l'utilise.

---

### Constante `VEHICLE_TYPES` dans `vehicules/page.tsx`

- **Défini dans** : `admin-next/src/app/flotte/vehicules/page.tsx`
- **Structure** : `Record<organizationType, Record<vehicleTypeCode, label>>`
- **Indexation** : par `organization.type` (`FLEET_MANAGER` / `COOPERATIVE`)

Cette constante reflète une logique V1 : elle indexe par type d'organisation
plutôt que par `BusinessActivity`.

En V2, la liste des types de véhicules disponibles devrait être dérivée des
`VehicleCategory` associées aux `Service` de l'organisation, exposées via
`getActivityServices()` / `getService().tariffs[].vehicleCategory`.

**Décision** : à conserver pour l'instant (fonctionnel), à migrer lors de la
refonte des pages véhicules.

---

### Champ `Course.commission` (legacy)

Champ `Float` sur `Course`, conservé pour compatibilité avec l'ancien modèle
`Tarif`. Il est maintenu en miroir de `Course.montantOrganisation` à chaque
création de Course.

**Statut** : plus aucun consommateur frontend ne le lit depuis P8-B
(`finances/page.tsx` et `urbain/courses/page.tsx` utilisent désormais
`montantOrganisation` / `montantChauffeur`).

**Décision** : à supprimer du schéma après audit des autres consommateurs
(notamment les apps mobiles et les scripts de seed).

---

*Dernière mise à jour : P8-B — sémantique V2 montants et flags d'activité.*

### Divergences de prix entre table Plan et frontend

- **FLEET_MANAGER / Basic** : table = 16000, frontend = 15000
- **COOP_MANAGER / Standard** : table = 45000, frontend = env ou 45000

Depuis P8-B, la table `Plan` est la source de vérité. Le frontend
`abonnements/page.tsx` sera migré pour utiliser `/plans`.

### Organisation de type ADMIN

Une organisation de type `ADMIN` existe en base avec `plan = "Premium"`.
La table `Plan` ne contient que des plans `FLEET_MANAGER` et `COOPERATIVE`.
La route `PUT /organizations/:id` autorise cette organisation à conserver
son plan sans validation (cas particulier documenté dans le code).

### Fallback `dagoos_org_token` obsolète

Dans `admin-next/src/app/api/dashboard/stats/route.ts`, la ligne :

    cookieStore.get('dagoos_org_token')?.value

référence un cookie qui n'est plus jamais posé. Fallback mort.

### Routes Next vestiges

- `api/drivers/route.ts`
- `api/vehicles/route.ts`
- `api/organizations/route.ts`

Jamais consommées directement (vérifié par grep). À supprimer.

### Coexistence des 3 cookies d'auth

Les cookies `dagoos_admin_token`, `dagoos_urbain_token`,
`dagoos_interurbain_token` peuvent coexister. Les routes distinguent
le bon via `x-auth-space` ou par nom exact. Fragile à terme :
envisager un cookie unique avec claim `space` dans le JWT.

### Dashboard admin : dépendance pagination backend

`/api/dashboard/stats` utilise `?limit=100` (limite backend).
Si la base dépasse 100 orgs / 100 drivers, les compteurs seront faux.
Solution future : boucler sur toutes les pages ou agréger côté backend.