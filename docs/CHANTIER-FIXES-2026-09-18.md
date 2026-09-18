# Chantier fixes — 18/09/2026

## État de clôture

- Branche : `main`
- Build admin-next : validé
- Déploiement Vercel : validé

## Corrections réalisées

### 1. CTA landing — inscription / connexion

**Commit :** `74f33288`

Le CTA de la landing propose désormais les deux parcours :
- inscription ;
- connexion.

### 2. Inscription en modale

**Commit :** `c84a66a1`

Le parcours `/register` ouvre désormais la modale d'inscription depuis la landing.

### 3. Double `/api/proxy` sur les organisations

**Commit :** `a0a395bf`

Correction des URLs utilisées par le dashboard admin pour les opérations sur les organisations :

- suppression du double préfixe `/api/proxy` ;
- conservation du routage via le proxy API existant.

### 4. Casse des valeurs de plan

**Commit :** `a0a395bf`

Correction de la casse des plans afin d'utiliser les valeurs attendues :

- `Freemium`
- `Basic`
- `Standard`
- `Premium`

### 5. Option Basic manquante

**Commit :** `a0a395bf`

Ajout de l'option `Basic` dans les sélecteurs de plan des dashboards :

- Flottes
- Coopératives

### 6. Valeur par défaut Freemium

**Commit :** `a0a395bf`

Correction de la valeur par défaut des formulaires de création :

`Freemium`

au lieu de :

`FREEMIUM`

## Validation

Les vérifications effectuées le 18/09/2026 ont confirmé :

- working tree propre avant documentation ;
- `main` synchronisé avec `origin/main` ;
- présence des quatre plans `Freemium`, `Basic`, `Standard`, `Premium` ;
- valeur par défaut `Freemium` ;
- `npx tsc --noEmit` sans erreur ;
- build `admin-next` validé ;
- interface dashboard vérifiée avec les plans affichés correctement.

## Commits concernés

- `74f33288` — `fix(landing): CTA section propose inscription + connexion`
- `c84a66a1` — `feat(landing): transformer inscription en modale`
- `a0a395bf` — `fix(dashboard): corriger casse plan + ajouter option Basic + retirer double /api/proxy`

## Conclusion

Le chantier de corrections du 18/09/2026 est clôturé.

Aucune modification fonctionnelle supplémentaire n'est prévue dans ce chantier.
