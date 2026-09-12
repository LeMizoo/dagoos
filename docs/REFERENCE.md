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

### Pages `flotte/interurbain/*` — audit 2026-09-12

Zone auditée : 18 fichiers .tsx, 1545 lignes au total.

**Résultat : zone saine.** Aucun mock, aucun montant hardcodé, aucun
localStorage, aucun flag V1, aucune sémantique financière legacy.

#### Architecture

- **6 fichiers actifs** : `departs` (476L), `drivers` (490L),
  `reservations` (289L), `societes` (67L), `livraisons` (61L),
  `contrats` (59L)
- **6 stubs** : `depenses`, `finances`, `pointages`, `proprietaires`,
  `rapports`, `versements` — affichent « En construction »
- **5 re-exports** : `messages`, `notifications`, `profil`, `vehicles`,
  `settings` — réutilisent les composants de `flotte/*` via
  `export { default } from '../../xxx/page'`
- **1 wrapper** : `page.tsx` — garde `hasActivity('INTERURBAN')`

#### Sécurité

L'isolation repose sur 3 niveaux :

1. `flotte/layout.tsx` → `PortalGuard allowedRoles={['FLEET_MANAGER', 'COOP_MANAGER']}`
2. `flotte/interurbain/page.tsx` → `hasActivity('INTERURBAN')`
3. **Backend** → filtrage par organisation vérifié (audit 2026-09-12 :
   chaque requête `/departs`, `/vehicles`, `/drivers` retourne un seul
   `organizationId`)

Le filtre client (`d.organizationId === organization.id`) est une
ceinture-bretelles défensive, pas la protection principale.

#### Pagination

`?limit=100` est utilisé sur toutes les pages. À la date de l'audit,
aucune organisation ne dépasse 20 items. Pas de pagination nécessaire.

**À surveiller** : si une organisation dépasse 100 départs, véhicules
ou chauffeurs, la pagination devra être ajoutée côté UI.

### Fix sécurité — isolation `GET /drivers/pointages`

**Date** : 2026-09-12 (commit `7d1d74aa`)

**Problème** : la route acceptait n'importe quel `?organizationId=`
sans vérifier que l'utilisateur y avait accès. Un COOP_MANAGER pouvait
extraire les pointages d'une autre organisation.

**Fix** : validation systématique via `PRIVILEGED_ROLES` :

- SUPER_ADMIN / ADMIN : peuvent filtrer par `organizationId`
- Autres rôles : limités à leur propre organisation, retour 403 sinon

**Tests** : https://dago-mobility.vercel.app/flotte/interurbain/drivers
- Organisation propre : 200
- Organisation étrangère : 403

### Audit isolation `organizationId` — 2026-09-12

Audit systématique des routes backend utilisant `req.query.organizationId` :
5 routes identifiées, toutes analysées.

**Verdict** : aucune faille résiduelle.

Toutes les routes suivent le même pattern d'isolation :

    if (!GLOBAL_ROLES.includes(req.user.role)) {
      const orgId = await getUserOrganizationId(req);
      where.organizationId = orgId;
    } else if (req.query.organizationId) {
      where.organizationId = req.query.organizationId;
    }

Le `else if` ne s'exécute **que** pour SUPER_ADMIN / ADMIN.

#### Routes auditées

| Route | Statut |
|-------|--------|
| `GET /actions` | ✅ Pattern sûr |
| `POST /actions` | ✅ Pattern sûr |
| `GET /departs` | ✅ Pattern sûr |
| `GET /finances/expenses` | ✅ Protégé par `isAdmin(req)` |
| `GET /messages` | ✅ Pattern sûr |
| `GET /reservations` | ✅ Filtre via departId |
| `GET /vehicles` | ✅ Pas de query, org forcée |
| `GET /livraisons` | ✅ Pas de query, org forcée |
| `GET /societes` | ✅ Pas de query, org forcée |
| `GET /drivers` | ✅ Pas de query, org forcée |

#### Correctif appliqué

`GET /drivers/pointages` était la seule route vulnérable (pas de check
de rôle sur `organizationId`). Corrigé dans le commit `7d1d74aa` du
2026-09-12.

Test en production : organisation étrangère → HTTP 403
`{ error: 'Accès interdit à cette organisation' }`.

### Fix P9 — dashboard/cooperatives/[id] migration apiFetch

**Date** : 2026-09-12 (commits 995b5ba9 + 0e633e2e)

**Problème** : les pages [id]/page.tsx, [id]/chauffeurs, [id]/vehicules
utilisaient fetch() direct sans le header `x-auth-space`, causant des
401 sur toutes les opérations (lecture et écriture).

**Fix** : migration complète vers apiFetch :
- GET / POST / PUT / DELETE
- Vérification res.ok systématique
- Uniformisation avec le reste du code

**Dette éliminée** : plus de dépendance à /api/drivers et /api/vehicles
(routes Next vestiges, candidates à suppression).


### Fix P10 — dashboard/flottes/[id] migration apiFetch

**Date** : 2026-09-12 (commit 4bd17eca)

**Problème** : les pages `[id]/page.tsx`, `[id]/chauffeurs`,
`[id]/vehicules` de `dashboard/flottes` utilisaient `fetch()` direct
sans le header `x-auth-space`. Symétrie avec P9 sur `dashboard/cooperatives`.

**Fix** : migration complète vers `apiFetch` :

- GET / POST / PUT / DELETE
- Vérification `res.ok` systématique sur DELETE
- Uniformisation avec le reste du code

**Dette éliminée** : plus de dépendance à `/api/drivers` et `/api/vehicles`
(routes Next vestiges, candidates à suppression).