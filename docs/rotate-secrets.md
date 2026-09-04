# Rotation des secrets — Dagoos

La purge de l'historique git (`purge-secrets.sh`) empêche de **retrouver** les
secrets dans le repo. Elle ne les **invalide pas**. Tant que ces étapes ne
sont pas faites, les identifiants trouvés restent utilisables par quiconque
les a déjà vus (fork, clone existant, cache GitHub, etc.).

## 1. Mot de passe réutilisé (`[MOT_DE_PASSE_EXPOSÉ]`)

Trouvé en clair dans `reset-admin.js` et `reset-super-admin.js`, associé à
`tovoniaina.rahendrison@gmail.com` (et un compte `admin@dagoos.mg` avec
`[MOT_DE_PASSE_EXPOSÉ]`).

- [ ] Changer ce mot de passe dans la base Dagoos (via un script one-shot,
      pas un fichier versionné — voir section 3)
- [ ] Si ce mot de passe est réutilisé ailleurs (email perso, autres
      services), le changer aussi là-bas
- [ ] Supprimer/désactiver le compte `admin@dagoos.mg / [MOT_DE_PASSE_EXPOSÉ]` s'il ne
      sert à rien de spécifique — un mot de passe aussi simple ne devrait
      jamais exister, même temporairement

## 2. JWT_SECRET

Le token dans `tmp/login.json` était signé avec le `JWT_SECRET` de
production, pour un compte `SUPER_ADMIN`, valide jusqu'en septembre 2026.

- [ ] Générer un nouveau secret fort : `openssl rand -hex 64`
- [ ] Le mettre à jour dans les variables d'environnement de production
      (Vercel pour `admin-next`, ton hébergeur pour `apps/api`)
- [ ] Redéployer — ceci invalide automatiquement TOUS les tokens émis
      avant le changement, y compris celui exposé
- [ ] Vérifier qu'aucun autre endroit ne référence l'ancien secret en dur

## 3. Remplacer les scripts par une version sans secrets en dur

Les fichiers `reset-admin.js` / `reset-super-admin.js` sont refaits pour lire
depuis l'environnement plutôt que d'avoir les valeurs écrites dans le code
(voir `reset-admin.fixed.js` et `reset-super-admin.fixed.js` dans ce dossier).

Usage après remplacement :

```bash
SUPER_ADMIN_EMAIL="..." SUPER_ADMIN_PASSWORD="..." node reset-super-admin.js
```

Ces valeurs se passent en ligne de commande ou via un fichier `.env` local
(déjà dans `.gitignore`), jamais commitées.

## 4. Nettoyage du `.gitignore`

`tmp/` n'était pas ignoré — c'est ce qui a permis à `login.json` de finir
dans le repo. Le `.gitignore.patch` fourni ajoute :
- `tmp/`
- tout fichier `*login.json`, `*token*.json` par précaution

## 5. Audit rapide post-rotation

- [ ] Chercher d'autres occurrences de secrets en dur : `grep -rniE
      "(password|secret|token)\s*[:=]\s*['\"]" apps/ admin-next/src/ --include="*.js" --include="*.ts"`
      (en excluant node_modules) et vérifier chaque résultat
- [ ] Vérifier les logs Vercel / hébergeur : est-ce que le token exposé a
      été utilisé récemment par une IP inconnue ?
