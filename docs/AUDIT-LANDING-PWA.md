# Audit Landing ↔ PWA — Parcours passager

> **Date** : 2026-09-23
> **Périmètre** : Landing (`admin-next/`) ↔ PWA (`apps/dagoos-mobile/`)
> **Public** : passager (client final)
> **Statut** : ✅ Audit complet, aucun patch immédiat requis

---

## 1. Contexte

La plateforme Dagoos expose deux points d'entrée pour le **passager** :

| Surface | URL | Techno | Hébergement |
|---|---|---|---|
| **Landing** | `dago-mobility.vercel.app` | Next.js 14 (admin-next) | Vercel |
| **PWA** | `dago-mobile.pages.dev` | Vanilla JS statique | Cloudflare Pages |

**Objectif de l'audit** : vérifier que les **3 parcours passager principaux** sont fonctionnellement raccordés entre les deux surfaces.

---

## 2. Méthodologie

- Audit **lecture seule**
- Comparaison **étape par étape** des parcours
- Vérification des **endpoints API** consommés
- Vérification des **formats de données** (prix, dates, catégories)
- Classification : ✅ cohérent / 🟠 incohérent / 🔴 bloquant

---

## 3. Parcours audités

### 3.1 Course urbaine (taxi)

**Fichiers** :
- Landing : `admin-next/src/components/landing/DemandeTaxi.tsx`
- PWA : `apps/dagoos-mobile/pages/course.js`

| Étape | Landing | PWA | API |
|---|---|---|---|
| Charger les flottes | ✅ `GET /public/organizations` | ✅ `chargerFlottes()` | ✅ |
| Mode choisir / toutes / proche | ✅ | ✅ | — |
| Géolocalisation | ✅ | ✅ | — |
| Reverse geocoding (Nominatim) | ✅ | ❌ **absent** | — |
| Estimation prix | ✅ `POST /public/estimate` | ✅ `estimerPrix()` | ✅ |
| Proposition de prix | ✅ `offreClient` | ✅ `offreClient` | ✅ |
| Envoi demande | ✅ `POST /public/actions` | ✅ `envoyerDemande()` | ✅ |
| Code de suivi | ✅ alert + bloc | ✅ alert + redirection | ✅ |

**Verdict** : 🟢 Fonctionnellement identique.
**Écart** : 🟠 Reverse geocoding (PWA) — l'adresse lisible apporte une information utilisateur réelle, même si elle n'empêche pas le parcours de fonctionner.

---

### 3.2 Réservation interurbaine

**Fichiers** :
- Landing : `admin-next/src/app/(landing)/coop/[slug]/page.tsx`
- PWA : `apps/dagoos-mobile/pages/reservations.js`

| Étape | Landing | PWA | API |
|---|---|---|---|
| Charger les départs | ✅ `GET /public/departs/:slug` | ✅ `GET /public/organizations` (extraction `org.departs`) | ⚠️ **endpoints différents** |
| Sélectionner un départ | ✅ | ✅ | — |
| Grille de places (1A/1B/2A…) | ✅ | ✅ | — |
| Choix multiple de places | ✅ | ✅ | — |
| Nom du passager par place | ✅ | ✅ | — |
| Téléphone | ✅ | ✅ | — |
| Référence paiement | ✅ | ✅ | — |
| Enregistrer réservation | ✅ `POST /public/reservations/batch` | ✅ idem | ✅ |
| Code OTP | ✅ | ✅ | ✅ |
| Gérer réservation | ✅ `POST /public/reservations/manage` | ✅ idem | ✅ |
| Modification de place | ✅ `handleChangePlace` | ❌ **absent** | ✅ API dispo |
| Annulation | ✅ `handleCancelReservation` | ❌ **absent** | ✅ API dispo |
| Filtre par ville | ✅ `villeFiltre` | ❌ absent | — |

**Verdict** : 🟢 Parcours principal identique.
**Écarts** :
- 🟠 Modification / annulation place (PWA) — fonctionnalité exposée côté landing et API, non encore exposée dans le PWA.
- 🟠 Source des départs — deux endpoints différents pour la même donnée.

---

### 3.3 Location (urbaine / inter-urbaine / longue distance)

**Fichiers** :
- Landing : `admin-next/src/components/landing/DemandeLocation.tsx`
- PWA : `apps/dagoos-mobile/pages/location.js`

| Étape | Landing | PWA | API |
|---|---|---|---|
| Mode urbain / inter-urbain | ✅ | ✅ | — |
| Type de service | ✅ `typeService` | ✅ idem | ✅ |
| Véhicules compatibles par service | ✅ `vehiclesByService` | ✅ idem | — |
| Trajet (A→B, A→B→A, multi-jours) | ✅ | ✅ | — |
| Dates aller / retour | ✅ | ✅ | — |
| Carburant | ⚠️ non explicite | ✅ `locCarburant` | — |
| Description marchandise | ⚠️ non explicite | ✅ `locDescription` | — |
| **Photos (upload Cloudinary)** | ❌ **absent** | ✅ `uploaderToutesLesPhotos()` | ✅ `/public/upload-photo` |
| Nb passagers | ✅ | ✅ | — |
| Estimation | ✅ `POST /public/estimate-location` | ✅ idem | ✅ |
| Statut `ESTIMATED` | ✅ | ✅ | ✅ |
| Statut `NEGOTIATION_REQUIRED` | ✅ | ✅ | ✅ |
| Envoi demande | ✅ `POST /public/actions` | ✅ idem | ✅ |
| Code de suivi | ✅ | ✅ | ✅ |

