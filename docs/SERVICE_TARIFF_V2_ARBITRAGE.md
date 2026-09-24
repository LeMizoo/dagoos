# SERVICE TARIFF V2 — DOCUMENT D'ARBITRAGE

**Projet :** Dagoos / Dago Mobility
**Phase :** 3 — Arbitrage architectural et métier
**Statut :** Référence validée pour les phases suivantes
**Date :** 2026-09-24

---

## 1. Objet

Ce document définit la cible métier et architecturale du système tarifaire V2.

Il constitue le contrat de référence pour :

* la cartographie technique ;
* la conception des API V2 ;
* l'administration des tarifs ;
* la migration progressive V1 → V2 ;
* l'évolution du moteur de pricing ;
* la suppression progressive du modèle tarifaire legacy V1.

Aucune modification de code ou de données ne doit contredire les décisions de ce document sans nouvel arbitrage explicite.

---

# 2. Principes directeurs

## 2.1 Source de vérité cible

`ServiceTariff` V2 devient à terme la source de vérité unique pour les tarifs.

Le modèle V1 `Tarif.vehiculeTarifs` est considéré comme une architecture de transition.

La coexistence V1/V2 est autorisée uniquement pendant la migration.

---

## 2.2 Migration progressive

La migration ne sera pas effectuée en « big bang ».

Chaque parcours tarifaire est migré séparément lorsque sa configuration V2 est complète, déterministe et validée.

Une fois un parcours migré :

* V2 devient sa source de vérité ;
* V1 n'est plus utilisé pour ce parcours ;
* la configuration V1 correspondante peut ensuite être retirée.

---

## 2.3 Déterminisme tarifaire

Pour un parcours donné, une requête de sélection tarifaire doit identifier exactement un tarif.

Aucun `findFirst()` ne doit pouvoir choisir arbitrairement entre plusieurs `ServiceTariff` compatibles.

Les dimensions qui influencent le prix doivent être explicitement identifiées et sélectionnables.

---

# 3. Décisions Q1 à Q8

| Question                   | Décision                                                                                                            | Statut |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| Q1 — V1/V2 court terme     | Migration progressive parcours par parcours, avec activation V2 uniquement lorsqu'une configuration complète existe | Décidé |
| Q2 — Clé tarifaire         | Dimensions tarifaires explicites et sélection déterministe                                                          | Décidé |
| Q3 — Administration        | Organisation pour ses propres tarifs ; plateforme pour le référentiel global                                        | Décidé |
| Q4 — Création des services | Modèle hybride : services obligatoires automatiques, services spécialisés opt-in                                    | Décidé |
| Q5 — VehicleCategory       | Référentiel global plateforme                                                                                       | Décidé |
| Q6 — Anti-divergence       | Une seule source active par parcours ; contrôle de divergence pendant transition                                    | Décidé |
| Q7 — Suppression V1        | Progressive par service/parcours                                                                                    | Décidé |
| Q8 — Sortie Phase 3        | Matrice, permissions, source de vérité et flux de transition explicitement définis                                  | Décidé |

---

# 4. Décisions M1 à M6

| Référence | Décision                                                                                            | Statut  |
| --------- | --------------------------------------------------------------------------------------------------- | ------- |
| M1        | `TAXI` distingue `normal` et `adyVarotra` par une dimension `modePrestation`                        | Décidé  |
| M2        | `LIVRAISON` utilise les dimensions `zone` et `mode`                                                 | Décidé  |
| M3        | Les deux tarifs `MARCHANDISES` restent provisoirement non fusionnés ; dimension métier à identifier | Différé |
| M4        | `DEPANNAGE` et `LOCATION_INTERURBAINE` restent deux services distincts                              | Décidé  |
| M5        | `TRANSPORT_COMMUN` utilise `zone` comme dimension explicite                                         | Décidé  |
| M6        | `LOCATION_VOITURE` utilise `categorie` comme dimension explicite                                    | Décidé  |

---

# 5. Architecture cible

```text
                         ┌─────────────────────────┐
                         │ RÉFÉRENTIEL PLATEFORME  │
                         ├─────────────────────────┤
                         │ VehicleCategory         │
                         │ Catalogue Service       │
                         │ Pricing Models          │
                         │ Règles globales         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ ORGANISATION             │
                         ├─────────────────────────┤
                         │ BusinessActivity         │
                         │ Services activés         │
                         │ ServiceTariff            │
                         │ Dimensions tarifaires   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ PRICING / SÉLECTION     │
                         │ déterministe             │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ PARCOURS MÉTIER         │
                         │ estimate / actions / ...│
                         └─────────────────────────┘
```

