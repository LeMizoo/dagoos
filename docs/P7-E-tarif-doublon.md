# P7-E — Doublon de tarifs LONG_HAUL

## Constat

Lors de l'audit P7-E, l'organisation **SONATRA** (`slug: sonatra`) possède une
BusinessActivity active :

- type : `INTERURBAN`
- zone : `NATIONAL`

Le service `MARCHANDISES` est actif.

Deux `ServiceTariff` actifs existent simultanément pour la même combinaison :

- service : `MARCHANDISES`
- catégorie véhicule : `CAMION`
- pricingModel : `NEGOTIATED`
- commissionPct : `5`

Tarifs concernés :

- `cmttre6ua0011wo5p30jsk2yb`
- `cmttre7pl0013wo5p0cspsub0`

## Impact

Le backend utilise `findFirst()` pour rechercher le tarif compatible.

La présence de plusieurs tarifs compatibles rend donc la sélection
non déterministe au niveau métier : le premier enregistrement retourné peut
varier selon l'ordre de restitution de la base.

Dans l'état actuel, les deux tarifs ont :

- le même `pricingModel` : `NEGOTIATED`
- la même `commissionPct` : `5`

Il n'y a donc pas d'écart fonctionnel observable sur la commission actuellement.

Cependant, une divergence future entre ces deux tarifs pourrait produire un
comportement différent selon le tarif sélectionné.

## Décision P7-E

Aucune suppression automatique n'est effectuée pendant P7-E.

Le nettoyage des données doit être réalisé séparément après validation métier,
en conservant un seul tarif actif pour chaque combinaison métier attendue.

## Recommandation

À terme, renforcer l'intégrité métier afin d'éviter plusieurs tarifs actifs
pour une même combinaison :

`Service + VehicleCategory + pricingModel`

Cette contrainte devra être traitée avec prudence car le schéma actuel ne porte
pas directement `organizationId` sur `ServiceTariff` : l'organisation est
indirectement portée par `BusinessActivity -> Service -> ServiceTariff`.

## Statut

- Doublon confirmé : OUI
- Correction automatique : NON
- Risque actuel : FAIBLE
- Dette de données : À NETTOYER
