# Chantier DAGO MOBILITY — Landing publique

**Date de clôture :** 2026-09-17
**Périmètre :** `admin-next/` (routes publiques marketing)
**Statut :** TERMINÉ

---

## 1. Objectif

Créer les pages publiques correspondant aux liens du footer de la landing DAGO MOBILITY, avec :

- **Une charte cohérente** (charte DAGOO'S : primary navy, secondary saffron, accent green)
- **Aucun contenu fictif** : pas de chiffres inventés, pas d'offres d'emploi fictives, pas de blog fictif
- **Des états vides honnêtes** : chaque page en préparation affiche clairement son statut
- **Une architecture maintenable** : composants partagés (`LandingLayout`, `LandingHeader`, `LandingFooter`)

Les ancres existantes de la landing (`#services-de-mobilite`, `#plans`, `#faq`) sont conservées.

---

## 2. Palette DAGOO'S

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#06245F` | Navy — CTA, hero, navigation |
| `secondary` | `#E0A01C` | Saffron — accents |
| `dark` | `#06245F` | Navy — hover, fonds sombres |
| `accent` | `#0A6F35` | Green — différenciation flotte/admin |

Tokens définis dans `admin-next/tailwind.config.ts`.

---

## 3. Travaux réalisés

### Vague 1 — Socle marketing partagé

**Commit :** `7e4406b8 feat(landing): extraire footer dans LandingFooter + LandingLayout`

**Fichiers créés :**
- `admin-next/src/components/landing/LandingFooter.tsx`
- `admin-next/src/components/landing/LandingLayout.tsx`

**Fichier modifié :**
- `admin-next/src/app/page.tsx` (utilise `LandingLayout`)

**Résultat :**
- Footer centralisé, réutilisable sur toutes les pages marketing
- Aucune régression visuelle sur la landing existante
- Doublon footer identifié et corrigé (un seul footer rendu)

---

### Vague 2 — Page /contact

**Commit :** `e4b9a789 feat(landing): ajouter la page /contact`

**Fichier créé :**
- `admin-next/src/app/contact/page.tsx`

**Fonctionnalités :**
- Formulaire : nom, téléphone, message
- Validation stricte côté front (regex téléphone malgache : `03XXXXXXXX` ou `+261XXXXXXXXX`)
- Envoi vers l'API existante `POST /public/actions` avec `type: 'CONTACT'`
- Pas de `organizationSlug` (le backend accepte ce cas)
- États : loading, success, error
- Coordonnées affichées :
  - Email : `contact@dagoos.mg`
  - Téléphone : `+261 34 07 004 05` (cliquable `tel:`)
  - Adresse : `Madagascar`

**Test end-to-end validé :**
- Soumission → `LeadAction` créée en DB
- `organizationId: null` (attendu pour un contact générique)

**Dette technique tracée dans le code :**
```tsx
// TODO Vague 5/6 :
// 1. Créer un endpoint dédié POST /public/contact côté API
// 2. Créer une page admin (super-admin) pour consulter les
//    LeadAction sans organizationId. Actuellement invisibles :
//    /flotte/demandes filtre sur organizationId === org.id.
// 3. Éventuellement ajouter un champ email au modèle LeadAction
// 4. Endpoint dédié : NE PAS appliquer le traitement "course"
//    (codeSuivi, prixEstime, commissionPct, modePrestation,
//    statutNegociation) aux contacts génériques
```

---

### Vague 3 — Pages Entreprise + Header commun

**Commit :** `ea99479f feat(landing): ajouter header logo et pages publiques`

**Fichiers créés :**
- `admin-next/src/components/landing/LandingHeader.tsx` (header sticky avec logo B-Trans cliquable)
- `admin-next/src/app/a-propos/page.tsx`
- `admin-next/src/app/blog/page.tsx`
- `admin-next/src/app/carrieres/page.tsx`

**Fichiers modifiés :**
- `admin-next/src/components/landing/LandingLayout.tsx` (prop `showHeader`)
- `admin-next/src/app/page.tsx` (landing : `showHeader={false}`)
- `admin-next/package.json` (scripts `dev:fresh`, `build:fresh`, `clean`)
- `admin-next/package-lock.json` (+ `rimraf`)

**Contenu des pages :**

| Page | Contenu |
|---|---|
| `/a-propos` | Hero + mission factuelle + 3 valeurs (Proximité, Fiabilité, Innovation) + CTA contact |
| `/blog` | Hero + état vide « Le blog arrive bientôt » + CTA contact |
| `/carrieres` | Hero + état vide « Aucune offre ouverte pour le moment » + mailto candidature spontanée |

**Aucune donnée fictive.**

**Header :**
- `sticky top-0 z-40` (reste visible au scroll)
- Logo `b-trans.svg` cliquable → `/`
- `bg-white/95 backdrop-blur-sm`
- `aria-label="Dago Mobility — Accueil"` (accessibilité)

**Scripts ajoutés :**
```json
"dev:fresh": "rimraf .next && next dev -p 5001",
"build:fresh": "rimraf .next && next build",
"clean": "rimraf .next"
```

Ces scripts résolvent définitivement les crashs `Cannot find module './XXXX.js'` qui survenaient lors de l'alternance build → dev.

---

### Vague 4 — Pages Support

**Commit :** `5255c79c feat(landing): ajouter pages aide et statut`

**Fichiers créés :**
- `admin-next/src/app/aide/page.tsx`
- `admin-next/src/app/statut/page.tsx`

**Contenu :**

| Page | Contenu |
|---|---|
| `/aide` | Hero + état vide « Le centre d'aide arrive bientôt » + CTA contact |
| `/statut` | Hero + état vide « La page de statut arrive bientôt » + CTA contact |

**Aucune FAQ fictive, aucun statut fictif.**

---

## 4. Routes publiques finales

| Route | Type | Contenu |
|---|---|---|
| `/` | Landing | Hero, services, plans, pourquoi, CTA |
| `/contact` | Formulaire | Nom, téléphone, message + coordonnées |
| `/a-propos` | Page | Mission + valeurs + CTA |
| `/blog` | Page | État vide + CTA |
| `/carrieres` | Page | État vide + candidature spontanée |
| `/aide` | Page | État vide + CTA |
| `/statut` | Page | État vide + CTA |

**Ancres de la landing (conservées) :**
- `#services-de-mobilite` → section `ServiceCards`
- `#plans` → section `PlansSection`
- `#faq` → non implémentée (note : lien footer pointe vers une ancre inexistante)

---

## 5. Validation technique

### Build Next.js

```
Next.js 14.2.35
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (70/70)
```

Aucune erreur TypeScript, aucun warning bloquant.

### Typecheck

```bash
npx tsc --noEmit
# 0 erreur
```

### Test end-to-end

- Formulaire `/contact` → `LeadAction` créée en DB
- Route `/aide` → 200
- Route `/statut` → 200

---

## 6. Décisions de contenu

### Principe directeur

> **Aucun contenu fictif présenté comme réel.**
> Chaque page en préparation affiche clairement son statut.

### Exemples concrets

- ❌ **Pas** de « Plus de 10 000 utilisateurs » sans base réelle
- ❌ **Pas** de « 5 ans d'expérience » si non vérifiable
- ❌ **Pas** d'offre d'emploi fictive
- ❌ **Pas** d'article de blog inventé
- ❌ **Pas** de statut de service factice
- ✅ **À la place** : « arrive bientôt », « en préparation », invitation à contacter

---

## 7. Dette technique identifiée

### API contacts génériques

**Problème :**
- `POST /public/actions` accepte `type: 'CONTACT'` sans `organizationSlug`
- Les `LeadAction` créées ont `organizationId: null`
- **Ces actions sont invisibles dans l'admin actuel** : `/flotte/demandes` filtre sur `organizationId === organization.id`
- Les champs `codeSuivi`, `prixEstime`, `commissionPct`, `modePrestation`, `statutNegociation` sont générés pour les contacts alors qu'ils n'ont pas de sens

**Solution proposée (Vague 5/6 ou nouveau chantier) :**
1. Créer un endpoint dédié `POST /public/contact`
2. Ajouter un champ `email` au modèle `LeadAction` (optionnel)
3. Créer une page admin super-admin pour consulter les contacts sans organisation
4. Ne pas appliquer le traitement « course » aux contacts

### Ancre `#faq` cassée

**Problème :**
- Le lien footer `/aide#faq` pointe vers une ancre inexistante
- Aucune section `id="faq"` n'existe

**Solution proposée (Vague 5) :**
- Créer une section FAQ dans `/aide`, avec `id="faq"`
- OU retirer le lien du footer

### Nommage « B-Trans » vs « DAGO MOBILITY »

**Problème :**
- Header utilise le logo `b-trans.svg` avec `alt="B-Trans"`
- Footer affiche « DAGO MOBILITY »
- Incohérence de marque

**Solution proposée :**
- Clarifier la relation entre B-Trans et DAGO Mobility
- OU harmoniser (soit tout B-Trans, soit tout DAGO Mobility)

---

## 8. Référence Git

### Commits du chantier

```
5255c79c  feat(landing): ajouter pages aide et statut
ea99479f  feat(landing): ajouter header logo et pages publiques
e4b9a789  feat(landing): ajouter la page /contact
7e4406b8  feat(landing): extraire footer dans LandingFooter + LandingLayout
f6bfa4df  docs: ajouter la section post-cloture au chantier admin-next
```

### État

```
HEAD = origin/main = 5255c79c
working tree = clean
```

### Déploiement

- Vercel redéploie automatiquement au push sur `main`
- URL : `https://dago-mobility.vercel.app`
- Routes à vérifier après déploiement : `/`, `/contact`, `/a-propos`, `/blog`, `/carrieres`, `/aide`, `/statut`

---

## 9. Reste à faire (optionnel)

- Vérification navigateur des 7 routes sur Vercel
- Audit des `blue-*` restants dans les composants landing (migration charte partielle)
- Création d'un vrai header avec navigation (Produit / Entreprise / Support)
- Remplissage du blog avec contenu réel
- Création d'offres d'emploi réelles

---

**Chantier clôturé le 17/09/2026.**
**Aucune donnée fictive n'a été présentée comme réelle.**