---

# 6. Transition V1 → V2

```text
                    PARCOURS TARIFAIRE
                           │
                ┌──────────┴──────────┐
                │                     │
          V2 non prête           V2 complète
                │                     │
                ▼                     ▼
             SOURCE V1          VALIDATION V2
                                      │
                                      ▼
                               BASCULE V2
                                      │
                                      ▼
                              SOURCE V2 UNIQUE
                                      │
                                      ▼
                             RETRAIT V1 local
```

La présence d'une `BusinessActivity` seule ne suffit pas à déclencher une bascule.

Un parcours est éligible lorsque sa configuration V2 permet une sélection complète et déterministe.

---

# 7. Administration cible

## 7.1 SUPER_ADMIN

Le `SUPER_ADMIN` administre le référentiel plateforme :

* `VehicleCategory` ;
* catalogue des services ;
* modèles de pricing autorisés ;
* règles globales ;
* capacités disponibles par activité.

Le `SUPER_ADMIN` peut également intervenir sur les configurations d'organisation selon les besoins d'administration de la plateforme.

---

## 7.2 FLEET_MANAGER / COOP_MANAGER

Chaque gestionnaire peut administrer uniquement son organisation :

* `BusinessActivity` ;
* services activés ;
* `ServiceTariff` ;
* dimensions tarifaires de ses services.

L'isolation organisationnelle est obligatoire côté backend.

Un utilisateur d'une organisation ne doit jamais pouvoir lire ou modifier les tarifs d'une autre organisation en fournissant simplement un autre `organizationId`.

---

# 8. VehicleCategory

`VehicleCategory` reste un référentiel global.

Exemples :

```text
MOTO
VOITURE
BUS
MINIVAN
TRICYCLE
FOURGON
CAMION
SEMI_REMORQUE
CAMION_FRIGO
DEPANNEUSE
```

Une organisation ne crée pas sa propre catégorie concurrente.

Les `ServiceTariff` font référence aux catégories globales.

---

# 9. Création des services

Le modèle retenu est hybride.

## 9.1 À la création d'une activité

Une `BusinessActivity` est créée automatiquement selon le type d'organisation.

Des services standards peuvent être proposés automatiquement.

## 9.2 Services obligatoires

Les services considérés comme obligatoires pour une activité peuvent être activés automatiquement.

## 9.3 Services spécialisés

Les services spécialisés nécessitent une activation ou configuration explicite.

La création automatique d'une activité ne doit donc pas créer arbitrairement toute une matrice de tarifs.

---

# 10. Matrice métier cible

## 10.1 TAXI — URBAN

| VehicleCategory | Dimension                   | Pricing Model |
| --------------- | --------------------------- | ------------- |
| MOTO            | `modePrestation=normal`     | `PER_KM`      |
| MOTO            | `modePrestation=adyVarotra` | `NEGOTIATED`  |
| VOITURE         | `modePrestation=normal`     | `PER_KM`      |
| VOITURE         | `modePrestation=adyVarotra` | `NEGOTIATED`  |

`modePrestation` distingue le mode commercial.

---

## 10.2 LOCATION_URBAINE — URBAN

| VehicleCategory | Dimension | Pricing Model |
| --------------- | --------- | ------------- |
| MOTO            | aucune    | `PER_DAY`     |
| VOITURE         | aucune    | `PER_DAY`     |
| BUS             | aucune    | `FIXED`       |
| MINIVAN         | aucune    | `FIXED`       |
| TRICYCLE        | aucune    | `FIXED`       |

---

## 10.3 LIVRAISON — INTERURBAN

| VehicleCategory | Zone        | Mode            | Pricing Model |
| --------------- | ----------- | --------------- | ------------- |
| FOURGON         | `regionale` | `courseNormale` | `PER_KM`      |
| FOURGON         | `regionale` | `courseExpress` | `PER_KM`      |
| FOURGON         | `nationale` | `courseNormale` | `PER_KM`      |
| FOURGON         | `nationale` | `courseExpress` | `PER_KM`      |

Les dimensions `zone` et `mode` sont obligatoires pour la sélection.

---

## 10.4 TRANSPORT_COMMUN — INTERURBAN

