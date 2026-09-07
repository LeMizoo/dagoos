#!/bin/bash
# ============================================
# TEST E2E COMPLET LONG_HAUL
# Création → Notification → Acceptation → Course → Nettoyage
# ============================================

API_URL="https://dagoos-api.onrender.com/api"
PASS=0
FAIL=0
ERRORS=()

echo "🧪 TEST E2E LONG_HAUL COMPLET"
echo "========================================"

# 1. LOGIN ADMIN (pour le nettoyage)
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dagoos.mg","password":"DagoAdmin2026Secure"}' \
  | python -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Échec login admin"
  exit 1
fi
echo "✅ Admin login OK"

# 2. TEST POSITIF : Passagers + BUS
echo ""
echo "===== TEST 1 : PASSAGERS + BUS (VALIDE) ====="

# 2a. Créer la demande
RESPONSE=$(curl -s -X POST "$API_URL/public/actions" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "organizationSlug": "sonatra",
    "type": "LONG_HAUL",
    "clientNom": "E2E Passagers",
    "clientTel": "0340000000",
    "details": {
      "typeVehicule": "bus",
      "typeService": "passagers",
      "nbPassagers": 3,
      "depart": "Antananarivo",
      "arrivee": "Toamasina"
    }
  }')

ACTION_ID=$(echo "$RESPONSE" | python -c "import sys,json; print(json.load(sys.stdin).get('actionId',''))")

if [ -z "$ACTION_ID" ]; then
  echo "❌ Création LeadAction échouée"
  FAIL=$((FAIL + 1))
else
  PASS=$((PASS + 1))
  echo "✅ LeadAction créée : $ACTION_ID"
fi

# 2b. Login chauffeur BUS
DRIVER_TOKEN=$(curl -s -X POST "$API_URL/auth/driver-login" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"code":"CO-SON-DR-001","pin":"1234"}' \
  | python -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$DRIVER_TOKEN" ]; then
  echo "❌ Login chauffeur échoué"
  FAIL=$((FAIL + 1))
else
  PASS=$((PASS + 1))
  echo "✅ Chauffeur BUS login OK"
fi

# 2c. Vérifier la notification
NOTIFICATIONS=$(curl -s "$API_URL/notifications?read=false" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

NOTIF_ID=$(echo "$NOTIFICATIONS" | python -c "
import sys,json
notifs = json.load(sys.stdin)
for n in notifs:
    if n.get('leadActionId') == '$ACTION_ID':
        print(n.get('id'))
        break
")

if [ -z "$NOTIF_ID" ]; then
  echo "❌ Notification non reçue"
  FAIL=$((FAIL + 1))
else
  PASS=$((PASS + 1))
  echo "✅ Notification reçue : $NOTIF_ID"
fi

# 2d. Accepter la demande
COURSE=$(curl -s -X POST "$API_URL/actions/$ACTION_ID/accept" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

COURSE_ID=$(echo "$COURSE" | python -c "import sys,json; print(json.load(sys.stdin).get('id',''))")

if [ -z "$COURSE_ID" ]; then
  echo "❌ Acceptation échouée"
  FAIL=$((FAIL + 1))
else
  PASS=$((PASS + 1))
  echo "✅ Course créée : $COURSE_ID"
  
  # Vérifier les montants
  echo "$COURSE" | python -c "
import sys, json
course = json.load(sys.stdin)
print(f'   Prix: {course.get(\"price\")} Ar')
print(f'   Part chauffeur: {course.get(\"montantChauffeur\")} Ar')
print(f'   Part organisation: {course.get(\"montantOrganisation\")} Ar')
"
fi

# 2e. Vérifier que la LeadAction est ACCEPTED
STATUT=$(curl -s "$API_URL/actions/$ACTION_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python -c "import sys,json; print(json.load(sys.stdin).get('statut',''))")

if [ "$STATUT" != "ACCEPTED" ]; then
  echo "❌ LeadAction pas ACCEPTED (statut: $STATUT)"
  FAIL=$((FAIL + 1))
else
  PASS=$((PASS + 1))
  echo "✅ LeadAction ACCEPTED"
fi

echo ""
echo "===== TEST 2 : PASSAGERS + FOURGON (INVALIDE) ====="

# 3. Test négatif : Passagers + FOURGON
RESPONSE=$(curl -s -X POST "$API_URL/public/actions" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "organizationSlug": "sonatra",
    "type": "LONG_HAUL",
    "clientNom": "E2E Invalide",
    "clientTel": "0340000000",
    "details": {
      "typeVehicule": "fourgon",
      "typeService": "passagers",
      "depart": "Antananarivo",
      "arrivee": "Toamasina"
    }
  }')

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/public/actions" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "organizationSlug": "sonatra",
    "type": "LONG_HAUL",
    "clientNom": "E2E Invalide",
    "clientTel": "0340000000",
    "details": {
      "typeVehicule": "fourgon",
      "typeService": "passagers",
      "depart": "Antananarivo",
      "arrivee": "Toamasina"
    }
  }')

if [ "$HTTP_CODE" = "400" ]; then
  PASS=$((PASS + 1))
  echo "✅ Combinaison invalide refusée (HTTP 400)"
else
  FAIL=$((FAIL + 1))
  ERRORS+=("❌ Passagers + fourgon : ATTENDU HTTP 400 mais reçu HTTP $HTTP_CODE")
fi

echo ""
echo "===== NETTOYAGE ====="

# 4. Nettoyer la Course et la LeadAction de test
if [ -n "$COURSE_ID" ]; then
  curl -s -X DELETE "$API_URL/courses/$COURSE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null 2>&1
  echo "✅ Course supprimée : $COURSE_ID"
fi

if [ -n "$ACTION_ID" ]; then
  curl -s -X DELETE "$API_URL/actions/$ACTION_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null 2>&1
  echo "✅ LeadAction supprimée : $ACTION_ID"
fi

echo ""
echo "========================================"
echo "📊 RÉSULTATS E2E"
echo "✅ Validés : $PASS"
echo "❌ Échecs : $FAIL"
echo "========================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "🔴 ERREURS :"
  for err in "${ERRORS[@]}"; do
    echo "  $err"
  done
  exit 1
else
  echo ""
  echo "🟢 TEST E2E LONG_HAUL TERMINÉ AVEC SUCCÈS"
  exit 0
fi
