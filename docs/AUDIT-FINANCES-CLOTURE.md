# AUDIT FINANCES — CLÔTURE

**Date :** 2026-09-22
**Statut :** CLÔTURÉ
**Décision :** AUCUNE MODIFICATION
**Portée :** lecture seule — aucun changement code, Prisma, API, frontend, migration.

## Contexte

Suspicion initiale : `/dashboard/finances` manquerait des organisations
(Fleet Premium, Flotte Alasora) visibles dans les données Payment et Versement.

## Conclusion

La suspicion était infondée. `/dashboard/finances` est une vue
d'**abonnements** (`Organization` + `Plan`), pas un ledger opérationnel.
Elle n'appelle que `/organizations` et `/plans`. Aucun appel à
`/finances/*` n'est attendu dans cette page.

## État des sources financières (données de test au 2026-09-22)

| Source    | Organisation    | Volume | Montant      | Rattachement                                |
|-----------|-----------------|--------|--------------|---------------------------------------------|
| Course    | Abela Speedy    | 57     | 2 903 650 Ar | Driver → Organization                       |
| Payment   | Fleet Premium   | 2      | 12 500 Ar    | Payment → Trip → Driver → Organization      |
| Versement | Flotte Alasora  | 4      | 735 400 Ar   | Driver → Organization                       |
| Expense   | à préciser      | 2      | à préciser   | organizationId direct                       |

Aucune organisation ne couvre plusieurs sources dans ce jeu de test.

## Cartographie des pages

- `/dashboard/finances`              → abonnements (ADMIN général)
- `/dashboard/finances/abonnements`  → gestion abonnements
- `/flotte/finances`                 → finances opérationnelles ORG
- `/flotte/versements`               → versements ORG
- `/flotte/interurbain/finances`     → finances interurbain
- `/flotte/interurbain/versements`   → versements interurbain

## Cartographie API

- `GET /finances/courses`        `finances.read`
- `GET /finances/transactions`   `finances.read`   → Payment[]
- `GET /finances/versements`     `finances.read`   → Versement[]
- `GET /finances/expenses`       `finances.expenses.read`
- `POST /finances/expenses`      `finances.expenses.create`
- `GET /finances/stats/summary`  `finances.read`
- `PATCH /finances/versements/:id` `finances.manage`

Toutes scopées : `isAdmin(req)` → global ; `DRIVER` → self ;
sinon `getOrganizationDriverIds(req)` → organisation.

## Dettes techniques identifiées (non bloquantes)

1. `Payment.tripId` est un scalaire nu, sans `@relation` Prisma vers `Trip`.
   Conséquence : pas d'`include`/`select` possible, jointures manuelles
   obligatoires pour rattacher un Payment à une Organization.
2. Asymétrie de modélisation : `Expense.organizationId` direct vs
   `Course`/`Versement` via `Driver.organization` vs `Payment` via `Trip`.
   À traiter séparément le jour où un agrégat multi-sources sera requis.

## Note de reprise

**Vue financière globale ADMIN** : à rouvrir uniquement sur :
- besoin fonctionnel explicite et documenté ;
- jeu de données de test cohérent couvrant plusieurs sources pour une
  même organisation ;
- décision préalable sur le rattachement de `Payment` :
  - Option 1 : jointures manuelles (sans toucher au schéma) ;
  - Option 2 : ajouter la relation Prisma `Payment.trip` ;
  - Option 3 : dénormaliser `Payment.organizationId`.

Tant que ces trois conditions ne sont pas réunies, aucune vue admin
globale ne doit être créée.

## Règle appliquée

> Si l'API existante est correcte, on ne la réécrit pas simplement
> pour faire fonctionner l'interface.

Ici, aucune interface n'était cassée. La page a une fonction
documentée qui correspond à ce qu'elle fait. Le besoin « vue admin
globale » est une hypothèse, pas un constat.