| VehicleCategory | Zone        | Pricing Model |
| --------------- | ----------- | ------------- |
| BUS             | `regionale` | `FIXED`       |
| BUS             | `nationale` | `FIXED`       |

---

## 10.5 MARCHANDISES — INTERURBAN

État actuel :

```text
CAMION + MARCHANDISES_GENERALES + NEGOTIATED
    ├── tarif A
    └── tarif B
```

La dimension qui distingue les deux tarifs n'est pas encore déterminée.

### Règle

Aucune migration définitive de ces tarifs ne doit être effectuée avant identification de cette dimension.

Cette décision est volontairement différée.

---

## 10.6 FRET — INTERURBAN

| VehicleCategory | Configuration observée | Pricing Model |
| --------------- | ---------------------- | ------------- |
| CAMION          | `FRET_LOURD`           | `NEGOTIATED`  |
| SEMI_REMORQUE   | `FRET_LOURD`           | `NEGOTIATED`  |

La signification de `FRET_LOURD` devra être formalisée lors de la cartographie technique avant migration.

---

## 10.7 DEPANNAGE — INTERURBAN

| VehicleCategory | Dimension           | Pricing Model |
| --------------- | ------------------- | ------------- |
| DEPANNEUSE      | aucune actuellement | `NEGOTIATED`  |

---

## 10.8 LOCATION_INTERURBAINE — INTERURBAN

| VehicleCategory | Dimension | Pricing Model |
| --------------- | --------- | ------------- |
| BUS             | aucune    | `PER_KM`      |
| MINIVAN         | aucune    | `PER_KM`      |
| FOURGON         | aucune    | `PER_KM`      |
| CAMION          | aucune    | `PER_KM`      |
| SEMI_REMORQUE   | aucune    | `PER_KM`      |
| CAMION_FRIGO    | aucune    | `PER_KM`      |
| DEPANNEUSE      | aucune    | `NEGOTIATED`  |

`DEPANNEUSE` reste distinct de `DEPANNAGE` car le service métier est différent.

---

## 10.9 LOCATION_VOITURE — INTERURBAN

| VehicleCategory | Catégorie     | Pricing Model |
| --------------- | ------------- | ------------- |
| VOITURE         | `touristique` | `PER_DAY`     |
| VOITURE         | `familiale`   | `PER_DAY`     |
| VOITURE         | `autres`      | `PER_DAY`     |

---

# 11. Dimensions tarifaires

Les dimensions actuellement retenues sont :

| Dimension        | Services concernés          | Valeurs observées                    |
| ---------------- | --------------------------- | ------------------------------------ |
| `modePrestation` | TAXI                        | `normal`, `adyVarotra`               |
| `zone`           | LIVRAISON, TRANSPORT_COMMUN | `regionale`, `nationale`             |
| `mode`           | LIVRAISON                   | `courseNormale`, `courseExpress`     |
| `categorie`      | LOCATION_VOITURE            | `touristique`, `familiale`, `autres` |

D'autres dimensions pourront être ajoutées uniquement lorsqu'une nécessité métier réelle est identifiée.

---

# 12. Pricing Models

Les modèles actuellement reconnus sont :

```text
PER_KM
FIXED
NEGOTIATED
BAREME
PER_DAY
```

Le modèle de pricing ne doit pas être utilisé comme substitut à une dimension métier.

Exemple :

```text
TAXI + MOTO + normal
    → PER_KM

TAXI + MOTO + adyVarotra
    → NEGOTIATED
```

`pricingModel` décrit la méthode de calcul.

`modePrestation` décrit le contexte commercial.

---

# 13. Règle de déterminisme

Pour chaque parcours :

```text
Service
+
VehicleCategory
+
Dimensions applicables
+
Pricing Model lorsque nécessaire
=
exactement un ServiceTariff
```

Une requête ne doit jamais sélectionner arbitrairement le premier tarif correspondant.

Un `findFirst()` sans les dimensions nécessaires est interdit dans le futur moteur de sélection V2.

---

# 14. Modélisation Prisma — principe

Le principe d'ajouter des colonnes explicites pour certaines dimensions est retenu.

Cependant, la contrainte suivante n'est **pas** considérée comme validée telle quelle :

```prisma
@@unique([
  serviceId,
  vehicleCategoryId,
  pricingModel,
  zone,
  mode,
  categorie
])
```

Les raisons sont notamment :

