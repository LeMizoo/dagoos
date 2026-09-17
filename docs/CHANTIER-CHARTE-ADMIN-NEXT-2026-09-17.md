# Chantier Charte DAGOO'S — Admin Next.js

**Date de clôture :** 2026-09-17
**Périmètre :** `admin-next/` (interface d'administration Next.js)
**Objectif :** Appliquer la charte graphique DAGOO'S 2026 à l'UI admin, sans casser la sémantique métier.

---

## 1. Contexte

Après l'harmonisation des 3 PWAs (`apps/fleet-driver`, `apps/coop-driver`, `apps/dagoos-mobile`) avec la charte DAGOO'S 2026, le même travail a été entrepris sur l'interface d'administration Next.js.

**Principe directeur** : ne pas convertir les ~3 216 classes Tailwind natives d'un coup. Procéder par **migrations sémantiques contrôlées**, fichier par fichier, avec audit préalable.

---

## 2. Palette officielle

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#06245F` | Navy — CTA, navigation, focus |
| `secondary` | `#E0A01C` | Saffron — accents (à venir) |
| `dark` | `#06245F` | Navy — sidebars, fonds sombres |
| `success` | `#0A6F35` | Green — états positifs |
| `white` | `#FFFFFF` | — |

Centralisée dans `admin-next/tailwind.config.ts` :

```ts
theme: {
  extend: {
    colors: {
      primary: '#06245F',
      secondary: '#E0A01C',
      dark: '#06245F',
    },
  },
}