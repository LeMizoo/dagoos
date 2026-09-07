#!/bin/bash
# ============================================
# TEST AUTOMATISÉ LONG_HAUL MATRIX
# Vérifie les 11 combinaisons valides + 8 invalides
# ============================================

API_URL="https://dagoos-api.onrender.com/api/public/estimate-location"
ORG="sonatra"

PASS=0
FAIL=0
ERRORS=()

echo "🧪 TEST MATRICE LONG_HAUL"
echo "========================================"

# Fonction de test
test_combinaison() {
  local service="$1"
  local vehicule="$2"
  local attendu="$3"  # 0 = valide, 1 = invalide

  local response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"organizationSlug\": \"$ORG\",
      \"type\": \"LONG_HAUL\",
      \"typeVehicule\": \"$vehicule\",
      \"typeService\": \"$service\",
      \"nbPassagers\": 1,
      \"volume\": 1,
      \"depart\": \"Antananarivo\",
      \"arrivee\": \"Toamasina\"
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
      echo "✅ $service + $vehicule : accepté"
    else
      FAIL=$((FAIL + 1))
      ERRORS+=("❌ $service + $vehicule : ATTENDU INVALIDE mais accepté → $response")
    fi
  fi
}

echo ""
echo "📋 COMBINAISONS VALIDES (11)"
echo "----------------------------------------"

test_combinaison "passagers" "bus" 0
test_combinaison "passagers" "minivan" 0

test_combinaison "marchandises" "fourgon" 0
test_combinaison "marchandises" "camion" 0
test_combinaison "marchandises" "camion_frigo" 0
test_combinaison "marchandises" "semi_remorque" 0

test_combinaison "demenagement" "fourgon" 0
test_combinaison "demenagement" "camion" 0

test_combinaison "depannage" "depanneuse" 0

test_combinaison "fret" "camion" 0
test_combinaison "fret" "semi_remorque" 0

echo ""
echo "📋 COMBINAISONS INVALIDES (8)"
echo "----------------------------------------"

test_combinaison "passagers" "fourgon" 1
test_combinaison "passagers" "camion" 1
test_combinaison "passagers" "depanneuse" 1

test_combinaison "marchandises" "bus" 1
test_combinaison "marchandises" "minivan" 1
test_combinaison "marchandises" "depanneuse" 1

test_combinaison "demenagement" "bus" 1
test_combinaison "demenagement" "depanneuse" 1

test_combinaison "depannage" "bus" 1
test_combinaison "depannage" "camion" 1

test_combinaison "fret" "bus" 1
test_combinaison "fret" "depanneuse" 1

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
