# Chantier Charte DAGOO'S — Admin Next.js

**Date de clôture :** 2026-09-17
**Périmètre :** `admin-next/`
**Statut :** TERMINÉ

---

## 1. Objectif

Appliquer progressivement la charte graphique officielle **DAGOO'S 2026** à l'interface d'administration Next.js, sans casser la sémantique métier existante.

Principe retenu :

> Migration sémantique contrôlée, avec audit préalable, plutôt qu'une conversion globale des classes Tailwind.

Les quelque **3 216 classes Tailwind natives** existantes n'ont volontairement pas été converties en masse.

---

## 2. Palette DAGOO'S intégrée

Les tokens principaux sont centralisés dans :

`admin-next/tailwind.config.ts`

```ts
primary: '#06245F',
secondary: '#E0A01C',
dark: '#06245F',
```

### Correspondance

| Token       | Valeur    | Usage                           |
| ----------- | --------- | ------------------------------- |
| `primary`   | `#06245F` | Navy — CTA, navigation, focus   |
| `secondary` | `#E0A01C` | Saffron — accents               |
| `dark`      | `#06245F` | Navy — fonds sombres / sidebars |

Les couleurs natives Tailwind restent utilisées lorsqu'elles portent une **sémantique métier**.

---

## 3. Travaux réalisés

### Vague 1 — Tokens Tailwind

Commit :

`9932ed49 feat(admin-next): appliquer la charte DAGOO'S aux tokens Tailwind`

Actions :

* `primary` → `#06245F`
* `secondary` → `#E0A01C`
* `dark` → `#06245F`
* anciennes valeurs supprimées
* usages existants conservés

---

### Vague 2 — UI structurante

Commit :

`2d60d205 Vague 2 — admin-next: migration Button + Layouts vers charte (primary/dark)`

Fichiers :

* `src/components/ui/Button.tsx`
* `src/components/layout/FlotteLayout.tsx`
* `src/components/layout/ResponsiveLayout.tsx`

Actions principales :

* CTA principaux → `primary`
* hover/focus → variantes de `primary`
* fonds sombres → `dark`
* navigation et avatar → `primary`

---

### Vague 3 — UI d'action

Commit :

`119c0234 Vague 3 — admin-next: migration ciblée UI vers charte`

**8 fichiers** traités.

Actions :

* CTA
* boutons
* focus
* liens d'action
* hover
* navigation

Les bleus métier ont été volontairement conservés.

Build validé après cette vague.

---

### Vague 4 — UI ciblée

Commit :

`d2e8945f Vague 4 - migration ciblee UI (8 fichiers, register/landing/settings)`

**8 fichiers** traités.

**20 remplacements** exactement.

Zones concernées :

* erreur
* inscription
* authentification
* landing
* modal de connexion
* paramètres
* gestion des chauffeurs
* paramètres dashboard

Build complet validé.

---

## 4. Sémantique métier préservée

Les `blue-*` restants n'ont volontairement pas été supprimés.

Il reste environ :

**99 occurrences** **`blue-*`**

Elles correspondent notamment à :

* badges
* KPI
* statuts
* plans tarifaires
* informations
* mappings métier
* distinctions Urbain / Interurbain
* éléments de graphiques
* états sélectionnés
* couleurs métier

Exemple important conservé :

```tsx
standard: 'bg-blue-600 hover:bg-blue-700'
```

Le bleu du plan **STANDARD** n'a pas été transformé en `primary`.

La distinction **Urbain / Interurbain** dans `LoginModal.tsx` a également été préservée.

---

## 5. Validation technique

### Build

Build `admin-next` validé :

* Next.js `14.2.35`
* compilation réussie
* lint OK
* TypeScript OK
* génération des pages OK
* **64/64 pages générées**
* optimisation finale OK

Les avertissements Google Fonts observés n'ont pas provoqué d'échec du build.

### Git

Le chantier est clôturé au commit :

`87d731a9 docs: archiver le chantier Charte DAGOO'S admin-next (Vagues 1-4)`

Les vagues elles-mêmes s'étalent sur les commits :

`9932ed49 → d2e8945f`

État final :

```text
HEAD = 87d731a9
origin/main = 87d731a9
working tree = clean
```

