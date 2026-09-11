# P5 — GEL commissionPct

## Règle métier verrouillée

`commissionPct` = **part chauffeur** (jamais l'inverse).

- `partChauffeur = prix × commissionPct / 100`
- `partOrganisation = prix - partChauffeur`

## Source de vérité LONG_HAUL

1. **À la création** (`/api/public/request`, `public.routes.js:1861`) :
   - lue depuis `ServiceTariff.commissionPct`
   - **figée** dans `LeadAction.details.commissionPct`

2. **Ensuite** (toutes les lectures ultérieures) :
   - `/propose` (`actions.routes.js`) : ne touche pas
   - `/respond` (`public.routes.js:936`) : relit `details.commissionPct ?? 20`
   - `/accept` (`actions.routes.js:335`) : relit `details.commissionPct || 20`

3. **`ServiceTariff.commissionPct` n'est JAMAIS relu** après création.

## Conséquence

Si le tarif `ServiceTariff.commissionPct` change **après** la création
d'une `LeadAction`, le prix proposé + accepté par le client reste basé
sur la valeur figée. → **Pas de rupture de contrat.**

## Autres types (hors LONG_HAUL)

| Type | Source |
|---|---|
| COURSE_REQUEST / TAXI_RESERVATION | `Tarif.commissionChauffeur` (legacy) |
| CAR_RENTAL | `Tarif.commissionChauffeur` (legacy) |

## Dette technique

`commissionPct` est stocké dans `LeadAction.details` (JSON),
pas dans un champ Prisma dédié. Non requêtable, non typé.

À corriger en V3 (probablement avec `Operation.commissionPct`).
