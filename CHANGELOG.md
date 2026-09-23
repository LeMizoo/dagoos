# Changelog

Toutes les modifications notables de Dagoos sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Changed
- **finances/driver** : migration des dépenses Home vers l'API (`12c4168d`)
  - Coop + Fleet : `localStorage` remplacé par `GET/POST /finances/expenses`
  - Champs alignés sur le schéma API : `category`, `amount`, `description`
  - Source de vérité unique : backend

- **finances/fleet** : migration des versements vers `stats/summary` (`038946e4`)
  - Suppression du calcul frontend 20/80 (`commissionPct`)
  - Suppression des appels `/finances/courses` et `/tarifs/`
  - Utilisation de `GET /finances/stats/summary` (source de vérité)
  - `POST /finances/versements` via `window.apiFetch`
  - `driverId` retiré du body (extrait du JWT)

### Added
- `.gitignore` : patterns pour backups de migration et artifacts Wrangler (`3c1a3c68`)

### Fixed
- **versements (fleet)** : écart de calcul entre frontend et backend
  - Exemple : driver FL-AL-001 → écart de **+206 164 Ar**
  - Cause : tarif actuel ≠ taux historique appliqué aux courses

### Security
- **versements** : `driverId` désormais extrait du JWT (backend), pas du body (frontend)

---

## Détails techniques

### Endpoints API financiers

| Endpoint | Méthode | Permission | Source de vérité |
|---|---|---|---|
| `/finances/expenses` | GET | `finances.expenses.read` | ✅ Backend |
| `/finances/expenses` | POST | `finances.expenses.create` | ✅ Backend |
| `/finances/versements` | GET | (auth) | ✅ Backend |
| `/finances/versements` | POST | (auth, DRIVER) | ✅ Backend |
| `/finances/versements/:id` | PATCH | `finances.manage` | ✅ Backend |
| `/finances/stats/summary` | GET | `finances.read` | ✅ Backend |

### Table `Expense` (Supabase)

| Colonne | Type | Nullable | Défaut |
|---|---|---|---|
| `id` | text | NO | — |
| `driverId` | text | NO | — |
| `organizationId` | text | NO | — |
| `vehicleId` | text | YES | — |
| `category` | text | NO | — |
| `amount` | double precision | NO | — |
| `description` | text | YES | — |
| `date` | timestamp | NO | `CURRENT_TIMESTAMP` |
| `createdAt` | timestamp | NO | `CURRENT_TIMESTAMP` |

### Table `Versement` (Supabase)

| Colonne | Type | Note |
|---|---|---|
| `id` | text | PK |
| `driverId` | text | FK Driver (JWT) |
| `amount` | number | Montant demandé |
| `periode` | text | `YYYY-MM` |
| `status` | text | `en_attente` / `valide` / `refuse` / `paye` |
| `dateVersement` | timestamp | Défini à la validation |
| `createdAt` | timestamp | Défaut NOW |
