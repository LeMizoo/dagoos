# P7-E — Performance du matching LONG_HAUL

## Constat

L'audit P7-E a vérifié le coût du matching automatique LONG_HAUL.

Le temps d'exécution SQL observé pour les requêtes ciblées est de l'ordre de :

- environ `0,3 ms` côté requête SQL

Le temps aller-retour global observé sur l'API est d'environ :

- `1,1 s`

## Analyse

L'écart important entre le temps SQL et le temps HTTP indique que le temps
principal n'est pas consommé par la recherche relationnelle elle-même.

L'environnement utilise Supabase PostgreSQL avec un pooler.

La latence réseau / connexion entre l'API et PostgreSQL constitue donc une
piste principale pour expliquer l'écart entre le coût SQL et le temps
d'exécution HTTP.

## Décision P7-E

Aucune optimisation prématurée du matching n'est appliquée.

Les requêtes actuelles restent lisibles et conformes au besoin fonctionnel.

## P8 — Investigation recommandée

Une analyse dédiée pourra mesurer séparément :

1. temps de connexion/acquisition de connexion ;
2. temps d'exécution SQL ;
3. temps du matching des organisations ;
4. temps de récupération des tarifs ;
5. temps de broadcast ;
6. temps de traitement HTTP total.

L'objectif sera d'identifier précisément la source de la latence avant toute
optimisation.

## Statut

- Performance SQL : satisfaisante
- Performance HTTP : à surveiller
- Optimisation immédiate : NON
- Investigation détaillée : P8
