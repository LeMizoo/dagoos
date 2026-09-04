#!/bin/bash
# diagnostic.sh - Diagnostic complet

echo "🔍 DIAGNOSTIC DAGOOS"
echo "===================="
echo ""

# 1. Vérification des services
echo "📡 SERVICES:"
for url in "https://dago-mobility.vercel.app" "https://dagoos-api.onrender.com/health" "https://dago-driver.pages.dev"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "  $url: $status"
done

echo ""
echo "🔐 AUTHENTIFICATION:"

# 2. Test login
if [ -z "${DAGOOS_CHECK_EMAIL:-}" ] || [ -z "${DAGOOS_CHECK_PASSWORD:-}" ]; then
  echo "  ⏭️ Login ignoré : DAGOOS_CHECK_EMAIL / DAGOOS_CHECK_PASSWORD absents"
  token=""
  user=""
else
  response=$(curl -s -X POST https://dagoos-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DAGOOS_CHECK_EMAIL}\",\"password\":\"${DAGOOS_CHECK_PASSWORD}\"}")

  token=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('token', ''))" 2>/dev/null)
  user=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('user', {}).get('name', ''))" 2>/dev/null)
fi

if [ -n "$token" ]; then
  echo "  ✅ Token obtenu: ${token:0:30}..."
  echo "  ✅ Utilisateur: $user"
  
  # 3. Test route protégée
  echo ""
  echo "📊 ROUTES PROTÉGÉES:"
  
  for route in "drivers" "vehicles" "dashboard/stats"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
      -X GET "https://dago-mobility.vercel.app/api/proxy/$route" \
      -H "Authorization: Bearer $token")
    echo "  /api/proxy/$route: $status"
  done
  
else
  echo "  ❌ Échec de l'authentification"
fi

echo ""
echo "📁 FICHIERS CRITIQUES:"
cd /d/Dagoos/admin-next
for file in "lib/api.js" "lib/auth.js" "pages/_app.js" "pages/login.js" "pages/api/proxy/[...path].js"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - MANQUANT"
  fi
done

echo ""
echo "✅ DIAGNOSTIC TERMINÉ"
