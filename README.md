# Correctif sécurité Dagoos — mode d'emploi

Ordre d'exécution recommandé :

1. **Lis `rotate-secrets.md`** en entier avant de commencer — la purge git
   seule ne protège rien tant que les vrais secrets ne sont pas changés.

2. **Change le mot de passe et régénère le JWT_SECRET en premier**
   (sections 1 et 2 de `rotate-secrets.md`). Fais-le même avant de toucher au
   repo — c'est ce qui neutralise réellement le risque.

3. **Remplace les scripts vulnérables** dans `apps/api/` :
   - `reset-admin.js` → `reset-admin.fixed.js` (renomme-le `reset-admin.js`)
   - `reset-super-admin.js` → `reset-super-admin.fixed.js` (idem)

4. **Ajoute le contenu de `gitignore.additions.txt`** à la fin de ton
   `.gitignore` existant, et supprime `tmp/` du repo (`git rm -r tmp/`).

5. **Sur ton vrai clone local** (celui avec `.git/`, pas un zip téléchargé),
   lance `purge-secrets.sh`. Il te guide, fait un backup automatique, et
   demande confirmation avant toute action destructive.

6. Force-push, préviens l'équipe de re-cloner, vérifie les logs de ton
   hébergeur pour toute activité suspecte sur le token exposé.

Une fois ceci fait, on peut enchaîner sur les chantiers suivants de l'audit
(dédup coop/fleet, couche service API, tests) — dis-moi par lequel tu veux
continuer.
