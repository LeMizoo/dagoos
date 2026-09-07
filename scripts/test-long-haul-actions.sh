#!/bin/bash
# ============================================
# TEST AUTOMATISÉ LONG_HAUL /actions
# Vérifie que /actions refuse aussi les combinaisons interdites
# ============================================

API_URL="https://dagoos-api.onrender.com/api/public/actions"
ORG="sonatra"

PASS=0
FAIL=0
ERRORS=()

echo "🧪 TEST MATRICE LONG_HAUL /actions"
echo "========================================"

# Fonction de test
test_actions() {
  local service="$1"
  local vehicule="$2"
  local attendu="$3"  # 0 = valide, 1 = invalide

  local response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"organizationSlug\": \"$ORG\",
      \"type\": \"LONG_HAUL\",
      \"clientNom\": \"Test Auto\",
      \"clientTel\": \"0340000000\",
      \"details\": {
        \"typeVehicule\": \"$vehicule\",
        \"typeService\": \"$service\",
        \"nbPassagers\": 1,
        \"volume\": 1,
        \"depart\": \"Antananarivo\",
        \"arrivee\": \"Toamasina\"
      }
    }")

  # Vérifier si la réponse contient une erreur
  if echo "$response" | grep -q "error"; then
    if [ "$attendu" = "0" ]; then
      FAIL=$((FAIL + 1))
      ERRORS+=("❌ $service + $vehicule : ATTENDU VALIDE mais rejeté → $response")
    else
      PASS=$((PASS + 1))
      echo "✅ $service + $vehicule : correctement rejeté"
    fi
  else
    if [ "$attendu" = "0" ]; then
      PASS=$((PASS + 1))
      echo "✅ $service + $vehicule : accepté (LeadAction créée)"
    else
      FAIL=$((FAIL + 1))
      ERRORS+=("❌ $service + $vehicule : ATTENDU INVALIDE mais accepté → $response")
    fi
  fi
}

echo ""
echo "📋 COMBINAISONS VALIDES (11)"
echo "----------------------------------------"

test_actions "passagers" "bus" 0
test_actions "passagers" "minivan" 0

test_actions "marchandises" "fourgon" 0
test_actions "marchandises" "camion" 0
test_actions "marchandises" "camion_frigo" 0
test_actions "marchandises" "semi_remorque" 0

test_actions "demenagement" "fourgon" 0
test_actions "demenagement" "camion" 0

test_actions "depannage" "depanneuse" 0

test_actions "fret" "camion" 0
test_actions "fret" "semi_remorque" 0

echo ""
echo "📋 COMBINAISONS INVALIDES (12)"
echo "----------------------------------------"

test_actions "passagers" "fourgon" 1
test_actions "passagers" "camion" 1
test_actions "passagers" "depanneuse" 1

test_actions "marchandises" "bus" 1
test_actions "marchandises" "minivan" 1
test_actions "marchandises" "depanneuse" 1

test_actions "demenagement" "bus" 1
test_actions "demenagement" "depanneuse" 1

test_actions "depannage" "bus" 1
test_actions "depannage" "camion" 1

test_actions "fret" "bus" 1
test_actions "fret" "depanneuse" 1

echo ""
echo "========================================"
echo "📊 RÉSULTATS"
echo "✅ Valides : $PASS"
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
  echo "🟢 TOUS LES TESTS PASSENT"
  exit 0
fi