**Verdict** : 🟢 **PWA plus complet que la landing** (photos, carburant, description).
**Écarts** : aucun bloquant. Asymétrie assumée.

---

## 4. Tableau de synthèse

| Parcours | Landing | PWA | API | État |
|---|---|---|---|---|
| Course urbaine | ✅ | ✅ | ✅ | 🟢 |
| Réservation interurbaine | ✅ | ✅ | ✅ | 🟢 |
| Location | ✅ | ✅ | ✅ | 🟢 |

---

## 5. Écarts documentés

### 5.1 Modification / annulation de place (PWA)

- **API disponible** : ✅ `POST /public/reservations/manage`
- **Landing** : ✅ `handleChangePlace`, `handleCancelReservation`
- **PWA** : ❌ absent
- **Impact** : fonctionnalité exposée côté landing et API, non encore exposée dans le PWA
- **Priorité** : 🟠 Moyenne (non bloquant)

### 5.2 Reverse geocoding (PWA)

- **Landing** : ✅ Nominatim (OpenStreetMap)
- **PWA** : ❌ absent (affiche les coordonnées brutes)
- **Impact** : UX dégradée côté PWA — l'adresse lisible apporte une information utilisateur réelle, même si le parcours fonctionne sans elle
- **Priorité** : 🟠 Moyenne (non bloquant)

### 5.3 Photos (Landing)

- **PWA** : ✅ `uploaderToutesLesPhotos()` vers Cloudinary
- **Landing** : ❌ absent
- **Impact** : capacité fonctionnelle supplémentaire du PWA (pas un défaut)
- **Priorité** : ➖ N/A (asymétrie assumée)

### 5.4 Source des départs

- **Landing** : ✅ `GET /public/departs/:slug` (direct)
- **PWA** : ✅ `GET /public/organizations` (extrait `org.departs`)
- **Impact** : deux endpoints différents pour la même donnée
- **Priorité** : 🟠 Moyenne (harmonisation possible)

---

## 6. Écarts non traités (volontaire)

| # | Écart | Raison |
|---|---|---|
| 1 | Login passager | Aucun endpoint backend dédié |
| 2 | Notifications passager | Aucune API publique |
| 3 | Contact / aide dans le PWA | Non prioritaire |
| 4 | Blog / carrières / à propos | Non applicable au PWA |

**Principe** : ne pas inventer de fonctionnalité frontend sans backend.

---

## 7. Décision

**Option 1 — Aucun patch immédiat.**

**Justification** :
1. ✅ Les 3 parcours passager sont fonctionnels
2. ✅ Les endpoints API métier principaux sont cohérents entre les deux surfaces, avec une différence documentée pour le chargement des départs interurbains
3. ✅ Les codes de suivi / OTP sont cohérents
4. ✅ Les formats de prix sont cohérents
5. ⚠️ Les écarts restants sont non bloquants : certains sont des différences UX, d'autres correspondent à des fonctionnalités supplémentaires ou encore non exposées dans le PWA

**Aucune modification** de :
- `apps/dagoos-mobile/pages/reservations.js`
- `apps/dagoos-mobile/pages/course.js`
- `admin-next/src/components/landing/DemandeLocation.tsx`

---

## 8. État de référence

| Élément | Valeur |
|---|---|
| Commit stable | `98120cce` — `feat: harmonize mobile PWA with landing` |
| Branche | `main` |
| Dernier push | `origin/main` |

---

## 9. Historique

| Date | Action | Commit |
|---|---|---|
| 2026-09-23 | Harmonisation PWA (manifest, CTA, theme-color) | `98120cce` |
| 2026-09-23 | Audit Landing ↔ PWA (lecture seule) | (ce document) |

---

## 10. Prochaines étapes (backlog)

| # | Action | Priorité |
|---|---|---|
| 1 | Exposer modification/annulation place dans le PWA | ✅ Fait (`97edfa23`) |
| 2 | Ajouter reverse geocoding au PWA | ✅ Fait (`9b646a60`) |
| 3 | Harmoniser source des départs (landing ↔ PWA) | ✅ Partiel (`8d5acb67`) — take:20 + PENDING. Endpoint `/public/departs` dédié à faire (#3B) |
| 4 | Ajouter photos à la landing (parité) | 🟡 Faible |
| 5 | Login passager | 🔴 **Bloqué** (backend manquant) |
| 6 | Notifications passager | 🔴 **Bloqué** (backend manquant) |
| 7 | Permettre saisie offreClient même sans estimation (config flotte manquante) | ✅ Fait (`6db3351f`) |
| 8 | Corriger géocoding Nominatim — toponymes ambigus (Ivato→Ambositra) | ✅ Fait (`24d5cc8e`) |
| 9 | Architecture par ville — détection auto + filtre flottes | 🟠 Moyenne |
| 10 | Remplacer le prix par défaut hardcodé 2000 Ar par un tarif DAGOO'S standard | 🟡 Faible |

---

## Notes de suivi

- **#3A — Partiel** (`8d5acb67`) : `/organizations` retourne maintenant jusqu'à 20 départs par org + les réservations PENDING.
  Test fonctionnel en attente (aucun départ publié en base au moment du déploiement).
  Reste : endpoint dédié `GET /public/departs` pour harmoniser complètement avec la landing.
- **#8 — Fait** (`24d5cc8e`) : géocoding Nominatim corrigé via table locale (`apps/api/lib/villes-madagascar.js`).
  Test prod : Ivato → Itaosy = 16.6 km (vs 259 km avant).
