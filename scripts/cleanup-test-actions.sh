#!/bin/bash
# ============================================
# NETTOYAGE DES LEAD ACTIONS DE TEST LONG_HAUL
# ============================================

TOKEN=$(curl -s -X POST https://dagoos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dagoos.mg","password":"DagoAdmin2026Secure"}' \
  | python -c "import sys, json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentification échouée"
  exit 1
fi

echo "🧹 NETTOYAGE DES LEAD ACTIONS DE TEST"
echo "========================================"

# Récupérer les actions de test
ACTIONS=$(curl -s "https://dagoos-api.onrender.com/api/actions?type=LONG_HAUL&limit=100" \
  -H "Authorization: Bearer $TOKEN")

# Compter
TOTAL=$(echo "$ACTIONS" | python -c "
import sys, json
actions = json.load(sys.stdin)
if isinstance(actions, list):
    tests = [a for a in actions if a.get('clientNom') == 'Test Auto']
    print(len(tests))
")

echo "Actions de test trouvées : $TOTAL"

# Supprimer les actions de test
echo "$ACTIONS" | python -c "
import sys, json
actions = json.load(sys.stdin)
tests = [a for a in actions if a.get('clientNom') == 'Test Auto']
for a in tests:
    print(a['id'])
" | while read action_id; do
  curl -s -X DELETE "https://dagoos-api.onrender.com/api/actions/$action_id" \
    -H "Authorization: Bearer $TOKEN" \
    > /dev/null 2>&1
  echo "✅ Supprimé : $action_id"
done

echo ""
echo "🟢 Nettoyage terminé"