Aucune modification non commitée.

### .gitignore

Les règles `.env*` existantes couvrent déjà tous les backups `.env.local.bak-*`.

Aucune règle supplémentaire n'a été nécessaire.

---

## 6. Nettoyage des backups

Les backups temporaires des vagues Admin Next.js ont été supprimés après validation.

**27 backups de vagues supprimés.**

Les backups API hors périmètre ont été volontairement conservés :

```text
apps/api/modules/finances/finances.routes.js.bak-20260916-084730
apps/api/modules/finances/finances.routes.js.bak-org-helper-20260916-084938
apps/api/server.js.bak-cors-8082-20260916-102521
```

Les 2 anciens backups `admin-next` antérieurs au chantier ont également été supprimés :

```text
admin-next/.env.local.bak-20260916-091053
admin-next/src/app/flotte/versements/page.tsx.bak-20260916-084730
```

* `.env.local.bak-20260916-091053` — supprimé pour raison de sécurité, car il contenait des secrets.
* `versements/page.tsx.bak-20260916-084730` — supprimé car obsolète, son contenu étant déjà présent dans Git.

Ils ne font donc plus partie de l'état du dépôt à la clôture du chantier.

---

## 7. Décision de clôture

Le chantier **Charte DAGOO'S — Admin Next.js** est considéré comme :

**TERMINÉ**

L'interface possède désormais une base graphique cohérente avec les trois PWAs déjà migrées.

Aucune Vague 5 n'est nécessaire immédiatement.

Les ~99 occurrences `blue-*` restantes pourront éventuellement faire l'objet d'un audit esthétique ultérieur, **sans migration automatique**, afin de préserver la sémantique métier.

---

## 8. Référence Git

Le chantier est clôturé au commit :

`87d731a9 docs: archiver le chantier Charte DAGOO'S admin-next (Vagues 1-4)`

Pour l'historique des vagues, la plage de commits de référence reste :

`9932ed49 → d2e8945f`

Le commit `87d731a9` correspond à l'archivage final du chantier et non à une nouvelle vague de modifications CSS.

État :

`main == origin/main`

---

---

## 9. Post-clôture — Correctif d'alignement

Après la clôture initiale, un correctif volontaire d'alignement des layouts a été appliqué.

Commit :

`860a20ac fix(admin-next): align layouts with Dagoos charter`

### Fichiers modifiés (4)

- `admin-next/src/app/globals.css` (+36 lignes)
- `admin-next/src/components/layout/FlotteLayout.tsx` (2 remplacements)
- `admin-next/src/components/layout/ResponsiveLayout.tsx` (5 remplacements)
- `admin-next/tailwind.config.ts` (+1 ligne)

### Actions

1. **`globals.css`** — introduction d'un système de variables CSS aligné sur les PWAs :
   - palette (`--navy`, `--saffron`, `--green`, + variantes hover)
   - fonds et textes (`--bg-page`, `--bg-surface`, `--text-primary`, etc.)
   - bordures (`--border`, `--border-strong`)
   - raccourcis (`--primary`, `--secondary`)
2. **`tailwind.config.ts`** — ajout du token `accent: '#0A6F35'`
3. **`FlotteLayout.tsx`** — migration `emerald-*` → `accent`
4. **`ResponsiveLayout.tsx`** — différenciation admin/flotte :
   - `admin` → palette `primary` (navy)
   - `flotte` → palette `accent` (vert)

### Impact `blue-*`

Le compteur est passé de **99 à 101 occurrences** après le correctif.

Les **99 occurrences historiques** correspondent aux usages métier volontairement conservés.

Les **2 occurrences supplémentaires** correspondent aux bleus natifs Tailwind explicitement introduits dans le correctif et acceptés dans le contexte de la navigation différenciée admin/flotte.

Aucun pattern UI ciblé (`bg-blue-600`, `hover:bg-blue-700`, `focus:ring-blue-500`, etc.) n'a été réintroduit.

### État final acté

```text
HEAD = 860a20ac
origin/main = 860a20ac
working tree = clean
Build = non revalidé après le correctif 860a20ac
blue-* = 101

**Chantier clôturé le 17/09/2026.**
