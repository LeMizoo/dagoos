# O1 — AUDIT PRISMA / POSTGRESQL

**Projet :** Dagoos / Dago Mobility
**Phase :** 4 — Décision technique O1 + S3
**Statut :** Décision figée et appliquée en base
**Date :** 2026-09-24
**Prérequis :** SERVICE_TARIFF_V2_ARBITRAGE.md v1.0, SERVICE_TARIFF_V2_TARGET_MAP.md v1.0

---

## 1. Objet

Ce document acte la décision technique prise pour garantir un déterminisme tarifaire fiable en base de données, dans le cadre du chantier ServiceTariff V2.

Il documente :
- le problème initial (dimensions optionnelles, NULL PostgreSQL) ;
- les options envisagées (O1/O2/O3/O4) ;
- la stratégie d'unicité retenue (S3) ;
- la mise en oeuvre effective (SQL exécuté) ;
- la stratégie de sortie pour MARCHANDISES (M3).

Il sert de référence pour :
- toute future évolution du schéma ServiceTariff ;
- toute migration Prisma concernant ServiceTariff ;
- la résolution ultérieure de M3.

---

## 2. Environnement technique (audit réel)

| Élément | Valeur |
|---|---|
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Prisma CLI | 5.22.0 |
| @prisma/client | 5.22.0 |
| Provider Prisma | postgresql |
| PostgreSQL | 17.6 (x86_64-pc-linux-gnu, gcc 15.2.0) |
| Base de données | postgres |
| Utilisateur | postgres |
| Droit CREATE | OUI |
| directUrl | configuré (Supabase) |

Extensions PostgreSQL disponibles :
- btree_gin 1.3 (non installée)
- btree_gist 1.7 (non installée)
- pgcrypto 1.3 (installée)
- uuid-ossp 1.1 (installée)

Migrations Prisma présentes :
- 20260914090622_add_versement_driver_relation
- 20260921131200_change_org_status_default_to_active
- Pas de migration_lock.toml -> usage partiel de prisma migrate et de db push.

---

## 3. Problème initial

### 3.1 Constat

ServiceTariff utilisait :
- serviceId
- vehicleCategoryId (nullable)
- pricingModel
- configuration (jsonb libre)
- plusieurs colonnes numériques (basePrice, unitPrice, etc.)

Aucune contrainte d'unicité métier. Le code applicatif utilisait findFirst() avec :
- serviceId
- vehicleCategoryId
- pricingModel

provoquant :
- des sélections arbitraires en présence de plusieurs tarifs compatibles ;
- des ambiguïtés invisibles (ex : LIVRAISON x4 variantes zone/mode) ;
- un doublon strict sur MARCHANDISES (2 tarifs identiques en clé).

### 3.2 Contrainte PostgreSQL sur NULL

PostgreSQL considère NULL != NULL dans une contrainte UNIQUE.
Un @@unique([..., zone, mode, ...]) avec colonnes nullables :
- ne détecte pas les doublons quand les dimensions sont NULL ;
- ne garantit pas le déterminisme pour les services sans dimensions.

---

## 4. Options envisagées