* dimensions optionnelles ;
* comportement des valeurs `NULL` ;
* dimensions applicables seulement à certains services ;
* besoin éventuel de contraintes conditionnelles ;
* nécessité de distinguer la clé métier de la structure physique Prisma.

La modélisation Prisma définitive sera décidée pendant la cartographie technique.

---

# 15. Anti-divergence V1 / V2

Pendant la transition :

* un parcours peut temporairement utiliser V1 ;
* un autre peut utiliser V2 ;
* un même parcours ne doit pas avoir deux sources tarifaires actives.

Une fois le parcours migré :

```text
V2 = source de vérité
V1 = inactive pour ce parcours
```

Un mécanisme de diagnostic peut détecter les divergences pendant la transition.

La synchronisation automatique permanente V1 ↔ V2 n'est pas retenue.

---

# 16. Suppression de `vehiculeTarifs`

La suppression est progressive.

Pour un service donné :

```text
V1 utilisé
    ↓
V2 configurée
    ↓
consommateurs basculés
    ↓
tests validés
    ↓
V1 inutilisée pour ce service
    ↓
suppression / neutralisation V1
```

Il n'est pas nécessaire d'attendre la migration de toute la plateforme.

---

# 17. Parcours de migration

La migration devra suivre ce principe :

1. identifier les consommateurs V1 ;
2. identifier la configuration V2 correspondante ;
3. construire la matrice métier ;
4. détecter les ambiguïtés ;
5. valider les données ;
6. créer/configurer V2 ;
7. tester la sélection ;
8. basculer le parcours ;
9. vérifier l'isolation organisationnelle ;
10. neutraliser la dépendance V1 ;
11. supprimer ultérieurement le legacy devenu inutile.

Aucune migration destructive ne doit précéder un dry-run et une validation des résultats.

---

# 18. Prérequis avant implémentation

Les éléments suivants doivent être réalisés avant toute modification importante du système tarifaire.

## Données

* inventaire complet des `ServiceTariff` ;
* identification des doublons ;
* résolution métier de `MARCHANDISES` ;
* identification des configurations historiques ;
* comparaison V1/V2 par organisation.

## Backend

* cartographie de tous les lecteurs V1 ;
* cartographie de tous les lecteurs V2 ;
* cartographie du `pricingEngine` ;
* identification des routes nécessitant une bascule ;
* conception des permissions V2 ;
* conception des API CRUD V2.

## Base de données

* conception définitive de la clé tarifaire ;
* validation des contraintes d'unicité ;
* validation des dimensions ;
* stratégie de migration ;
* stratégie de rollback.

## Frontend

* cartographie des écrans tarifaires existants ;
* identification des écrans encore V1 ;
* conception de l'administration V2 ;
* respect de l'isolation organisationnelle côté API.

## Tests

* sélection tarifaire ;
* absence d'ambiguïté ;
* isolation entre organisations ;
* chaque modèle de pricing ;
* chaque dimension ;
* parcours V1 ;
* parcours V2 ;
* transition V1 → V2.

---

# 19. Critère de sortie de la Phase 3

La Phase 3 est considérée comme terminée lorsque :

* Q1 à Q8 sont arbitrées ;
* M1 à M6 sont arbitrées ou explicitement différées ;
* la cible V2 est définie ;
* les parcours V1/V2 sont identifiés ;
* la source de vérité de chaque parcours est définie ;
* les dimensions tarifaires connues sont définies ;
* les rôles d'administration sont définis ;
* `VehicleCategory` est défini comme référentiel global ;
* le mécanisme de transition est défini ;
* le cas `MARCHANDISES` est explicitement marqué comme décision métier différée ;
* aucune migration destructive n'est autorisée sans validation préalable.

---

# 20. Phase suivante

La prochaine phase est la **cartographie technique fichier par fichier**.

Elle devra notamment couvrir :

```text
schema.prisma
    ↓
BusinessActivity / Service / VehicleCategory / ServiceTariff
    ↓
API organizations
API tarifs
API public
pricingEngine
API actions
API estimate
API estimate-location
    ↓
admin-next
    ↓
settings
    ↓
migration V1 → V2
```

Pour chaque fichier :

* rôle actuel ;
* lecture V1/V2 ;
* écriture V1/V2 ;
* dépendances ;
* comportement actuel ;
* modification nécessaire ;
* risque ;
* tests requis.

**Aucun code n'est modifié pendant cette cartographie.**