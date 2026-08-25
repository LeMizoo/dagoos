#!/usr/bin/env bash
# =====================================================================
# Dagoos — Purge des secrets dans l'historique git
# =====================================================================
# À lancer À LA RACINE DE TON VRAI CLONE (celui qui contient .git/),
# PAS sur une copie extraite d'un zip.
#
# Ce script :
#  1. Vérifie que git-filter-repo est installé
#  2. Fait un backup du repo avant toute modification destructive
#  3. Supprime définitivement de TOUT l'historique :
#       - tmp/login.json (contient un JWT valide + email admin)
#       - apps/api/reset-admin.js (mot de passe en clair)
#       - apps/api/reset-super-admin.js (mot de passe + email perso en clair)
#       - le fichier parasite "how c6fc3de0 --stat"
#  4. Force-push vers origin (ÉCRASE l'historique distant)
#
# ⚠️ IMPORTANT — à lire avant de lancer :
#  - Ceci réécrit l'historique. Toute personne ayant un clone existant
#    devra re-cloner (ou faire un rebase compliqué). Prévenir l'équipe.
#  - Une fois ce script exécuté, les anciens secrets restent VALIDES
#    tant que tu ne les as pas changés en base (voir rotate-secrets.md).
#    La purge git n'annule pas le mot de passe/JWT, elle empêche juste
#    qu'on les retrouve dans l'historique public.
# =====================================================================

set -euo pipefail

echo "== Vérification de git-filter-repo =="
if ! command -v git-filter-repo &> /dev/null; then
  echo "git-filter-repo n'est pas installé."
  echo "Installation :"
  echo "  pip install git-filter-repo    (ou)"
  echo "  brew install git-filter-repo   (macOS)"
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "Erreur : ce dossier ne contient pas de .git/"
  echo "Lance ce script à la racine de ton vrai clone git, pas sur le zip extrait."
  exit 1
fi

echo "== Backup avant purge =="
BACKUP_DIR="../dagoos-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo "Backup créé dans : $BACKUP_DIR"

echo ""
echo "Fichiers qui vont être supprimés de TOUT l'historique :"
echo "  - tmp/login.json"
echo "  - apps/api/reset-admin.js"
echo "  - apps/api/reset-super-admin.js"
echo "  - 'how c6fc3de0 --stat'"
echo ""
read -p "Confirmer la purge ? (oui/non) " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

echo "== Purge de l'historique =="
git filter-repo --force \
  --path tmp/login.json --invert-paths \
  --path apps/api/reset-admin.js --invert-paths \
  --path apps/api/reset-super-admin.js --invert-paths \
  --path "how c6fc3de0 --stat" --invert-paths

echo ""
echo "== Purge terminée en local =="
echo ""
echo "Prochaines étapes MANUELLES :"
echo "  1. Vérifie que le repo est propre : git log --stat | grep -i login.json"
echo "  2. Force-push :"
echo "       git push origin --force --all"
echo "       git push origin --force --tags"
echo "  3. Préviens l'équipe : tout le monde doit re-cloner le repo."
echo "  4. Va lire rotate-secrets.md dans ce même dossier : la purge git"
echo "     seule NE SUFFIT PAS, il faut changer les vrais secrets en base."