| Option | Principe | Verdict |
|---|---|---|
| O1 | Colonnes explicites (modePrestation, zone, mode, categorie) | RETENUE (candidat principal) |
| O2 | Table ServiceTariffDimension (1-N) | Écartée (complexité disproportionnée) |
| O3 | Colonne dimensionKey unique | RETENUE (stratégie d'unicité S3) |
| O4 | configuration typée + validation applicative | Écartée (reproduit le problème) |

---

## 5. Stratégie d'unicité retenue

### 5.1 Décision O1 + S3

- O1 : ajout de 4 colonnes de dimensions explicites (nullable).
- S3 : ajout d'une colonne dimensionKey normalisée, JAMAIS NULL.
- @@unique composite : (serviceId, vehicleCategoryId, pricingModel, dimensionKey).

### 5.2 Règle dimensionKey

- Format : "dim1=v1|dim2=v2|..."
- Ordre fixe : modePrestation, zone, mode, categorie.
- Absence de dimension : omise dans la chaîne.
- Chaîne vide "" si aucune dimension.
- Jamais NULL.

### 5.3 Pourquoi dimensionKey résout le problème NULL

Deux tarifs identiques en clé avec dimensions NULL produisent la même dimensionKey ("") et sont donc rejetés par la contrainte unique.
Aucun wildcard implicite. Aucune ambiguïté.

---

## 6. Mise en oeuvre effective (SQL exécuté)

### 6.1 Backup

ServiceTariff_backup_20260924 - copie intégrale des 34 tarifs avant modification.

### 6.2 Colonnes ajoutées

- modePrestation (text, nullable)
- zone (text, nullable)
- mode (text, nullable)
- categorie (text, nullable)
- dimensionKey (text, NOT NULL)
- excludeFromUnique (boolean, NOT NULL, default false)

### 6.3 vehicleCategoryId

Passe de nullable à NOT NULL.

### 6.4 Remplissage

- zone, mode, categorie extraits depuis configuration.
- modePrestation déduit pour TAXI (NEGOTIATED -> adyVarotra ; PER_KM -> normal).
- dimensionKey construit par CONCAT_WS.

### 6.5 Contrainte unique partielle

PostgreSQL interdit les sous-requêtes dans un index partiel. La stratégie utilise donc une colonne explicite excludeFromUnique.

Index créé :

CREATE UNIQUE INDEX "ServiceTariff_unique_dim"
ON public."ServiceTariff"
USING btree ("serviceId", "vehicleCategoryId", "pricingModel", "dimensionKey")
WHERE active = true AND "excludeFromUnique" = false;

### 6.6 Répartition

- 34 tarifs migrés.
- 32 tarifs soumis à la contrainte d'unicité.
- 2 tarifs MARCHANDISES exclus temporairement (excludeFromUnique = true).

---

## 7. Cas M3 — MARCHANDISES

Constat : deux tarifs identiques en clé.
- CAMION + NEGOTIATED + dimensionKey = ""
- basePrice 20000 / unitPrice 2500
- basePrice 10000 / unitPrice 1500

La dimension métier les distinguant n'est pas identifiée.

Décision : blocage explicite jusqu'à résolution métier.
Aucune déduction automatique à partir des prix.
excludeFromUnique = true est temporaire et documenté.

---

## 8. Tests passés

- Test de détection de doublon sur TAXI : erreur unique_violation attendue et obtenue.
- Test MARCHANDISES hors contrainte : insertion possible (exclusion active).
- Vérification état final : 34 tarifs, 2 exclus, 32 inclus.
- Vérification résidus : 0 ligne test_*.

---

## 9. Conséquences pour Prisma

- Prisma ne supporte pas nativement les index partiels.
- @@unique Prisma ne reflétera pas exactement l'index SQL custom.
- La représentation dans schema.prisma doit être documentaire, avec un commentaire explicite.
- Toute migration Prisma doit préserver l'index custom (interdiction de le dropper).

### Règle d'or

Toute future évolution du schéma ServiceTariff doit vérifier la présence et le maintien de l'index SQL custom ServiceTariff_unique_dim.

---

## 10. Stratégie de sortie M3

Lorsque la dimension métier manquante sera identifiée :

1. Ajouter la colonne / dimension correspondante.
2. Recalculer dimensionKey pour les 2 tarifs MARCHANDISES.
3. Repasser excludeFromUnique à false.
4. Re-vérifier l'absence de doublon.
5. Documenter dans ARBITRAGE et TARGET_MAP.

Aucune suppression de l'index partiel tant que M3 n'est pas résolue.

---

## 11. Décision finale

| Champ | Valeur |
|---|---|
| Option structurelle | O1 (colonnes explicites) |
| Stratégie d'unicité | S3 (dimensionKey normalisée) |
| Contrainte | UNIQUE PARTIEL (serviceId, vehicleCategoryId, pricingModel, dimensionKey) |
| vehicleCategoryId | NOT NULL |
| Extensions requises | Aucune (pgcrypto, uuid-ossp déjà présentes) |
| Migration SQL custom | Oui, 1 migration appliquée et validée |
| Statut M3 | BLOQUÉ (excludeFromUnique temporaire) |
| Impact Prisma | Documentation + commentaire ; index préservé |

O1 + S3 — Décision figée et appliquée.

---

## 12. Prochaine étape

Phase 5 — Mise à jour de schema.prisma pour refléter la base.

Contrainte : préserver l'index SQL custom ServiceTariff_unique_dim.
Interdiction : ne pas lancer prisma db pull avant d'avoir validé le rôle de cet index.

Phase 5 — Prête à démarrer.
