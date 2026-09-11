# P8-A — Doublons ServiceTariff

## Contexte

L'audit P8-A a identifié **4 groupes de ServiceTariff** qui partagent
le même triplet `(Service, VehicleCategory, pricingModel)`.

Sur ces 4 groupes, **3 sont légitimes** (configurations métier
distinctes) et **1 présente une ambiguïté réelle**.

## Inventaire

| # | Service | VehicleCategory | pricingModel | Nombre | Org |
|---|---|---|---|---|---|
| 1 | `LIVRAISON` | `FOURGON` | `PER_KM` | 4 | SONATRA |
| 2 | `LOCATION_VOITURE` | `VOITURE` | `PER_DAY` | 3 | SONATRA |
| 3 | `TRANSPORT_COMMUN` | `BUS` | `FIXED` | 2 | SONATRA |
| 4 | `MARCHANDISES` | `CAMION` | `NEGOTIATED` | 2 | SONATRA |

## Analyse groupe par groupe

### Groupe 1 — LIVRAISON / FOURGON / PER_KM — ✅ LÉGITIME

**4 configurations métier distinctes :**

- régionale + normale
- régionale + express
- nationale + normale
- nationale + express

Chaque configuration a un tarif différent. Ce ne sont **pas des doublons
techniques**.

**Verdict :** à conserver.

### Groupe 2 — LOCATION_VOITURE / VOITURE / PER_DAY — ✅ LÉGITIME

**3 catégories de location :**

- touristique → 60 000 MGA
- familiale → 45 000 MGA
- autres → 35 000 MGA

**Verdict :** à conserver.

### Groupe 3 — TRANSPORT_COMMUN / BUS / FIXED — ✅ LÉGITIME

**2 zones distinctes :**

- régionale → 4 000 MGA
- nationale → 8 000 MGA

**Verdict :** à conserver.

### Groupe 4 — MARCHANDISES / CAMION / NEGOTIATED — 🔴 AMBIGUÏTÉ

**2 configurations concurrentes sur la même combinaison fonctionnelle :**

| ID | basePrice | unitPrice | pricingModel | configuration |
|---|---|---|---|---|
| `cmttre6ua0011wo5p30jsk2yb` | 10 000 | 1 500 | NEGOTIATED | MARCHANDISES_GENERALES |
| `cmttre7pl0013wo5p0cspsub0` | 20 000 | 2 500 | NEGOTIATED | MARCHANDISES_GENERALES |

**Impact :** `findFirst()` non déterministe → le prix estimé peut
varier entre deux appels identiques.

**Ce n'est PAS un vrai doublon technique** : les valeurs sont
différentes. Mais c'est une **ambiguïté métier** : deux tarifs pour
une même configuration fonctionnelle.

**Verdict :** 🔴 **décision métier requise**.

## Référencement

**Aucune FK directe vers ServiceTariff** dans le schéma Prisma actuel.

Les références passent par `Service` (partagé) ou `VehicleCategory`.

**Conséquence technique :** supprimer un ServiceTariff en doublon
est sans risque de casse FK.

**MAIS** : l'absence de FK **ne signifie PAS** l'absence d'impact métier.

Un ServiceTariff peut être sélectionné **dynamiquement** par le code
via `findFirst` ou `findMany`. C'est précisément le cas de
MARCHANDISES/CAMION/NEGOTIATED.

## Décision P8-A

| # | Action |
|---|---|
| 1 | Aucune suppression automatique |
| 2 | Les 3 groupes légitimes sont conservés |
| 3 | Le groupe 4 est transmis à P8-A2 pour décision métier |
| 4 | Aucune modification DB/code en P8-A |

## P8-A2 — WAITING_BUSINESS_DECISION

**Question à poser à SONATRA :**

Pour les demandes `MARCHANDISES` avec `CAMION`, quelle configuration
tarifaire doit rester active ?

- **A** — `10 000 MGA` (base) + `1 500 MGA/unité`
- **B** — `20 000 MGA` (base) + `2 500 MGA/unité`
- **C** — Autre configuration

**En attendant :** le système conserve les deux tarifs actifs.

**Aucune action technique tant que la décision métier n'est pas tranchée.**

## Recommandations futures

1. **Contrainte base** : à terme, ajouter une contrainte d'unicité
   sur `(Service, VehicleCategory, pricingModel, configuration.sous_type)`
   pour éviter de futurs doublons accidentels.

2. **Distinction explicite** : si plusieurs configurations légitimes
   doivent coexister (comme LIVRAISON/FOURGON), il faut ajouter un
   champ discriminant (`configuration.zone`, `configuration.type`, etc.).

3. **Documentation** : tracer les 4 groupes dans un doc dédié
   (ce fichier) pour référence future.

## Statut final

| Dimension | Valeur |
|---|---|
| Audit P8-A | 🟢 CLOSED |
| Doublons détectés | 4 groupes / 11 tarifs |
| Vrais doublons techniques | Aucun |
| Configurations légitimes | 3 groupes |
| Ambiguïté métier | 1 groupe (MARCHANDISES/CAMION/NEGOTIATED) |
| Correction automatique | ❌ Non |
| Modification DB | ❌ Aucune |
| Décision métier SONATRA | ⏳ P8-A2 |
| Statut P8-A2 | 🔴 WAITING_BUSINESS_DECISION |